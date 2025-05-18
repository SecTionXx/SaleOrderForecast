// authMiddleware.js - Authentication middleware for Express

const authService = require('./authService');
const { hasPermission, getRoleLevel } = require('./roleBasedAccess');

/**
 * Authentication middleware
 * Verifies the JWT token in the request header
 */
function authenticate(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No authorization token provided' });
  }
  
  // Check if the header has the correct format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Invalid authorization format' });
  }
  
  const token = parts[1];
  
  // Verify token
  const verification = authService.verifyToken(token);
  
  if (!verification.valid) {
    // Check if token is expired but can be refreshed
    if (verification.error === 'jwt expired') {
      try {
        // Try to refresh the token
        const refreshResult = authService.refreshToken(token);
        if (refreshResult.success) {
          // Set the new token in the response header
          res.set('X-New-Token', refreshResult.token);
          
          // Add user info to request object
          req.user = refreshResult.user;
          
          // Continue to the next middleware or route handler
          return next();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }
    
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: verification.error });
  }
  
  // Get the latest user data to ensure we have current role/permissions
  const userResult = authService.getUserById(verification.user.id);
  
  if (!userResult.success) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }
  
  // Add user info to request object
  req.user = {
    ...verification.user,
    role: userResult.user.role // Ensure we use the most up-to-date role
  };
  
  // Add session info to request
  req.session = {
    lastActive: new Date(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  // Continue to the next middleware or route handler
  next();
}

/**
 * Role-based authorization middleware
 * @param {string} role - Required role to access the route
 */
function authorize(role) {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Check if user has the required role level
    const userRoleLevel = getRoleLevel(req.user.role);
    const requiredRoleLevel = getRoleLevel(role);
    
    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    // User has the required role, continue
    next();
  };
}

/**
 * Permission-based authorization middleware
 * @param {string} permission - Required permission to access the route
 */
function requirePermission(permission) {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Check if user has the required permission
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    // User has the required permission, continue
    next();
  };
}

/**
 * Multiple permissions check middleware
 * @param {string[]} permissions - Array of permissions to check
 * @param {boolean} requireAll - If true, user must have all permissions; if false, any one is sufficient
 */
function requirePermissions(permissions, requireAll = true) {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    let hasAccess = false;
    
    if (requireAll) {
      // User must have all specified permissions
      hasAccess = permissions.every(permission => hasPermission(req.user, permission));
    } else {
      // User needs at least one of the specified permissions
      hasAccess = permissions.some(permission => hasPermission(req.user, permission));
    }
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    // User has the required permissions, continue
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  requirePermissions
};

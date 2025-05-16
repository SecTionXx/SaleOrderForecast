// authMiddleware.js - Authentication middleware for Express

const { verifyToken, hasRole } = require('./authService');

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
  const verification = verifyToken(token);
  
  if (!verification.valid) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: verification.error });
  }
  
  // Add user info to request object
  req.user = verification.user;
  
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
    
    // Check if user has the required role
    if (!hasRole(req.user, role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    
    // User has the required role, continue
    next();
  };
}

module.exports = {
  authenticate,
  authorize
};

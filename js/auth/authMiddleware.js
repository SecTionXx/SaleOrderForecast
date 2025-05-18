/**
 * authMiddleware.js - Enhanced Authentication Middleware for Express
 * Provides robust JWT authentication, token verification, and role-based access control
 */

const jwt = require('jsonwebtoken');
const { logDebug, logError } = require('../utils/logger');
const authService = require('./authService');
const { hasPermission, getRoleLevel } = require('./roleBasedAccess');
const config = require('../config');

/**
 * Authentication middleware
 * Verifies the JWT token in the request header and adds user info to the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticate(req, res, next) {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      error: 'missing_token'
    });
  }
  
  // Check if the header has the correct format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format',
      error: 'invalid_format'
    });
  }
  
  const token = parts[1];
  
  // Verify token
  try {
    const verification = authService.verifyToken(token);
    
    if (!verification.valid) {
      // Check if token is expired but can be refreshed
      if (verification.error === 'jwt expired') {
        try {
          // Try to refresh the token
          const refreshResult = authService.refreshToken(token, req.cookies?.refreshToken);
          
          if (refreshResult.success) {
            // Set the new token in the response header
            res.set('X-New-Token', refreshResult.token);
            
            // Set refresh token in HTTP-only cookie if provided
            if (refreshResult.refreshToken) {
              res.cookie('refreshToken', refreshResult.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: config.auth.refreshTokenExpiry * 1000
              });
            }
            
            // Add user info to request object
            req.user = refreshResult.user;
            
            // Continue to the next middleware or route handler
            return next();
          }
        } catch (error) {
          logError('Token refresh error:', error);
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: verification.error
      });
    }
    
    // Get the latest user data to ensure we have current role/permissions
    const userResult = authService.getUserById(verification.user.id);
    
    if (!userResult.success) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'user_not_found'
      });
    }
    
    // Add user info to request object
    req.user = {
      ...verification.user,
      role: userResult.user.role, // Ensure we use the most up-to-date role
      permissions: userResult.user.permissions || []
    };
    
    // Add session info to request
    req.session = {
      lastActive: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: verification.user.sessionId
    };
    
    // Update last activity timestamp
    authService.updateSessionActivity(verification.user.sessionId);
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    logError('Authentication error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'auth_error'
    });
  }
}

/**
 * Role-based authorization middleware
 * @param {string} role - Required role to access the route
 * @returns {Function} - Middleware function
 */
function authorize(role) {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'auth_required'
      });
    }
    
    // Check if user has the required role level
    const userRoleLevel = getRoleLevel(req.user.role);
    const requiredRoleLevel = getRoleLevel(role);
    
    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'insufficient_role',
        required: role,
        current: req.user.role
      });
    }
    
    // User has the required role, continue
    next();
  };
}

/**
 * Permission-based authorization middleware
 * @param {string} permission - Required permission to access the route
 * @returns {Function} - Middleware function
 */
function requirePermission(permission) {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'auth_required'
      });
    }
    
    // Check if user has the required permission
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'insufficient_permission',
        required: permission
      });
    }
    
    // User has the required permission, continue
    next();
  };
}

/**
 * Multiple permissions check middleware
 * @param {string[]} permissions - Array of permissions to check
 * @param {boolean} requireAll - If true, user must have all permissions; if false, any one is sufficient
 * @returns {Function} - Middleware function
 */
function requirePermissions(permissions, requireAll = true) {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'auth_required'
      });
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
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'insufficient_permissions',
        required: permissions,
        requireAll
      });
    }
    
    // User has the required permissions, continue
    next();
  };
}

/**
 * API rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @returns {Function} - Middleware function
 */
function rateLimit(options = {}) {
  const defaultOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    headers: true,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip
  };
  
  const opts = { ...defaultOptions, ...options };
  const requests = new Map();
  
  // Clean up old requests periodically
  const interval = setInterval(() => {
    const now = Date.now();
    requests.forEach((value, key) => {
      if (now - value.timestamp > opts.windowMs) {
        requests.delete(key);
      }
    });
  }, opts.windowMs);
  
  // Ensure interval is cleaned up when the process exits
  process.on('exit', () => {
    clearInterval(interval);
  });
  
  return (req, res, next) => {
    // Generate key for this request
    const key = typeof opts.keyGenerator === 'function'
      ? opts.keyGenerator(req)
      : req.ip;
    
    // Get current time
    const now = Date.now();
    
    // Get or create request record
    const requestRecord = requests.get(key) || {
      count: 0,
      timestamp: now,
      resetTime: now + opts.windowMs
    };
    
    // Check if window has expired
    if (now - requestRecord.timestamp > opts.windowMs) {
      requestRecord.count = 0;
      requestRecord.timestamp = now;
      requestRecord.resetTime = now + opts.windowMs;
    }
    
    // Increment request count
    requestRecord.count++;
    
    // Update request record
    requests.set(key, requestRecord);
    
    // Set rate limit headers if enabled
    if (opts.headers) {
      res.setHeader('X-RateLimit-Limit', opts.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.max - requestRecord.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(requestRecord.resetTime / 1000));
    }
    
    // Check if rate limit exceeded
    if (requestRecord.count > opts.max) {
      return res.status(opts.statusCode).json({
        success: false,
        message: opts.message,
        error: 'rate_limit_exceeded',
        retryAfter: Math.ceil((requestRecord.resetTime - now) / 1000)
      });
    }
    
    // Add response handler to track successful/failed requests
    if (opts.skipSuccessfulRequests || opts.skipFailedRequests) {
      const originalEnd = res.end;
      res.end = function(...args) {
        // Check if we should skip counting this request
        if ((opts.skipSuccessfulRequests && res.statusCode < 400) ||
            (opts.skipFailedRequests && res.statusCode >= 400)) {
          requestRecord.count--;
          requests.set(key, requestRecord);
        }
        
        originalEnd.apply(this, args);
      };
    }
    
    // Continue to next middleware
    next();
  };
}

/**
 * CORS middleware
 * @param {Object} options - CORS options
 * @returns {Function} - Middleware function
 */
function cors(options = {}) {
  const defaultOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Content-Type,Authorization',
    exposedHeaders: 'X-New-Token'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  return (req, res, next) => {
    // Set CORS headers
    const origin = typeof opts.origin === 'function'
      ? opts.origin(req)
      : opts.origin;
    
    res.setHeader('Access-Control-Allow-Origin', origin);
    
    if (opts.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    if (opts.exposedHeaders) {
      res.setHeader('Access-Control-Expose-Headers', opts.exposedHeaders);
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', opts.methods);
      
      if (opts.allowedHeaders) {
        res.setHeader('Access-Control-Allow-Headers', opts.allowedHeaders);
      }
      
      if (opts.maxAge) {
        res.setHeader('Access-Control-Max-Age', opts.maxAge);
      }
      
      if (opts.preflightContinue) {
        next();
      } else {
        res.statusCode = opts.optionsSuccessStatus;
        res.end();
      }
    } else {
      next();
    }
  };
}

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  requirePermissions,
  rateLimit,
  cors
};

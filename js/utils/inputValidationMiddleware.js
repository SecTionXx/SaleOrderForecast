/**
 * inputValidationMiddleware.js - Server-side input validation middleware
 * Validates and sanitizes incoming request data to prevent security vulnerabilities
 */

const { validateObject } = require('./validator');
const { logError, logDebug } = require('./logger');

/**
 * Sanitize a string by removing potentially dangerous HTML/script content
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (input === null || input === undefined) {
    return '';
  }
  
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;');
}

/**
 * Sanitize an object by sanitizing all string properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Create a validation middleware with schema
 * @param {Object} schema - Validation schema
 * @param {boolean} sanitize - Whether to sanitize input
 * @returns {Function} - Express middleware
 */
function validateRequest(schema, sanitize = true) {
  return (req, res, next) => {
    try {
      // Determine which part of the request to validate based on schema
      const validationTargets = {
        body: req.body,
        query: req.query,
        params: req.params
      };
      
      // Track validation errors
      const errors = {};
      let hasErrors = false;
      
      // Validate and sanitize each target if schema exists
      Object.keys(schema).forEach(target => {
        if (schema[target] && validationTargets[target]) {
          // Sanitize input if enabled
          if (sanitize) {
            validationTargets[target] = sanitizeObject(validationTargets[target]);
          }
          
          // Validate against schema
          const targetErrors = validateObject(validationTargets[target], schema[target]);
          
          if (Object.keys(targetErrors).length > 0) {
            errors[target] = targetErrors;
            hasErrors = true;
          }
          
          // Update request with sanitized data
          req[target] = validationTargets[target];
        }
      });
      
      // If validation errors, return 400 with error details
      if (hasErrors) {
        logDebug('Validation failed:', errors);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      // Continue to next middleware if validation passes
      next();
    } catch (error) {
      logError('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during input validation'
      });
    }
  };
}

/**
 * Sanitize all request inputs (body, query, params)
 * @returns {Function} - Express middleware
 */
function sanitizeInputs() {
  return (req, res, next) => {
    try {
      // Sanitize body, query, and params
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      
      if (req.query) {
        req.query = sanitizeObject(req.query);
      }
      
      if (req.params) {
        req.params = sanitizeObject(req.params);
      }
      
      next();
    } catch (error) {
      logError('Sanitization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during input sanitization'
      });
    }
  };
}

/**
 * Content Security Policy middleware
 * @returns {Function} - Express middleware
 */
function setSecurityHeaders() {
  return (req, res, next) => {
    // Set Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' https://cdn.jsdelivr.net; " +
      "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://sheets.googleapis.com; " +
      "font-src 'self' https://cdn.jsdelivr.net;"
    );
    
    // Set other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  };
}

module.exports = {
  validateRequest,
  sanitizeInputs,
  setSecurityHeaders,
  sanitizeString,
  sanitizeObject
};

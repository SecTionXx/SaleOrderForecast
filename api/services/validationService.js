/**
 * validationService.js - Server-side Data Validation Service
 * Provides comprehensive validation for data before processing or storage
 */

const { sanitizeObject, sanitizeString } = require('../../js/utils/sanitizer');

/**
 * Common validation types with their validation functions
 */
const validationTypes = {
  string: (value) => typeof value === 'string',
  number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  integer: (value) => Number.isInteger(Number(value)),
  boolean: (value) => typeof value === 'boolean' || value === 'true' || value === 'false',
  date: (value) => !isNaN(new Date(value).getTime()),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value),
  phone: (value) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value),
  zipCode: (value) => /^\d{5}(-\d{4})?$/.test(value),
  currency: (value) => /^\$?\d+(,\d{3})*(\.\d{1,2})?$/.test(value),
  percentage: (value) => /^\d+(\.\d{1,2})?%?$/.test(value),
  array: (value) => Array.isArray(value),
  object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value)
};

/**
 * Validation schemas for different data types
 */
const validationSchemas = {
  // Deal schema
  deal: {
    customerName: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[A-Za-z0-9\s\-&.,'"()]+$/
    },
    projectName: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[A-Za-z0-9\s\-&.,'"()]+$/
    },
    dealStage: {
      type: 'string',
      required: true,
      enum: ['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']
    },
    dealValue: {
      type: 'number',
      required: true,
      min: 0
    },
    probability: {
      type: 'number',
      required: true,
      min: 0,
      max: 100
    },
    closeDate: {
      type: 'date',
      required: true
    },
    salesRep: {
      type: 'string',
      required: true
    },
    lossReason: {
      type: 'string',
      requiredIf: (data) => data.dealStage === 'closed-lost',
      maxLength: 500
    },
    notes: {
      type: 'string',
      maxLength: 1000
    }
  },
  
  // Forecast parameters schema
  forecastParams: {
    forecastPeriods: {
      type: 'integer',
      min: 1,
      max: 24,
      default: 3
    },
    confidenceLevel: {
      type: 'number',
      min: 0.5,
      max: 0.99,
      default: 0.95
    },
    seasonalityPattern: {
      type: 'string',
      enum: ['auto', 'monthly', 'quarterly', 'yearly', 'none'],
      default: 'auto'
    },
    includeOutliers: {
      type: 'boolean',
      default: false
    }
  },
  
  // User schema
  user: {
    username: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[A-Za-z0-9_-]+$/
    },
    email: {
      type: 'email',
      required: true
    },
    password: {
      type: 'string',
      required: true,
      minLength: 8,
      // Require at least one uppercase, one lowercase, one number, and one special character
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    },
    role: {
      type: 'string',
      enum: ['admin', 'editor', 'viewer'],
      default: 'viewer'
    }
  }
};

/**
 * Validate a single value against a schema rule
 * @param {any} value - Value to validate
 * @param {Object} rule - Validation rule
 * @param {Object} data - Complete data object (for conditional validation)
 * @returns {Object} - Validation result with isValid and error properties
 */
function validateValue(value, rule, data = {}) {
  // Check if value is required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: 'This field is required'
    };
  }
  
  // Check conditional requirements
  if (rule.requiredIf && rule.requiredIf(data) && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: 'This field is required based on other values'
    };
  }
  
  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return { isValid: true };
  }
  
  // Check data type
  if (rule.type && validationTypes[rule.type]) {
    if (!validationTypes[rule.type](value)) {
      return {
        isValid: false,
        error: `Must be a valid ${rule.type}`
      };
    }
  }
  
  // Check enum values
  if (rule.enum && !rule.enum.includes(value)) {
    return {
      isValid: false,
      error: `Value must be one of: ${rule.enum.join(', ')}`
    };
  }
  
  // String validations
  if (typeof value === 'string') {
    // Check minLength
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return {
        isValid: false,
        error: `Must be at least ${rule.minLength} characters`
      };
    }
    
    // Check maxLength
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return {
        isValid: false,
        error: `Cannot exceed ${rule.maxLength} characters`
      };
    }
    
    // Check pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        isValid: false,
        error: rule.patternMessage || 'Invalid format'
      };
    }
  }
  
  // Number validations
  if (rule.type === 'number' || rule.type === 'integer') {
    const numValue = Number(value);
    
    // Check min value
    if (rule.min !== undefined && numValue < rule.min) {
      return {
        isValid: false,
        error: `Must be at least ${rule.min}`
      };
    }
    
    // Check max value
    if (rule.max !== undefined && numValue > rule.max) {
      return {
        isValid: false,
        error: `Cannot exceed ${rule.max}`
      };
    }
  }
  
  // Date validations
  if (rule.type === 'date') {
    const dateValue = new Date(value);
    
    // Check min date
    if (rule.minDate && dateValue < new Date(rule.minDate)) {
      return {
        isValid: false,
        error: `Date must be on or after ${rule.minDate}`
      };
    }
    
    // Check max date
    if (rule.maxDate && dateValue > new Date(rule.maxDate)) {
      return {
        isValid: false,
        error: `Date must be on or before ${rule.maxDate}`
      };
    }
    
    // Check future date
    if (rule.future && dateValue <= new Date()) {
      return {
        isValid: false,
        error: 'Date must be in the future'
      };
    }
    
    // Check past date
    if (rule.past && dateValue >= new Date()) {
      return {
        isValid: false,
        error: 'Date must be in the past'
      };
    }
  }
  
  // Array validations
  if (rule.type === 'array') {
    // Check min items
    if (rule.minItems !== undefined && value.length < rule.minItems) {
      return {
        isValid: false,
        error: `Must contain at least ${rule.minItems} items`
      };
    }
    
    // Check max items
    if (rule.maxItems !== undefined && value.length > rule.maxItems) {
      return {
        isValid: false,
        error: `Cannot contain more than ${rule.maxItems} items`
      };
    }
    
    // Check items schema
    if (rule.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = validateValue(value[i], rule.items, data);
        if (!itemResult.isValid) {
          return {
            isValid: false,
            error: `Item at index ${i} is invalid: ${itemResult.error}`
          };
        }
      }
    }
  }
  
  // Object validations
  if (rule.type === 'object' && rule.properties) {
    const objectResult = validateObject(value, rule.properties);
    if (!objectResult.isValid) {
      return {
        isValid: false,
        error: objectResult.errors
      };
    }
  }
  
  // Custom validation function
  if (rule.validate && typeof rule.validate === 'function') {
    const customResult = rule.validate(value, data);
    if (customResult !== true) {
      return {
        isValid: false,
        error: customResult || 'Invalid value'
      };
    }
  }
  
  // All validations passed
  return { isValid: true };
}

/**
 * Validate an object against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation result with isValid and errors properties
 */
function validateObject(data, schema) {
  const errors = {};
  let isValid = true;
  
  // Sanitize data first
  const sanitizedData = sanitizeObject(data);
  
  // Check each field in the schema
  for (const field in schema) {
    const rule = schema[field];
    const value = sanitizedData[field];
    
    const result = validateValue(value, rule, sanitizedData);
    
    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  }
  
  // Check for unknown fields if strict mode is enabled
  if (schema._strict) {
    for (const field in sanitizedData) {
      if (!schema[field] && field !== '_strict') {
        errors[field] = 'Unknown field';
        isValid = false;
      }
    }
  }
  
  return { isValid, errors };
}

/**
 * Get a validation schema by name
 * @param {string} schemaName - Name of the schema to get
 * @returns {Object|null} - Validation schema or null if not found
 */
function getSchema(schemaName) {
  return validationSchemas[schemaName] || null;
}

/**
 * Validate request data against a schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {boolean} - Whether validation passed
 */
function validateRequest(req, res, schemaName) {
  const schema = getSchema(schemaName);
  
  if (!schema) {
    console.error(`Validation schema '${schemaName}' not found`);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid validation schema',
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  const result = validateObject(req.body, schema);
  
  if (!result.isValid) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'The request data failed validation',
      details: result.errors,
      timestamp: new Date().toISOString()
    });
    return false;
  }
  
  return true;
}

/**
 * Express middleware for request validation
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} - Express middleware function
 */
function validationMiddleware(schemaName) {
  return (req, res, next) => {
    if (validateRequest(req, res, schemaName)) {
      next();
    }
  };
}

module.exports = {
  validateValue,
  validateObject,
  validateRequest,
  validationMiddleware,
  getSchema,
  validationSchemas
};

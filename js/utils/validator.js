/**
 * validator.js - Validation Utility
 * Provides consistent validation across the application
 */

import { createValidationError } from './errorHandler.js';
import { logDebug } from './logger.js';

// Validation rule types
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  MIN_LENGTH: 'min_length',
  MAX_LENGTH: 'max_length',
  PATTERN: 'pattern',
  EMAIL: 'email',
  NUMBER: 'number',
  MIN_VALUE: 'min_value',
  MAX_VALUE: 'max_value',
  DATE: 'date',
  DATE_RANGE: 'date_range',
  EQUALS: 'equals',
  CUSTOM: 'custom'
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  ALPHA: /^[a-zA-Z]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^[0-9]+$/,
  INTEGER: /^-?\d+$/,
  DECIMAL: /^-?\d+(\.\d+)?$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

/**
 * Validate a single value against a rule
 * @param {*} value - Value to validate
 * @param {Object} rule - Validation rule
 * @param {Object} allValues - All form values (for cross-field validation)
 * @returns {string|null} - Error message or null if valid
 */
function validateRule(value, rule, allValues = {}) {
  const { type, message } = rule;
  
  // Skip validation if value is empty and not required
  if ((value === undefined || value === null || value === '') && 
      type !== VALIDATION_RULES.REQUIRED) {
    return null;
  }
  
  switch (type) {
    case VALIDATION_RULES.REQUIRED:
      if (value === undefined || value === null || value === '') {
        return message || 'This field is required';
      }
      break;
      
    case VALIDATION_RULES.MIN_LENGTH:
      if (String(value).length < rule.min) {
        return message || `Must be at least ${rule.min} characters`;
      }
      break;
      
    case VALIDATION_RULES.MAX_LENGTH:
      if (String(value).length > rule.max) {
        return message || `Must be no more than ${rule.max} characters`;
      }
      break;
      
    case VALIDATION_RULES.PATTERN:
      if (!rule.pattern.test(String(value))) {
        return message || 'Invalid format';
      }
      break;
      
    case VALIDATION_RULES.EMAIL:
      if (!VALIDATION_PATTERNS.EMAIL.test(String(value))) {
        return message || 'Invalid email address';
      }
      break;
      
    case VALIDATION_RULES.NUMBER:
      if (isNaN(Number(value))) {
        return message || 'Must be a number';
      }
      break;
      
    case VALIDATION_RULES.MIN_VALUE:
      if (Number(value) < rule.min) {
        return message || `Must be at least ${rule.min}`;
      }
      break;
      
    case VALIDATION_RULES.MAX_VALUE:
      if (Number(value) > rule.max) {
        return message || `Must be no more than ${rule.max}`;
      }
      break;
      
    case VALIDATION_RULES.DATE:
      if (isNaN(Date.parse(value))) {
        return message || 'Invalid date';
      }
      break;
      
    case VALIDATION_RULES.DATE_RANGE:
      const date = new Date(value);
      if (rule.min && date < new Date(rule.min)) {
        return message || `Date must be on or after ${rule.min}`;
      }
      if (rule.max && date > new Date(rule.max)) {
        return message || `Date must be on or before ${rule.max}`;
      }
      break;
      
    case VALIDATION_RULES.EQUALS:
      const targetValue = rule.field ? allValues[rule.field] : rule.value;
      if (value !== targetValue) {
        return message || `Must match ${rule.field || 'expected value'}`;
      }
      break;
      
    case VALIDATION_RULES.CUSTOM:
      if (typeof rule.validate === 'function') {
        const result = rule.validate(value, allValues);
        if (result !== true) {
          return message || result || 'Invalid value';
        }
      }
      break;
      
    default:
      logDebug(`Unknown validation rule type: ${type}`);
      break;
  }
  
  return null;
}

/**
 * Validate a value against multiple rules
 * @param {*} value - Value to validate
 * @param {Array} rules - Array of validation rules
 * @param {Object} allValues - All form values (for cross-field validation)
 * @returns {string|null} - First error message or null if valid
 */
function validateValue(value, rules, allValues = {}) {
  if (!Array.isArray(rules)) {
    return null;
  }
  
  for (const rule of rules) {
    const error = validateRule(value, rule, allValues);
    if (error) {
      return error;
    }
  }
  
  return null;
}

/**
 * Validate an object against a schema
 * @param {Object} values - Values to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation errors by field
 */
function validateObject(values, schema) {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = values[field];
    
    const error = validateValue(value, rules, values);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
}

/**
 * Validate a form
 * @param {Object} values - Form values
 * @param {Object} schema - Validation schema
 * @throws {AppError} - Throws validation error if validation fails
 */
function validateForm(values, schema) {
  const errors = validateObject(values, schema);
  
  if (Object.keys(errors).length > 0) {
    throw createValidationError('Form validation failed', errors);
  }
}

/**
 * Check if a form is valid
 * @param {Object} values - Form values
 * @param {Object} schema - Validation schema
 * @returns {boolean} - Whether the form is valid
 */
function isFormValid(values, schema) {
  const errors = validateObject(values, schema);
  return Object.keys(errors).length === 0;
}

/**
 * Create a required validation rule
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function required(message) {
  return {
    type: VALIDATION_RULES.REQUIRED,
    message
  };
}

/**
 * Create a min length validation rule
 * @param {number} min - Minimum length
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function minLength(min, message) {
  return {
    type: VALIDATION_RULES.MIN_LENGTH,
    min,
    message
  };
}

/**
 * Create a max length validation rule
 * @param {number} max - Maximum length
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function maxLength(max, message) {
  return {
    type: VALIDATION_RULES.MAX_LENGTH,
    max,
    message
  };
}

/**
 * Create a pattern validation rule
 * @param {RegExp} pattern - Regular expression pattern
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function pattern(pattern, message) {
  return {
    type: VALIDATION_RULES.PATTERN,
    pattern,
    message
  };
}

/**
 * Create an email validation rule
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function email(message) {
  return {
    type: VALIDATION_RULES.EMAIL,
    message
  };
}

/**
 * Create a number validation rule
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function number(message) {
  return {
    type: VALIDATION_RULES.NUMBER,
    message
  };
}

/**
 * Create a min value validation rule
 * @param {number} min - Minimum value
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function minValue(min, message) {
  return {
    type: VALIDATION_RULES.MIN_VALUE,
    min,
    message
  };
}

/**
 * Create a max value validation rule
 * @param {number} max - Maximum value
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function maxValue(max, message) {
  return {
    type: VALIDATION_RULES.MAX_VALUE,
    max,
    message
  };
}

/**
 * Create a date validation rule
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function date(message) {
  return {
    type: VALIDATION_RULES.DATE,
    message
  };
}

/**
 * Create a date range validation rule
 * @param {Date|string} min - Minimum date
 * @param {Date|string} max - Maximum date
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function dateRange(min, max, message) {
  return {
    type: VALIDATION_RULES.DATE_RANGE,
    min,
    max,
    message
  };
}

/**
 * Create an equals validation rule
 * @param {string} field - Field to compare with
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function equals(field, message) {
  return {
    type: VALIDATION_RULES.EQUALS,
    field,
    message
  };
}

/**
 * Create a custom validation rule
 * @param {Function} validate - Validation function
 * @param {string} message - Custom error message
 * @returns {Object} - Validation rule
 */
function custom(validate, message) {
  return {
    type: VALIDATION_RULES.CUSTOM,
    validate,
    message
  };
}

// Export validation functions
export {
  validateRule,
  validateValue,
  validateObject,
  validateForm,
  isFormValid,
  required,
  minLength,
  maxLength,
  pattern,
  email,
  number,
  minValue,
  maxValue,
  date,
  dateRange,
  equals,
  custom
};

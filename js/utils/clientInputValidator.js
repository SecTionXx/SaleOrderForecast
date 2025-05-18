/**
 * clientInputValidator.js - Client-side input validation and sanitization
 * Provides functions to validate and sanitize user inputs on the client side
 */

import { validateValue, validateObject } from './validator.js';
import { sanitizeString, sanitizeObject, sanitizeFormData } from './sanitizer.js';
import { logDebug } from './logger.js';

/**
 * Validate and sanitize form input on input/change events
 * @param {HTMLElement} input - Input element
 * @param {Array} rules - Validation rules
 * @param {Function} onError - Error callback
 * @param {Function} onSuccess - Success callback
 * @param {boolean} sanitize - Whether to sanitize input
 */
export function validateAndSanitizeInput(input, rules, onError, onSuccess, sanitize = true) {
  // Get input value
  let value = input.value;
  
  // Sanitize input if enabled
  if (sanitize && typeof value === 'string') {
    value = sanitizeString(value);
    input.value = value; // Update input with sanitized value
  }
  
  // Validate input
  const error = validateValue(value, rules);
  
  if (error) {
    if (typeof onError === 'function') {
      onError(input, error);
    }
  } else if (typeof onSuccess === 'function') {
    onSuccess(input);
  }
  
  return !error;
}

/**
 * Validate and sanitize a form
 * @param {HTMLFormElement} form - Form element
 * @param {Object} schema - Validation schema
 * @param {Function} onError - Error callback
 * @param {boolean} sanitize - Whether to sanitize inputs
 * @returns {Object} - Validation result with isValid and errors properties
 */
export function validateAndSanitizeForm(form, schema, onError, sanitize = true) {
  // Collect form data
  const formData = new FormData(form);
  const values = {};
  
  // Convert FormData to object and sanitize
  for (const [key, value] of formData.entries()) {
    values[key] = sanitize && typeof value === 'string' ? sanitizeString(value) : value;
    
    // Update form inputs with sanitized values
    if (sanitize && typeof value === 'string') {
      const input = form.elements[key];
      if (input) {
        input.value = values[key];
      }
    }
  }
  
  // Validate form data
  const errors = validateObject(values, schema);
  const isValid = Object.keys(errors).length === 0;
  
  // Call error callback if provided
  if (!isValid && typeof onError === 'function') {
    onError(errors);
  }
  
  return { isValid, errors, values };
}

/**
 * Attach input validation to form elements
 * @param {HTMLFormElement} form - Form element
 * @param {Object} schema - Validation schema
 * @param {Object} options - Options
 */
export function attachFormValidation(form, schema, options = {}) {
  const {
    validateOnInput = true,
    validateOnChange = true,
    validateOnBlur = true,
    sanitizeInputs = true,
    errorClass = 'is-invalid',
    validClass = 'is-valid',
    errorSelector = '.invalid-feedback',
    onSubmit = null
  } = options;
  
  // Process each field in the schema
  Object.keys(schema).forEach(fieldName => {
    const input = form.elements[fieldName];
    if (!input) return;
    
    const rules = schema[fieldName];
    const errorElement = input.parentNode.querySelector(errorSelector);
    
    // Handle showing/hiding error messages
    const showError = (element, message) => {
      element.classList.add(errorClass);
      element.classList.remove(validClass);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    };
    
    const showSuccess = (element) => {
      element.classList.remove(errorClass);
      element.classList.add(validClass);
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    };
    
    // Attach event listeners
    if (validateOnInput) {
      input.addEventListener('input', () => {
        validateAndSanitizeInput(input, rules, showError, showSuccess, sanitizeInputs);
      });
    }
    
    if (validateOnChange) {
      input.addEventListener('change', () => {
        validateAndSanitizeInput(input, rules, showError, showSuccess, sanitizeInputs);
      });
    }
    
    if (validateOnBlur) {
      input.addEventListener('blur', () => {
        validateAndSanitizeInput(input, rules, showError, showSuccess, sanitizeInputs);
      });
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', (event) => {
    // Prevent default form submission
    event.preventDefault();
    
    // Validate and sanitize form
    const result = validateAndSanitizeForm(form, schema, (errors) => {
      // Show errors for each field
      Object.keys(errors).forEach(fieldName => {
        const input = form.elements[fieldName];
        if (input) {
          const errorElement = input.parentNode.querySelector(errorSelector);
          input.classList.add(errorClass);
          input.classList.remove(validClass);
          if (errorElement) {
            errorElement.textContent = errors[fieldName];
            errorElement.style.display = 'block';
          }
        }
      });
    }, sanitizeInputs);
    
    // Call onSubmit callback if form is valid
    if (result.isValid && typeof onSubmit === 'function') {
      onSubmit(result.values, form);
    }
  });
}

/**
 * Sanitize URL parameters to prevent XSS in query strings
 * @returns {Object} - Sanitized URL parameters
 */
export function getSanitizedUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = sanitizeString(value);
  }
  
  return result;
}

/**
 * Sanitize data before sending to server
 * @param {Object|FormData} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
export function sanitizeRequestData(data) {
  if (data instanceof FormData) {
    return sanitizeFormData(data);
  } else if (typeof data === 'object' && data !== null) {
    return sanitizeObject(data);
  }
  return data;
}

/**
 * errorHandler.js - Error Handling Utility
 * Provides consistent error handling across the application
 */

import { logError } from './logger.js';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network_error',
  API: 'api_error',
  AUTHENTICATION: 'authentication_error',
  VALIDATION: 'validation_error',
  PERMISSION: 'permission_error',
  NOT_FOUND: 'not_found_error',
  TIMEOUT: 'timeout_error',
  UNKNOWN: 'unknown_error'
};

// Error severity levels
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  /**
   * Create a new application error
   * @param {string} message - Error message
   * @param {string} type - Error type from ERROR_TYPES
   * @param {Object} details - Additional error details
   * @param {string} severity - Error severity from ERROR_SEVERITY
   */
  constructor(message, type = ERROR_TYPES.UNKNOWN, details = {}, severity = ERROR_SEVERITY.ERROR) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle API error responses
 * @param {Error} error - The error object
 * @returns {AppError} - Standardized application error
 */
export function handleApiError(error) {
  // Default values
  let message = 'An unexpected error occurred';
  let type = ERROR_TYPES.UNKNOWN;
  let details = {};
  let severity = ERROR_SEVERITY.ERROR;
  
  // Extract response from error if available
  const response = error.response || {};
  const status = response.status || 0;
  
  // Determine error type and severity based on status code
  if (status >= 400 && status < 500) {
    if (status === 401) {
      type = ERROR_TYPES.AUTHENTICATION;
      message = 'Authentication failed. Please log in again.';
    } else if (status === 403) {
      type = ERROR_TYPES.PERMISSION;
      message = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      type = ERROR_TYPES.NOT_FOUND;
      message = 'The requested resource was not found.';
    } else if (status === 422) {
      type = ERROR_TYPES.VALIDATION;
      message = 'Validation failed. Please check your input.';
    } else {
      type = ERROR_TYPES.API;
      message = 'The request could not be processed.';
    }
    severity = ERROR_SEVERITY.WARNING;
  } else if (status >= 500) {
    type = ERROR_TYPES.API;
    message = 'A server error occurred. Please try again later.';
    severity = ERROR_SEVERITY.ERROR;
  } else if (error.message && error.message.includes('timeout')) {
    type = ERROR_TYPES.TIMEOUT;
    message = 'The request timed out. Please try again.';
    severity = ERROR_SEVERITY.WARNING;
  } else if (error.message && (
    error.message.includes('Network Error') || 
    error.message.includes('Failed to fetch') ||
    error.message.includes('network')
  )) {
    type = ERROR_TYPES.NETWORK;
    message = 'A network error occurred. Please check your connection.';
    severity = ERROR_SEVERITY.WARNING;
  }
  
  // Extract error details from response
  if (response.data) {
    details = {
      ...details,
      data: response.data
    };
    
    // Use server-provided message if available
    if (response.data.message) {
      message = response.data.message;
    }
    
    // Use server-provided error details if available
    if (response.data.errors) {
      details.errors = response.data.errors;
    }
  }
  
  // Add status code to details if available
  if (status) {
    details.status = status;
  }
  
  // Add original error message to details
  details.originalMessage = error.message;
  
  // Create and return standardized error
  const appError = new AppError(message, type, details, severity);
  
  // Log the error
  logError(message, appError);
  
  return appError;
}

/**
 * Display error message to the user
 * @param {AppError|Error|string} error - Error to display
 * @param {Function} displayFn - Function to display the error (defaults to console.error)
 */
export function displayError(error, displayFn = console.error) {
  let message = '';
  let type = ERROR_TYPES.UNKNOWN;
  let severity = ERROR_SEVERITY.ERROR;
  
  if (error instanceof AppError) {
    message = error.message;
    type = error.type;
    severity = error.severity;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }
  
  // Use provided display function
  displayFn({
    message,
    type,
    severity
  });
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} validationErrors - Validation errors by field
 * @returns {AppError} - Validation error
 */
export function createValidationError(message, validationErrors = {}) {
  return new AppError(
    message || 'Validation failed',
    ERROR_TYPES.VALIDATION,
    { validationErrors },
    ERROR_SEVERITY.WARNING
  );
}

/**
 * Create an authentication error
 * @param {string} message - Error message
 * @returns {AppError} - Authentication error
 */
export function createAuthError(message) {
  return new AppError(
    message || 'Authentication failed',
    ERROR_TYPES.AUTHENTICATION,
    {},
    ERROR_SEVERITY.ERROR
  );
}

/**
 * Create a permission error
 * @param {string} message - Error message
 * @returns {AppError} - Permission error
 */
export function createPermissionError(message) {
  return new AppError(
    message || 'Permission denied',
    ERROR_TYPES.PERMISSION,
    {},
    ERROR_SEVERITY.ERROR
  );
}

/**
 * Create a not found error
 * @param {string} resource - Resource that was not found
 * @returns {AppError} - Not found error
 */
export function createNotFoundError(resource) {
  return new AppError(
    `${resource || 'Resource'} not found`,
    ERROR_TYPES.NOT_FOUND,
    { resource },
    ERROR_SEVERITY.WARNING
  );
}

/**
 * Global error handler for promise rejections
 * @param {Event} event - Unhandled rejection event
 */
export function handleUnhandledRejection(event) {
  const error = event.reason;
  logError('Unhandled Promise Rejection:', error);
  
  // Prevent default browser handling
  event.preventDefault();
  
  // Display error to user if it's an AppError
  if (error instanceof AppError) {
    displayError(error);
  }
}

// Register global error handlers
window.addEventListener('unhandledrejection', handleUnhandledRejection);

/**
 * Error Handling Utility
 * Centralized error handling for the application
 */

import { logError, logWarn } from './logger.js';
import { appState } from '../state/appState.js';

// Custom error codes
const ERROR_CODES = {
  // Authentication errors (1000-1099)
  AUTH_REQUIRED: 1001,
  INVALID_CREDENTIALS: 1002,
  SESSION_EXPIRED: 1003,
  PERMISSION_DENIED: 1004,
  
  // Validation errors (1100-1199)
  VALIDATION_ERROR: 1100,
  INVALID_INPUT: 1101,
  MISSING_REQUIRED_FIELD: 1102,
  
  // API errors (1200-1299)
  API_ERROR: 1200,
  NETWORK_ERROR: 1201,
  TIMEOUT_ERROR: 1202,
  
  // Data errors (1300-1399)
  DATA_NOT_FOUND: 1300,
  DUPLICATE_ENTRY: 1301,
  
  // System errors (1400-1499)
  UNEXPECTED_ERROR: 1400,
  NOT_IMPLEMENTED: 1401,
  MAINTENANCE_MODE: 1402
};

/**
 * Custom Error class for application errors
 */
class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} [details] - Additional error details
   * @param {boolean} [isUserFacing] - Whether to show the error to users
   */
  constructor(message, code = ERROR_CODES.UNEXPECTED_ERROR, details = {}, isUserFacing = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.isUserFacing = isUserFacing;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace, excluding constructor call from it
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Create an AppError from another error
   * @param {Error} error - Original error
   * @param {Object} options - Options for the new error
   * @returns {AppError}
   */
  static fromError(error, options = {}) {
    if (error instanceof AppError) return error;
    
    const { 
      message = error.message || 'An unexpected error occurred',
      code = ERROR_CODES.UNEXPECTED_ERROR,
      details = {},
      isUserFacing = false
    } = options;
    
    const appError = new AppError(message, code, {
      ...details,
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }, isUserFacing);
    
    return appError;
  }
}

/**
 * Handle an error that occurs in the application
 * @param {Error|AppError|string} error - The error to handle
 * @param {Object} [options] - Additional options
 * @param {string} [options.context] - Context where the error occurred
 * @param {boolean} [options.showToUser] - Whether to show the error to the user
 * @param {Function} [options.onError] - Callback to handle the error
 * @returns {AppError} The processed error
 */
function handleError(error, options = {}) {
  const {
    context = 'Unknown context',
    showToUser = false,
    onError
  } = options;
  
  // Convert to AppError if it isn't already
  const appError = error instanceof AppError 
    ? error 
    : AppError.fromError(error, { isUserFacing: showToUser });
  
  // Log the error
  logError(`[${context}] ${appError.message}`, appError);
  
  // Show to user if needed
  if (showToUser || appError.isUserFacing) {
    showErrorToUser(appError);
  }
  
  // Update application state
  updateErrorState(appError);
  
  // Call custom error handler if provided
  if (typeof onError === 'function') {
    try {
      onError(appError);
    } catch (handlerError) {
      logError('Error in custom error handler', handlerError);
    }
  }
  
  return appError;
}

/**
 * Show an error to the user
 * @param {AppError} error - The error to show
 * @private
 */
function showErrorToUser(error) {
  // This would typically show a toast or modal to the user
  // For now, we'll just log it as a warning
  const userMessage = error.isUserFacing 
    ? error.message 
    : 'An unexpected error occurred. Please try again.';
  
  logWarn(`[USER] ${userMessage}`);
  
  // In a real app, you might do something like:
  // showToast(userMessage, { type: 'error' });
}

/**
 * Update application state with error information
 * @param {AppError} error - The error to store
 * @private
 */
function updateErrorState(error) {
  // Update app state with the error
  appState.setState({
    lastError: {
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      isUserFacing: error.isUserFacing,
      details: error.details
    }
  });
}

/**
 * Setup global error handlers
 */
function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions
  window.onerror = function(message, source, lineno, colno, error) {
    handleError(error || message, {
      context: 'Global',
      showToUser: false
    });
    
    // Let the default handler run
    return false;
  };
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason || new Error('Unhandled promise rejection');
    handleError(error, {
      context: 'UnhandledRejection',
      showToUser: false
    });
  });
  
  logInfo('Global error handlers initialized');
}

// Export the error handler and error codes
export {
  handleError,
  AppError,
  ERROR_CODES,
  setupGlobalErrorHandlers as setupErrorHandling
};

// For debugging
if (typeof window !== 'undefined') {
  window.errorHandler = {
    handleError,
    AppError,
    ERROR_CODES
  };
}

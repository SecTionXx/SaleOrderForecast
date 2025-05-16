/**
 * logger.js - Logging utility
 * Provides consistent logging functionality throughout the application
 */

/**
 * Log a debug message
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
function logDebug(message, data = null) {
  if (window.DEBUG && window.DEBUG.debug) {
    window.DEBUG.debug('App', message, data);
  } else {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [App] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [App] ${message}`);
    }
  }
}

/**
 * Log an error message
 * @param {string} message - The error message
 * @param {Error|any} error - The error object or data
 */
function logError(message, error = null) {
  if (window.DEBUG && window.DEBUG.error) {
    window.DEBUG.error('App', message, error);
  } else {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[${timestamp}] [App] ${message}`, error);
    } else {
      console.error(`[${timestamp}] [App] ${message}`);
    }
  }
}

/**
 * Log a warning message
 * @param {string} message - The warning message
 * @param {any} data - Optional data to log
 */
function logWarning(message, data = null) {
  if (window.DEBUG && window.DEBUG.warn) {
    window.DEBUG.warn('App', message, data);
  } else {
    const timestamp = new Date().toISOString();
    if (data) {
      console.warn(`[${timestamp}] [App] ${message}`, data);
    } else {
      console.warn(`[${timestamp}] [App] ${message}`);
    }
  }
}

/**
 * Log an info message
 * @param {string} message - The info message
 * @param {any} data - Optional data to log
 */
function logInfo(message, data = null) {
  if (window.DEBUG && window.DEBUG.info) {
    window.DEBUG.info('App', message, data);
  } else {
    const timestamp = new Date().toISOString();
    if (data) {
      console.info(`[${timestamp}] [App] ${message}`, data);
    } else {
      console.info(`[${timestamp}] [App] ${message}`);
    }
  }
}

// Export functions
export {
  logDebug,
  logError,
  logWarning,
  logInfo
};

/**
 * Logging Utility
 * Provides consistent logging throughout the application with different log levels
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Default log level (can be overridden)
let currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Log level names for display
const levelNames = {
  [LOG_LEVELS.DEBUG]: 'DEBUG',
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.ERROR]: 'ERROR'
};

// Colors for different log levels (browser console)
const levelColors = {
  [LOG_LEVELS.DEBUG]: '#888',
  [LOG_LEVELS.INFO]: '#1E88E5',
  [LOG_LEVELS.WARN]: '#FB8C00',
  [LOG_LEVELS.ERROR]: '#E53935'
};

/**
 * Format a log message with timestamp and log level
 * @private
 */
function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const levelName = levelNames[level] || 'LOG';
  const prefix = `[${timestamp}] [${levelName}]`;
  
  // If first argument is an object with stack (Error), format it specially
  if (args[0] && typeof args[0] === 'object' && args[0].stack) {
    const error = args[0];
    return `${prefix} ${message}\n${error.stack || error.message}`;
  }
  
  // For normal logging
  return [`${prefix} ${message}`, ...args];
}

/**
 * Log a debug message
 * @param {string} message - The message to log
 * @param {...any} args - Additional data to log
 */
export function logDebug(message, ...args) {
  if (currentLogLevel > LOG_LEVELS.DEBUG) return;
  
  const formatted = formatMessage(LOG_LEVELS.DEBUG, message, ...args);
  
  if (typeof console !== 'undefined') {
    console.log('%c%s', `color: ${levelColors[LOG_LEVELS.DEBUG]};`, ...formatted);
  }
}

/**
 * Log an info message
 * @param {string} message - The message to log
 * @param {...any} args - Additional data to log
 */
export function logInfo(message, ...args) {
  if (currentLogLevel > LOG_LEVELS.INFO) return;
  
  const formatted = formatMessage(LOG_LEVELS.INFO, message, ...args);
  
  if (typeof console !== 'undefined') {
    console.info('%c%s', `color: ${levelColors[LOG_LEVELS.INFO]};`, ...formatted);
  }
}

/**
 * Log a warning message
 * @param {string} message - The message to log
 * @param {...any} args - Additional data to log
 */
export function logWarn(message, ...args) {
  if (currentLogLevel > LOG_LEVELS.WARN) return;
  
  const formatted = formatMessage(LOG_LEVELS.WARN, message, ...args);
  
  if (typeof console !== 'undefined') {
    console.warn('%c%s', `color: ${levelColors[LOG_LEVELS.WARN]};`, ...formatted);
  }
}

/**
 * Log an error message
 * @param {string} message - The message to log
 * @param {Error|Object} [error] - Optional error object
 * @param {...any} args - Additional data to log
 */
export function logError(message, error, ...args) {
  if (currentLogLevel > LOG_LEVELS.ERROR) return;
  
  // If second argument is an error, include its stack trace
  const errorObj = error instanceof Error ? error : 
                 error && error.message ? error : 
                 new Error(message);
  
  const formatted = formatMessage(
    LOG_LEVELS.ERROR, 
    message, 
    errorObj,
    ...(error === errorObj ? args : [error, ...args])
  );
  
  if (typeof console !== 'undefined') {
    console.error('%c%s', `color: ${levelColors[LOG_LEVELS.ERROR]};`, ...formatted);
  }
  
  // In production, you might want to send errors to a logging service
  // logToService('error', { message, error: errorObj, ...args });
}

/**
 * Set the current log level
 * @param {string} level - The log level ('debug', 'info', 'warn', 'error', 'none')
 */
export function setLogLevel(level) {
  const levelMap = {
    debug: LOG_LEVELS.DEBUG,
    info: LOG_LEVELS.INFO,
    warn: LOG_LEVELS.WARN,
    error: LOG_LEVELS.ERROR,
    none: LOG_LEVELS.NONE
  };
  
  const newLevel = levelMap[level.toLowerCase()] ?? LOG_LEVELS.INFO;
  
  if (newLevel !== currentLogLevel) {
    const oldLevelName = levelNames[currentLogLevel] || 'UNKNOWN';
    currentLogLevel = newLevel;
    logInfo(`Log level changed from ${oldLevelName} to ${levelNames[newLevel] || level}`);
  }
}

/**
 * Get the current log level
 * @returns {string} The current log level name
 */
export function getLogLevel() {
  return Object.entries(levelNames).find(([level]) => 
    parseInt(level) === currentLogLevel
  )?.[1] || 'UNKNOWN';
}

// Export log levels
export const LOG_LEVEL = {
  ...LOG_LEVELS,
  NAMES: levelNames
};

// For debugging
if (typeof window !== 'undefined') {
  window.logger = {
    debug: logDebug,
    info: logInfo,
    warn: logWarn,
    error: logError,
    setLevel: setLogLevel,
    getLevel: getLogLevel,
    LEVEL: LOG_LEVEL
  };
}

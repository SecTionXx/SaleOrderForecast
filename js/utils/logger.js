/**
 * logger.js - Enhanced Logging Utility
 * Provides comprehensive logging with support for different log levels,
 * module-based logging, and integration with external monitoring services
 * Compatible with both browser and Node.js environments
 */

// Detect environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const isNode = !isBrowser && typeof process !== 'undefined' && typeof process.versions !== 'undefined';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4 // Use to disable logging
};

// Log level names for display
const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'NONE'
};

// Default configuration
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableTimestamps: true,
  enableModuleNames: true,
  consoleOutput: true,
  remoteLogging: false,
  remoteLogEndpoint: '/api/v1/logs',
  maxRemoteLogLevel: LOG_LEVELS.ERROR, // Only send ERROR logs to remote by default
  errorSamplingRate: 1.0, // Send all errors by default
  bufferSize: 10, // Number of logs to buffer before sending to remote
  localStorage: {
    enabled: true,
    key: 'orderforecast_logs',
    maxEntries: 100
  }
};

// Current configuration (initialized with defaults)
let config = { ...DEFAULT_CONFIG };

// Buffer for remote logs
let logBuffer = [];
let remoteLogTimer = null;
const LOCAL_STORAGE_KEY = 'orderForecast_logs';

// Environment-specific storage and API functions
const env = {
  // Local storage functions
  localStorage: {
    getItem: (key) => {
      if (isBrowser && localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key, value) => {
      if (isBrowser && localStorage) {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key) => {
      if (isBrowser && localStorage) {
        localStorage.removeItem(key);
      }
    }
  },
  // Timer functions
  timer: {
    setInterval: (callback, ms) => {
      return isBrowser ? window.setInterval(callback, ms) : setInterval(callback, ms);
    },
    clearInterval: (id) => {
      if (isBrowser) {
        window.clearInterval(id);
      } else {
        clearInterval(id);
      }
    }
  }
};

/**
 * Configure the logger
 * @param {Object} newConfig - Configuration options
 */
function configure(newConfig = {}) {
  config = { ...config, ...newConfig };
  
  // Apply log level from localStorage if available and not explicitly set
  if (newConfig.level === undefined && config.localStorage.enabled) {
    try {
      const savedLevel = env.localStorage.getItem('orderForecast_log_level');
      if (savedLevel !== null) {
        config.level = parseInt(savedLevel, 10);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  // Save log level to localStorage if enabled
  if (config.localStorage.enabled) {
    try {
      env.localStorage.setItem('orderForecast_log_level', config.level.toString());
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Format a log message with timestamp and module name
 * @param {string} level - Log level
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, module, message) {
  const parts = [];
  
  // Add timestamp if enabled
  if (config.enableTimestamps) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  // Add log level
  parts.push(`[${LOG_LEVEL_NAMES[level]}]`);
  
  // Add module name if enabled and provided
  if (config.enableModuleNames && module) {
    parts.push(`[${module}]`);
  }
  
  // Add message
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Store log in localStorage if enabled
 * @param {Object} logEntry - Log entry to store
 */
function storeLogLocally(logEntry) {
  // Skip if local logging is disabled or not in browser environment
  if (!config.localStorage.enabled || !isBrowser) return;
  
  try {
    // Get existing logs
    const logs = JSON.parse(env.localStorage.getItem(config.localStorage.key) || '[]');
    
    // Add new log
    logs.push(logEntry);
    
    // Trim logs if needed
    if (logs.length > config.localStorage.maxEntries) {
      logs.splice(0, logs.length - config.localStorage.maxEntries);
    }
    
    // Store logs
    env.localStorage.setItem(config.localStorage.key, JSON.stringify(logs));
  } catch (error) {
    console.error('Error storing log locally:', error);
  }
}

/**
 * Add log to remote buffer and send if buffer is full
 * @param {Object} logEntry - Log entry to buffer
 */
function bufferRemoteLog(logEntry) {
  if (!config.remoteLogging) return;
  
  // Only log levels at or above maxRemoteLogLevel are sent to remote
  if (logEntry.level < config.maxRemoteLogLevel) return;
  
  // For errors, apply sampling rate
  if (logEntry.level === LOG_LEVELS.ERROR && Math.random() > config.errorSamplingRate) {
    return;
  }
  
  // Add to buffer
  logBuffer.push(logEntry);
  
  // Send logs if buffer is full
  if (logBuffer.length >= config.remoteLogBatchSize) {
    sendRemoteLogs();
  }
  
  // Set up timer to send logs if not already set
  if (!remoteLogTimer && config.remoteLogInterval > 0) {
    remoteLogTimer = env.timer.setInterval(() => {
      if (logBuffer.length > 0) {
        sendRemoteLogs();
      }
    }, config.remoteLogInterval);
  }
}

/**
 * Send buffered logs to remote endpoint
 */
function sendRemoteLogs() {
  if (!config.remoteLogging || logBuffer.length === 0) return;

  // Clone and clear buffer
  const logsToSend = [...logBuffer];
  logBuffer = [];

  // Prepare payload
  const payload = JSON.stringify({
    logs: logsToSend,
    app: 'OrderForecast',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });

  if (isBrowser) {
    // Browser environment - use fetch API
    try {
      fetch(config.remoteLogEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload,
        keepalive: true
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error sending logs to remote endpoint:', error);
        // Add logs back to buffer for retry
        logBuffer = [...logsToSend, ...logBuffer];
      });
    } catch (error) {
      console.error('Error sending logs to remote endpoint:', error);
      // Add logs back to buffer for retry
      logBuffer = [...logsToSend, ...logBuffer];
    }
  } else if (isNode) {
    // In Node.js environment, just log to console for now
    // This simplifies our implementation and avoids ES module issues
    console.log('[Remote Log]', JSON.stringify(logsToSend, null, 2));
  }
}

/**
 * Create a log entry
 * @param {number} level - Log level
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
function createLog(level, module, message, data) {
  // Skip if log level is higher than current level
  if (level < config.level) return;
  
  // Create log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    levelName: LOG_LEVEL_NAMES[level],
    module,
    message,
    data: data !== undefined ? data : null
  };
  
  // Output to console if enabled
  if (config.consoleOutput) {
    const formattedMessage = formatLogMessage(level, module, message);
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(formattedMessage, data !== undefined ? data : '');
        break;
      case LOG_LEVELS.INFO:
        console.info(formattedMessage, data !== undefined ? data : '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(formattedMessage, data !== undefined ? data : '');
        break;
      case LOG_LEVELS.ERROR:
        console.error(formattedMessage, data !== undefined ? data : '');
        break;
    }
  }
  
  // Store log locally
  storeLogLocally(logEntry);
  
  // Buffer for remote logging
  bufferRemoteLog(logEntry);
}

/**
 * Log a debug message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
function logDebug(module, message, data) {
  // Handle case where module is omitted
  if (arguments.length === 1) {
    createLog(LOG_LEVELS.DEBUG, null, module, undefined);
  } else if (arguments.length === 2 && typeof message !== 'string') {
    createLog(LOG_LEVELS.DEBUG, null, module, message);
  } else {
    createLog(LOG_LEVELS.DEBUG, module, message, data);
  }
}

/**
 * Log an info message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
function logInfo(module, message, data) {
  // Handle case where module is omitted
  if (arguments.length === 1) {
    createLog(LOG_LEVELS.INFO, null, module, undefined);
  } else if (arguments.length === 2 && typeof message !== 'string') {
    createLog(LOG_LEVELS.INFO, null, module, message);
  } else {
    createLog(LOG_LEVELS.INFO, module, message, data);
  }
}

/**
 * Log a warning message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} data - Additional data
 */
function logWarn(module, message, data) {
  // Handle case where module is omitted
  if (arguments.length === 1) {
    createLog(LOG_LEVELS.WARN, null, module, undefined);
  } else if (arguments.length === 2 && typeof message !== 'string') {
    createLog(LOG_LEVELS.WARN, null, module, message);
  } else {
    createLog(LOG_LEVELS.WARN, module, message, data);
  }
}

/**
 * Log an error message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} error - Error object or additional data
 */
function logError(module, message, error) {
  // Handle case where module is omitted
  if (arguments.length === 1) {
    createLog(LOG_LEVELS.ERROR, null, module, undefined);
  } else if (arguments.length === 2 && typeof message !== 'string') {
    createLog(LOG_LEVELS.ERROR, null, module, message);
  } else {
    createLog(LOG_LEVELS.ERROR, module, message, error);
  }
}

/**
 * Set the current log level
 * @param {number} level - The log level to set
 */
function setLogLevel(level) {
  if (level in LOG_LEVEL_NAMES) {
    config.level = level;
    
    // Save to localStorage if enabled
    if (config.localStorage.enabled) {
      try {
        localStorage.setItem('orderforecast_log_level', level.toString());
      } catch (e) {
        // Ignore localStorage errors
      }
    }
    
    logInfo('Logger', `Log level set to ${LOG_LEVEL_NAMES[level]}`);
  }
}

/**
 * Get logs from localStorage
 * @returns {Array} - Array of log entries
 */
function getStoredLogs() {
  // Skip if local logging is disabled or not in browser environment
  if (!config.localStorage.enabled || !isBrowser) return [];
  
  try {
    // Get logs from localStorage
    const logs = JSON.parse(env.localStorage.getItem(config.localStorage.key) || '[]');
    return logs;
  } catch (error) {
    console.error('Error getting stored logs:', error);
    return [];
  }
}

/**
 * Clear stored logs
 */
function clearStoredLogs() {
  // Skip if local logging is disabled or not in browser environment
  if (!config.localStorage.enabled || !isBrowser) return;
  
  try {
    // Clear logs from localStorage
    env.localStorage.removeItem(config.localStorage.key);
  } catch (error) {
    console.error('Error clearing stored logs:', error);
  }
}

/**
 * Create a logger instance for a specific module
 * @param {string} moduleName - Module name
 * @returns {Object} - Logger instance
 */
function createLogger(moduleName) {
  return {
    debug: (message, data) => logDebug(moduleName, message, data),
    info: (message, data) => logInfo(moduleName, message, data),
    warn: (message, data) => logWarn(moduleName, message, data),
    error: (message, error) => logError(moduleName, message, error)
  };
}

// Initialize logger with default configuration
configure();

// Flush logs on page unload (browser only)
if (isBrowser) {
  window.addEventListener('beforeunload', () => {
    if (config.remoteLogging && logBuffer.length > 0) {
      // Use sendBeacon for more reliable delivery during page unload
      try {
        navigator.sendBeacon(config.remoteLogEndpoint, JSON.stringify({
          logs: logBuffer,
          app: 'OrderForecast',
          version: window.APP_VERSION || 'unknown',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        // Fallback to fetch with keepalive
        sendRemoteLogs();
      }
    }
  });
}

// Export functions
export {
  LOG_LEVELS,
  logDebug,
  logInfo,
  logWarn,
  logError,
  setLogLevel,
  configure,
  getStoredLogs,
  clearStoredLogs,
  createLogger,
  sendRemoteLogs
};

/**
 * logger.js - Comprehensive logging utility for debugging
 * 
 * This utility provides consistent logging across the application with
 * timestamp, log level, and source information. It also supports
 * logging to the console, DOM elements, and localStorage for persistence.
 */

// Configuration
const LOG_CONFIG = {
  // Log levels in order of severity
  LEVELS: {
    DEBUG: { value: 0, color: '#6c757d', label: 'DEBUG' },
    INFO: { value: 1, color: '#0d6efd', label: 'INFO' },
    WARN: { value: 2, color: '#ffc107', label: 'WARN' },
    ERROR: { value: 3, color: '#dc3545', label: 'ERROR' },
    CRITICAL: { value: 4, color: '#721c24', label: 'CRITICAL' }
  },
  // Current log level - logs below this level won't be shown
  CURRENT_LEVEL: 'DEBUG',
  // Maximum number of logs to keep in localStorage
  MAX_LOGS: 1000,
  // Whether to show logs in the DOM
  SHOW_IN_DOM: true,
  // Whether to store logs in localStorage
  STORE_IN_LOCAL: true,
  // localStorage key for logs
  STORAGE_KEY: 'orderforecast_logs'
};

/**
 * Main logger class
 */
class Logger {
  constructor() {
    this.logs = [];
    this.loadLogsFromStorage();
    this.setupLogContainer();
  }

  /**
   * Load logs from localStorage if available
   */
  loadLogsFromStorage() {
    if (LOG_CONFIG.STORE_IN_LOCAL) {
      try {
        const storedLogs = localStorage.getItem(LOG_CONFIG.STORAGE_KEY);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      } catch (error) {
        console.error('Failed to load logs from localStorage:', error);
        // Reset logs if there was an error
        localStorage.removeItem(LOG_CONFIG.STORAGE_KEY);
        this.logs = [];
      }
    }
  }

  /**
   * Save logs to localStorage
   */
  saveLogsToStorage() {
    if (LOG_CONFIG.STORE_IN_LOCAL) {
      try {
        // Trim logs if they exceed the maximum
        if (this.logs.length > LOG_CONFIG.MAX_LOGS) {
          this.logs = this.logs.slice(-LOG_CONFIG.MAX_LOGS);
        }
        localStorage.setItem(LOG_CONFIG.STORAGE_KEY, JSON.stringify(this.logs));
      } catch (error) {
        console.error('Failed to save logs to localStorage:', error);
      }
    }
  }

  /**
   * Setup the log container in the DOM
   */
  setupLogContainer() {
    if (LOG_CONFIG.SHOW_IN_DOM && typeof document !== 'undefined') {
      // Check if container already exists
      let container = document.getElementById('logger-container');
      
      if (!container) {
        // Create container
        container = document.createElement('div');
        container.id = 'logger-container';
        container.style.cssText = `
          position: fixed;
          bottom: 0;
          right: 0;
          width: 400px;
          max-height: 300px;
          overflow-y: auto;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          font-family: monospace;
          font-size: 12px;
          padding: 10px;
          z-index: 9999;
          border-top-left-radius: 5px;
          display: none;
        `;
        
        // Create header with controls
        const header = document.createElement('div');
        header.style.cssText = `
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding-bottom: 5px;
          border-bottom: 1px solid #555;
        `;
        
        const title = document.createElement('span');
        title.textContent = 'Debug Logs';
        title.style.fontWeight = 'bold';
        
        const controls = document.createElement('div');
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = `
          background: #555;
          color: white;
          border: none;
          padding: 2px 5px;
          margin-left: 5px;
          cursor: pointer;
          font-size: 10px;
        `;
        clearBtn.onclick = () => this.clearLogs();
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
          background: #555;
          color: white;
          border: none;
          padding: 2px 5px;
          margin-left: 5px;
          cursor: pointer;
          font-size: 10px;
        `;
        closeBtn.onclick = () => {
          container.style.display = 'none';
        };
        
        controls.appendChild(clearBtn);
        controls.appendChild(closeBtn);
        
        header.appendChild(title);
        header.appendChild(controls);
        
        // Create log content area
        const content = document.createElement('div');
        content.id = 'logger-content';
        
        container.appendChild(header);
        container.appendChild(content);
        
        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'logger-toggle';
        toggleBtn.textContent = 'Show Logs';
        toggleBtn.style.cssText = `
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: #0d6efd;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          z-index: 9999;
        `;
        toggleBtn.onclick = () => {
          if (container.style.display === 'none') {
            container.style.display = 'block';
            toggleBtn.textContent = 'Hide Logs';
          } else {
            container.style.display = 'none';
            toggleBtn.textContent = 'Show Logs';
          }
        };
        
        // Add to document when it's ready
        if (document.body) {
          document.body.appendChild(container);
          document.body.appendChild(toggleBtn);
        } else {
          window.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(container);
            document.body.appendChild(toggleBtn);
          });
        }
      }
    }
  }

  /**
   * Add a log entry to the DOM
   */
  addLogToDOM(logEntry) {
    if (LOG_CONFIG.SHOW_IN_DOM && typeof document !== 'undefined') {
      const container = document.getElementById('logger-content');
      if (container) {
        const logElement = document.createElement('div');
        logElement.style.cssText = `
          margin-bottom: 3px;
          border-bottom: 1px solid #333;
          padding-bottom: 3px;
          word-wrap: break-word;
        `;
        
        const levelSpan = document.createElement('span');
        levelSpan.textContent = `[${logEntry.level}]`;
        levelSpan.style.color = LOG_CONFIG.LEVELS[logEntry.level].color;
        levelSpan.style.fontWeight = 'bold';
        
        const timeSpan = document.createElement('span');
        timeSpan.textContent = ` ${new Date(logEntry.timestamp).toLocaleTimeString()} `;
        
        const sourceSpan = document.createElement('span');
        sourceSpan.textContent = `(${logEntry.source}): `;
        sourceSpan.style.color = '#aaa';
        
        const messageSpan = document.createElement('span');
        
        // Handle objects and arrays
        if (typeof logEntry.message === 'object') {
          try {
            messageSpan.textContent = JSON.stringify(logEntry.message);
          } catch (e) {
            messageSpan.textContent = '[Object]';
          }
        } else {
          messageSpan.textContent = logEntry.message;
        }
        
        logElement.appendChild(levelSpan);
        logElement.appendChild(timeSpan);
        logElement.appendChild(sourceSpan);
        logElement.appendChild(messageSpan);
        
        container.appendChild(logElement);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  /**
   * Log a message with the specified level
   */
  log(level, source, message, data = null) {
    // Check if level is valid
    if (!LOG_CONFIG.LEVELS[level]) {
      level = 'INFO';
    }
    
    // Check if level is above current level
    if (LOG_CONFIG.LEVELS[level].value < LOG_CONFIG.LEVELS[LOG_CONFIG.CURRENT_LEVEL].value) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    
    // Format the log message
    let formattedMessage = message;
    if (data !== null) {
      try {
        if (typeof data === 'object') {
          formattedMessage += ' ' + JSON.stringify(data);
        } else {
          formattedMessage += ' ' + data;
        }
      } catch (e) {
        formattedMessage += ' [Object]';
      }
    }
    
    // Create log entry
    const logEntry = {
      timestamp,
      level,
      source,
      message: formattedMessage
    };
    
    // Add to logs array
    this.logs.push(logEntry);
    
    // Save to localStorage
    this.saveLogsToStorage();
    
    // Add to DOM
    this.addLogToDOM(logEntry);
    
    // Log to console with color
    const consoleMethod = level === 'ERROR' || level === 'CRITICAL' 
      ? console.error 
      : level === 'WARN' 
        ? console.warn 
        : console.log;
    
    consoleMethod(
      `%c[${level}]%c ${timestamp} %c(${source}):%c ${formattedMessage}`,
      `color: ${LOG_CONFIG.LEVELS[level].color}; font-weight: bold;`,
      'color: #888;',
      'color: #aaa;',
      'color: inherit;'
    );
    
    return logEntry;
  }

  /**
   * Log a debug message
   */
  debug(source, message, data = null) {
    return this.log('DEBUG', source, message, data);
  }

  /**
   * Log an info message
   */
  info(source, message, data = null) {
    return this.log('INFO', source, message, data);
  }

  /**
   * Log a warning message
   */
  warn(source, message, data = null) {
    return this.log('WARN', source, message, data);
  }

  /**
   * Log an error message
   */
  error(source, message, data = null) {
    return this.log('ERROR', source, message, data);
  }

  /**
   * Log a critical message
   */
  critical(source, message, data = null) {
    return this.log('CRITICAL', source, message, data);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
    
    const container = document.getElementById('logger-content');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Get all logs
   */
  getAllLogs() {
    return this.logs;
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Set the current log level
   */
  setLogLevel(level) {
    if (LOG_CONFIG.LEVELS[level]) {
      LOG_CONFIG.CURRENT_LEVEL = level;
    }
  }
}

// Create a singleton instance
const logger = new Logger();

// Export the logger
export default logger;

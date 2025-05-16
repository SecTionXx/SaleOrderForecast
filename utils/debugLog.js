/**
 * debugLog.js - Simple logging utility for non-module scripts
 * 
 * This is a simplified version of the logger utility that can be used
 * in non-module scripts via a simple script tag.
 */

// Create the global debug object if it doesn't exist
window.DEBUG = window.DEBUG || {};

// Configuration
DEBUG.CONFIG = {
  // Whether debugging is enabled
  ENABLED: true,
  // Current log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
  LEVEL: 'DEBUG',
  // Whether to show logs in the DOM
  SHOW_IN_DOM: true,
  // Maximum number of logs to show in the DOM
  MAX_DOM_LOGS: 100,
  // Whether to store logs in localStorage
  STORE_IN_LOCAL: true,
  // localStorage key for logs
  STORAGE_KEY: 'orderforecast_debug_logs',
  // Maximum number of logs to keep in localStorage
  MAX_STORED_LOGS: 1000
};

// Log levels
DEBUG.LEVELS = {
  DEBUG: { value: 0, color: '#6c757d', label: 'DEBUG' },
  INFO: { value: 1, color: '#0d6efd', label: 'INFO' },
  WARN: { value: 2, color: '#ffc107', label: 'WARN' },
  ERROR: { value: 3, color: '#dc3545', label: 'ERROR' },
  CRITICAL: { value: 4, color: '#721c24', label: 'CRITICAL' }
};

// Initialize logs array
DEBUG.logs = [];

// Load logs from localStorage
DEBUG.loadLogs = function() {
  if (DEBUG.CONFIG.STORE_IN_LOCAL) {
    try {
      const storedLogs = localStorage.getItem(DEBUG.CONFIG.STORAGE_KEY);
      if (storedLogs) {
        DEBUG.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Failed to load debug logs from localStorage:', error);
      localStorage.removeItem(DEBUG.CONFIG.STORAGE_KEY);
      DEBUG.logs = [];
    }
  }
};

// Save logs to localStorage
DEBUG.saveLogs = function() {
  if (DEBUG.CONFIG.STORE_IN_LOCAL) {
    try {
      // Trim logs if they exceed the maximum
      if (DEBUG.logs.length > DEBUG.CONFIG.MAX_STORED_LOGS) {
        DEBUG.logs = DEBUG.logs.slice(-DEBUG.CONFIG.MAX_STORED_LOGS);
      }
      localStorage.setItem(DEBUG.CONFIG.STORAGE_KEY, JSON.stringify(DEBUG.logs));
    } catch (error) {
      console.error('Failed to save debug logs to localStorage:', error);
    }
  }
};

// Setup the log container in the DOM
DEBUG.setupContainer = function() {
  if (DEBUG.CONFIG.SHOW_IN_DOM) {
    // Check if container already exists
    let container = document.getElementById('debug-container');
    
    if (!container) {
      // Create container
      container = document.createElement('div');
      container.id = 'debug-container';
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
      clearBtn.onclick = DEBUG.clearLogs;
      
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
      closeBtn.onclick = function() {
        container.style.display = 'none';
        document.getElementById('debug-toggle').textContent = 'Show Debug';
      };
      
      controls.appendChild(clearBtn);
      controls.appendChild(closeBtn);
      
      header.appendChild(title);
      header.appendChild(controls);
      
      // Create log content area
      const content = document.createElement('div');
      content.id = 'debug-content';
      
      container.appendChild(header);
      container.appendChild(content);
      
      // Add toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'debug-toggle';
      toggleBtn.textContent = 'Show Debug';
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
      toggleBtn.onclick = function() {
        if (container.style.display === 'none') {
          container.style.display = 'block';
          toggleBtn.textContent = 'Hide Debug';
        } else {
          container.style.display = 'none';
          toggleBtn.textContent = 'Show Debug';
        }
      };
      
      document.body.appendChild(container);
      document.body.appendChild(toggleBtn);
    }
  }
};

// Add a log entry to the DOM
DEBUG.addLogToDOM = function(logEntry) {
  if (DEBUG.CONFIG.SHOW_IN_DOM) {
    const container = document.getElementById('debug-content');
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
      levelSpan.style.color = DEBUG.LEVELS[logEntry.level].color;
      levelSpan.style.fontWeight = 'bold';
      
      const timeSpan = document.createElement('span');
      timeSpan.textContent = ` ${new Date(logEntry.timestamp).toLocaleTimeString()} `;
      
      const sourceSpan = document.createElement('span');
      sourceSpan.textContent = `(${logEntry.source}): `;
      sourceSpan.style.color = '#aaa';
      
      const messageSpan = document.createElement('span');
      messageSpan.textContent = logEntry.message;
      
      logElement.appendChild(levelSpan);
      logElement.appendChild(timeSpan);
      logElement.appendChild(sourceSpan);
      logElement.appendChild(messageSpan);
      
      container.appendChild(logElement);
      
      // Limit the number of logs in the DOM
      while (container.children.length > DEBUG.CONFIG.MAX_DOM_LOGS) {
        container.removeChild(container.firstChild);
      }
      
      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
    }
  }
};

// Log a message
DEBUG.log = function(level, source, message, data) {
  if (!DEBUG.CONFIG.ENABLED) {
    return;
  }
  
  // Check if level is valid
  if (!DEBUG.LEVELS[level]) {
    level = 'INFO';
  }
  
  // Check if level is above current level
  if (DEBUG.LEVELS[level].value < DEBUG.LEVELS[DEBUG.CONFIG.LEVEL].value) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  
  // Format the log message
  let formattedMessage = message;
  if (data !== undefined) {
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
  DEBUG.logs.push(logEntry);
  
  // Save to localStorage
  DEBUG.saveLogs();
  
  // Add to DOM
  DEBUG.addLogToDOM(logEntry);
  
  // Log to console with color
  const consoleMethod = level === 'ERROR' || level === 'CRITICAL' 
    ? console.error 
    : level === 'WARN' 
      ? console.warn 
      : console.log;
  
  consoleMethod(
    `%c[${level}]%c ${timestamp} %c(${source}):%c ${formattedMessage}`,
    `color: ${DEBUG.LEVELS[level].color}; font-weight: bold;`,
    'color: #888;',
    'color: #aaa;',
    'color: inherit;'
  );
  
  return logEntry;
};

// Helper methods for different log levels
DEBUG.debug = function(source, message, data) {
  return DEBUG.log('DEBUG', source, message, data);
};

DEBUG.info = function(source, message, data) {
  return DEBUG.log('INFO', source, message, data);
};

DEBUG.warn = function(source, message, data) {
  return DEBUG.log('WARN', source, message, data);
};

DEBUG.error = function(source, message, data) {
  return DEBUG.log('ERROR', source, message, data);
};

DEBUG.critical = function(source, message, data) {
  return DEBUG.log('CRITICAL', source, message, data);
};

// Clear all logs
DEBUG.clearLogs = function() {
  DEBUG.logs = [];
  DEBUG.saveLogs();
  
  const container = document.getElementById('debug-content');
  if (container) {
    container.innerHTML = '';
  }
};

// Get all logs
DEBUG.getAllLogs = function() {
  return DEBUG.logs;
};

// Export logs as JSON
DEBUG.exportLogs = function() {
  return JSON.stringify(DEBUG.logs, null, 2);
};

// Set the current log level
DEBUG.setLogLevel = function(level) {
  if (DEBUG.LEVELS[level]) {
    DEBUG.CONFIG.LEVEL = level;
  }
};

// Enable or disable debugging
DEBUG.setEnabled = function(enabled) {
  DEBUG.CONFIG.ENABLED = enabled;
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  DEBUG.loadLogs();
  DEBUG.setupContainer();
  DEBUG.info('System', 'Debug logging initialized');
});

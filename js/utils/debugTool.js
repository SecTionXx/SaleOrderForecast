/**
 * Debug Tool
 * Provides debugging utilities for the application
 * 
 * This tool helps diagnose and fix issues in the SaleOrderForecast application
 * by providing detailed logging, performance monitoring, and error tracking.
 */

import { logDebug } from './logger.js';

class DebugTool {
  constructor() {
    this.enabled = false;
    this.entries = [];
    this.maxEntries = 100;
    this.startTime = Date.now();
    this.performanceMarks = {};
    this.apiCalls = [];
    this.errorCount = 0;
    this.consoleInitialized = false;
  }

  /**
   * Initialize the debug tool
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  init(enabled = false) {
    this.enabled = enabled;
    this.startTime = Date.now();
    logDebug(`Debug tool ${enabled ? 'enabled' : 'disabled'}`);
    
    // Make available globally for console debugging
    window._debugTool = this;
    
    // Log initial system info
    if (this.enabled) {
      this.logSystemInfo();
      this.monitorNetworkRequests();
      this.monitorErrors();
      
      // Initialize debug console UI (lazy load to avoid unnecessary imports)
      this.initDebugConsole();
    }
  }

  /**
   * Lazy load and initialize the debug console UI
   */
  async initDebugConsole() {
    if (this.consoleInitialized) return;
    
    try {
      // Dynamically import the debug console component
      const module = await import('../components/debugConsole.js');
      const debugConsole = module.default;
      
      // Initialize the console
      debugConsole.init();
      this.consoleInitialized = true;
      
      // Expose console methods globally
      this.showConsole = () => debugConsole.toggleVisibility(true);
      this.hideConsole = () => debugConsole.toggleVisibility(false);
      this.toggleConsole = () => debugConsole.toggleVisibility();
      
      logDebug('Debug console UI initialized');
    } catch (error) {
      console.error('Failed to initialize debug console UI:', error);
    }
  }

  /**
   * Enable debug mode
   */
  enable() {
    this.enabled = true;
    localStorage.setItem('debug_mode', 'true');
    logDebug('Debug mode enabled');
    
    // Initialize if not already done
    if (!this.consoleInitialized) {
      this.initDebugConsole();
      this.monitorNetworkRequests();
      this.monitorErrors();
    }
  }

  /**
   * Disable debug mode
   */
  disable() {
    this.enabled = false;
    localStorage.setItem('debug_mode', 'false');
    logDebug('Debug mode disabled');
    
    // Hide console if it exists
    if (this.hideConsole) {
      this.hideConsole();
    }
  }

  /**
   * Log a debug message
   * @param {string} category - Category of the message
   * @param {string} message - Debug message
   * @param {*} data - Additional data to log
   */
  log(category, message, data) {
    if (!this.enabled && category !== 'error') return;
    
    const entry = {
      timestamp: Date.now(),
      category,
      message,
      data
    };
    
    // Add entry to the log
    this.entries.unshift(entry);
    
    // Trim log if it exceeds max entries
    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }
    
    // Dispatch event for debug console
    this.dispatchDebugEvent(entry);
    
    // Log to console if in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG:${category}]`, message, data);
    }
    
    // Track error count
    if (category === 'error') {
      this.errorCount++;
    }
  }

  /**
   * Dispatch a debug event for the debug console
   * @param {Object} entry - Debug entry
   */
  dispatchDebugEvent(entry) {
    const event = new CustomEvent('debug-message', {
      detail: entry
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear all debug entries
   */
  clear() {
    this.entries = [];
    this.errorCount = 0;
    logDebug('Debug entries cleared');
  }

  /**
   * Get all debug information
   * @returns {Object} Debug information
   */
  getInfo() {
    return {
      enabled: this.enabled,
      entries: [...this.entries],
      systemInfo: this.getSystemInfo(),
      uptime: Date.now() - this.startTime,
      apiCalls: [...this.apiCalls],
      errorCount: this.errorCount
    };
  }

  /**
   * Log system information
   */
  logSystemInfo() {
    const info = this.getSystemInfo();
    this.log('system', 'System information', info);
  }

  /**
   * Get system information
   * @returns {Object} System information
   */
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : 'Not available',
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Not available',
      localStorage: this.checkLocalStorage(),
      cookies: this.checkCookies(),
      modules: this.checkModuleSupport(),
      apis: this.checkAPISupport()
    };
  }

  /**
   * Check localStorage availability and usage
   * @returns {Object} localStorage information
   */
  checkLocalStorage() {
    try {
      const available = !!window.localStorage;
      let used = 0;
      let total = 0;
      
      if (available) {
        // Estimate localStorage usage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          used += (key.length + value.length) * 2; // UTF-16 characters = 2 bytes
        }
        
        // Typical localStorage limit is 5MB
        total = 5 * 1024 * 1024;
      }
      
      return {
        available,
        used: `${(used / 1024).toFixed(2)} KB`,
        total: `${(total / 1024 / 1024).toFixed(2)} MB`,
        percentUsed: ((used / total) * 100).toFixed(2) + '%'
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Check cookie availability
   * @returns {Object} Cookie information
   */
  checkCookies() {
    return {
      enabled: navigator.cookieEnabled,
      count: document.cookie.split(';').filter(c => c.trim()).length
    };
  }

  /**
   * Check ES6 module support
   * @returns {Object} Module support information
   */
  checkModuleSupport() {
    return {
      esModules: 'noModule' in document.createElement('script'),
      dynamicImport: typeof window.Function('return import(\'./module.js\')') === 'function'
    };
  }
  
  /**
   * Check support for various browser APIs
   * @returns {Object} API support information
   */
  checkAPISupport() {
    return {
      fetch: typeof fetch === 'function',
      websocket: typeof WebSocket === 'function',
      webworker: typeof Worker === 'function',
      canvas: !!document.createElement('canvas').getContext,
      webgl: !!document.createElement('canvas').getContext('webgl'),
      webgl2: !!document.createElement('canvas').getContext('webgl2'),
      indexedDB: !!window.indexedDB
    };
  }

  /**
   * Monitor network requests for debugging
   */
  monitorNetworkRequests() {
    if (!this.enabled || !window.fetch) return;
    
    // Save original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to monitor API calls
    window.fetch = async (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      // Start measuring performance
      const requestId = `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      this.startMeasure(requestId);
      
      // Log the request
      this.log('api', `API Request: ${options.method || 'GET'} ${url}`, {
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body
      });
      
      try {
        // Make the actual request
        const response = await originalFetch(...args);
        
        // Clone the response to read it twice
        const responseClone = response.clone();
        
        // Try to parse the response body
        let responseBody;
        try {
          if (responseClone.headers.get('content-type')?.includes('application/json')) {
            responseBody = await responseClone.json();
          } else {
            responseBody = await responseClone.text();
            // If it looks like JSON, try to parse it
            if (responseBody.trim().startsWith('{') || responseBody.trim().startsWith('[')) {
              try {
                responseBody = JSON.parse(responseBody);
              } catch (e) {
                // Keep as text if parsing fails
              }
            }
          }
        } catch (error) {
          responseBody = `[Error reading response body: ${error.message}]`;
        }
        
        // End performance measurement
        this.endMeasure(requestId);
        
        // Log the response
        const apiCall = {
          timestamp: Date.now(),
          url,
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()]),
          body: responseBody,
          duration: this.performanceMarks[requestId] ? 
            Date.now() - this.performanceMarks[requestId] : 'Unknown'
        };
        
        this.apiCalls.unshift(apiCall);
        if (this.apiCalls.length > 20) this.apiCalls.pop();
        
        this.log('api', `API Response: ${response.status} ${response.statusText}`, apiCall);
        
        // If error status, also log as error
        if (!response.ok) {
          this.log('error', `API Error: ${response.status} ${response.statusText}`, apiCall);
        }
        
        return response;
      } catch (error) {
        // End performance measurement
        this.endMeasure(requestId);
        
        // Log the error
        const errorInfo = {
          timestamp: Date.now(),
          url,
          method: options.method || 'GET',
          error: error.message,
          stack: error.stack
        };
        
        this.apiCalls.unshift(errorInfo);
        if (this.apiCalls.length > 20) this.apiCalls.pop();
        
        this.log('error', `API Request Failed: ${error.message}`, errorInfo);
        
        throw error;
      }
    };
  }

  /**
   * Monitor JavaScript errors
   */
  monitorErrors() {
    if (!this.enabled) return;
    
    // Monitor unhandled errors
    window.addEventListener('error', (event) => {
      this.log('error', `Unhandled Error: ${event.message}`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error
      });
    });
    
    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.log('error', `Unhandled Promise Rejection: ${reason?.message || reason}`, {
        reason: reason?.stack || reason
      });
    });
  }

  /**
   * Start measuring performance
   * @param {string} markName - Name of the performance mark
   */
  startMeasure(markName) {
    if (!this.enabled) return;
    
    this.performanceMarks[markName] = Date.now();
    if (window.performance && window.performance.mark) {
      try {
        window.performance.mark(`${markName}-start`);
      } catch (error) {
        // Some browsers might have limitations on performance marks
      }
    }
  }

  /**
   * End measuring performance and log the result
   * @param {string} markName - Name of the performance mark
   */
  endMeasure(markName) {
    if (!this.enabled || !this.performanceMarks[markName]) return;
    
    const startTime = this.performanceMarks[markName];
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (window.performance && window.performance.mark && window.performance.measure) {
      try {
        window.performance.mark(`${markName}-end`);
        window.performance.measure(markName, `${markName}-start`, `${markName}-end`);
      } catch (error) {
        // Some browsers might have limitations on performance measures
      }
    }
    
    this.log('performance', `Performance: ${markName}`, { duration: `${duration}ms` });
    delete this.performanceMarks[markName];
    
    return duration;
  }

  /**
   * Check for common issues in the application
   * @returns {Object} Issues found
   */
  checkForIssues() {
    const issues = [];
    
    // Check for localStorage issues
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      issues.push({
        type: 'critical',
        component: 'storage',
        message: 'localStorage is not available',
        details: e.message
      });
    }
    
    // Check for required libraries
    if (typeof Chart === 'undefined') {
      issues.push({
        type: 'critical',
        component: 'dependencies',
        message: 'Chart.js is not loaded',
        details: 'Charts will not render without this dependency'
      });
    }
    
    if (typeof feather === 'undefined') {
      issues.push({
        type: 'warning',
        component: 'dependencies',
        message: 'Feather icons not loaded',
        details: 'Icons may not display correctly'
      });
    }
    
    // Check for API connectivity
    const apiEndpoints = [
      { name: 'Google Sheets API', url: 'https://sheets.googleapis.com/v4/spreadsheets' },
      { name: 'Authentication API', url: '/api/auth/verify' }
    ];
    
    // Create a function to check API endpoints and return a promise
    const checkEndpoint = (endpoint) => {
      this.startMeasure(`check-${endpoint.name}`);
      return fetch(endpoint.url, { method: 'HEAD' })
        .then(response => {
          const duration = this.endMeasure(`check-${endpoint.name}`);
          if (!response.ok) {
            issues.push({
              type: 'warning',
              component: 'api',
              message: `${endpoint.name} returned status ${response.status}`,
              details: `Response time: ${duration}ms`
            });
          }
          return response;
        })
        .catch(error => {
          this.endMeasure(`check-${endpoint.name}`);
          issues.push({
            type: 'critical',
            component: 'api',
            message: `Cannot connect to ${endpoint.name}`,
            details: error.message
          });
          return error;
        });
    };
    
    // Check each endpoint but don't wait for the results
    apiEndpoints.forEach(endpoint => {
      checkEndpoint(endpoint);
    });
    
    // Log issues found
    if (issues.length > 0) {
      this.log('system', `Found ${issues.length} issues`, issues);
    }
    
    return issues;
  }
}

// Create and export a singleton instance
const debugTool = new DebugTool();
export default debugTool;

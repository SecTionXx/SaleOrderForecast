/**
 * Application Initialization Module
 * Handles the bootstrapping and initialization of the application
 */

import { appState } from '../state/appState.js';
import { api } from '../services/apiService.js';
import { logDebug, logError, logInfo } from '../utils/logger.js';
import { setupErrorHandling } from '../utils/errorHandler.js';
import { initializeUI } from './ui.js';
import { initializeModules } from './modules.js';
import { checkBrowserCompatibility } from '../utils/compatibility.js';

// Application metadata
const APP_INFO = {
  name: 'Order Forecast',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development'
};

// Track initialization state
let isInitialized = false;
let initializationError = null;

/**
 * Initialize the application
 * @returns {Promise<void>}
 */
export async function init() {
  if (isInitialized) {
    logDebug('Application already initialized');
    return;
  }

  try {
    logInfo(`Initializing ${APP_INFO.name} v${APP_INFO.version} (${APP_INFO.environment})`);
    
    // Setup error handling first
    setupErrorHandling();
    
    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
      throw new Error('Browser does not meet minimum requirements');
    }
    
    // Initialize UI components
    initializeUI();
    
    // Setup application modules
    await initializeModules();
    
    // Mark as initialized
    isInitialized = true;
    
    // Dispatch app ready event
    document.dispatchEvent(new CustomEvent('app:ready', { 
      detail: { appState: appState.getState() } 
    }));
    
    logInfo('Application initialized successfully');
  } catch (error) {
    initializationError = error;
    logError('Failed to initialize application', error);
    
    // Dispatch error event
    document.dispatchEvent(new CustomEvent('app:error', { 
      detail: { 
        error: error.message || 'Unknown error during initialization',
        stack: error.stack
      } 
    }));
    
    // Re-throw to allow handling by the caller
    throw error;
  }
}

/**
 * Check if the application is initialized
 * @returns {boolean}
 */
export function isAppInitialized() {
  return isInitialized;
}

/**
 * Get the initialization error if any
 * @returns {Error|null}
 */
export function getInitializationError() {
  return initializationError;
}

/**
 * Get application information
 * @returns {Object} Application info
 */
export function getAppInfo() {
  return { ...APP_INFO };
}

// Initialize the application when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(error => {
      console.error('Unhandled error during initialization:', error);
    });
  });
} else {
  // DOM already loaded, initialize immediately
  init().catch(error => {
    console.error('Unhandled error during initialization:', error);
  });
}

// Export for debugging
if (typeof window !== 'undefined') {
  window.app = {
    init,
    isInitialized: isAppInitialized,
    getInitializationError,
    getAppInfo,
    state: appState,
    api
  };
}

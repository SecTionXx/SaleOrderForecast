/**
 * Application Modules Initialization
 * Handles the setup and coordination of all application modules
 */

import { appState } from '../state/appState.js';
import { logDebug, logInfo, logError } from '../utils/logger.js';
import { showLoading } from './ui.js';

// Import module initializers
import { initializeAuth } from '../auth/authModule.js';
import { initializeDashboard } from '../dashboard/dashboardModule.js';
import { initializeDataModule } from '../data/dataModule.js';
import { initializeAnalytics } from '../analytics/analyticsModule.js';
import { initializeSettings } from '../settings/settingsModule.js';

// Track module initialization state
const moduleState = {
  initialized: false,
  modules: {
    auth: { initialized: false, error: null },
    dashboard: { initialized: false, error: null },
    data: { initialized: false, error: null },
    analytics: { initialized: false, error: null },
    settings: { initialized: false, error: null }
  }
};

/**
 * Initialize all application modules
 * @returns {Promise<void>}
 */
export async function initializeModules() {
  if (moduleState.initialized) {
    logDebug('Modules already initialized');
    return;
  }

  logInfo('Initializing application modules...');
  showLoading(true, 'Initializing application...');
  
  try {
    // 1. Auth Module (must be first)
    await initializeModule('auth', initializeAuth);
    
    // 2. Data Module (needed by other modules)
    await initializeModule('data', initializeDataModule);
    
    // 3. Initialize other modules in parallel
    await Promise.all([
      initializeModule('dashboard', initializeDashboard),
      initializeModule('analytics', initializeAnalytics),
      initializeModule('settings', initializeSettings)
    ]);
    
    moduleState.initialized = true;
    logInfo('All modules initialized successfully');
    
    // Notify that modules are ready
    document.dispatchEvent(new CustomEvent('modules:ready'));
    
  } catch (error) {
    logError('Failed to initialize modules', error);
    throw error;
  } finally {
    showLoading(false);
  }
}

/**
 * Initialize a single module with error handling
 * @param {string} name - Module name
 * @param {Function} initializer - Module initialization function
 * @returns {Promise<void>}
 */
async function initializeModule(name, initializer) {
  if (!moduleState.modules[name]) {
    logError(`Unknown module: ${name}`);
    return;
  }
  
  logDebug(`Initializing module: ${name}`);
  
  try {
    await initializer();
    moduleState.modules[name].initialized = true;
    moduleState.modules[name].error = null;
    logInfo(`Module initialized: ${name}`);
  } catch (error) {
    const errorMsg = `Failed to initialize module ${name}: ${error.message}`;
    moduleState.modules[name].error = errorMsg;
    logError(errorMsg, error);
    
    // Rethrow to be handled by the caller
    throw new Error(errorMsg);
  }
}

/**
 * Check if a specific module is initialized
 * @param {string} name - Module name
 * @returns {boolean}
 */
export function isModuleInitialized(name) {
  return moduleState.modules[name]?.initialized || false;
}

/**
 * Get the initialization error for a module
 * @param {string} name - Module name
 * @returns {string|null}
 */
export function getModuleError(name) {
  return moduleState.modules[name]?.error || null;
}

/**
 * Get the initialization state of all modules
 * @returns {Object}
 */
export function getModuleStates() {
  return {
    initialized: moduleState.initialized,
    modules: { ...moduleState.modules }
  };
}

// For debugging
if (typeof window !== 'undefined') {
  window.modules = {
    initializeModules,
    isModuleInitialized,
    getModuleError,
    getModuleStates
  };
}

/**
 * script-modular.js - Main Application Script
 * This is a modular version of the original script.js file
 * that imports functionality from the modular ES6 structure
 */

// Import core modules
import { init } from './js/core/init.js';
import { checkAuthentication, setupAuthEventListeners } from './js/core/auth.js';
import { initializeDashboard, fetchDataAndInitializeDashboard } from './js/core/dashboard.js';
import { initializeEventListeners } from './js/core/eventHandler.js';
import { getState, updateState } from './js/core/state.js';

// Import utility modules
import { logDebug, logError } from './js/utils/logger.js';
import { showLoadingIndicator, displayErrorMessage } from './js/utils/uiHelpers.js';

// Import component modules
import { initializeAdvancedFilters, handleFilterChange } from './js/components/filters.js';
import { initializeDashboardCustomization } from './js/components/dashboardCustomization.js';
import { initializeDealForm } from './js/components/dealForm.js';
import { initializeEmailReports } from './js/components/emailReports.js';
import { initializeHistoryTracker } from './js/components/historyTracker.js';

// Make charts available globally for PDF export
if (typeof window !== 'undefined') {
  window.getCharts = () => {
    const { charts } = require('./js/charts/charts.js');
    return charts;
  };
}

// --- Main Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  logDebug("script-modular.js: DOM Loaded. Checking authentication...");
  
  // Set up authentication event listeners
  setupAuthEventListeners();
  
  // Check if user is authenticated
  checkAuthentication()
    .then(isAuthenticated => {
      if (isAuthenticated) {
        console.log("User is authenticated. Initializing Dashboard...");
        init();
      } else {
        console.log("User is not authenticated. Redirecting to login...");
        window.location.href = "login.html";
      }
    })
    .catch(error => {
      console.error("Authentication check failed:", error);
      // On error, redirect to login page
      window.location.href = "login.html";
    });
});

// Export any functions that need to be accessible globally
export {
  init,
  fetchDataAndInitializeDashboard,
  getState
};

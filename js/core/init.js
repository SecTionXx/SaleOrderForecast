/**
 * init.js - Application Initialization Module
 * Handles the initialization of the application
 */

import { checkAuthentication, setupAuthEventListeners } from './auth.js';
import { initializeDashboard } from './dashboard.js';
import { initializeEventListeners } from './eventHandler.js';
import { logDebug, logError } from '../utils/logger.js';
import { initializeAdvancedFilters } from '../components/filters.js';
import { handleFilterChange } from '../components/filters.js';
import { initializeDashboardCustomization } from '../components/dashboardCustomization.js';
import { initializeDealForm } from '../components/dealForm.js';
import { initializeEmailReports } from '../components/emailReports.js';
import { initializeHistoryTracker } from '../components/historyTracker.js';

/**
 * Initialize the application
 */
async function init() {
  try {
    logDebug("Application initializing...");
    
    // Set up authentication event listeners
    setupAuthEventListeners();
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      logDebug("User is not authenticated. Redirecting to login...");
      return;
    }
    
    logDebug("User is authenticated. Initializing Dashboard...");
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize dashboard
    await initializeDashboard();
    
    // Initialize feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Initialize advanced filters
    initializeAdvancedFilters(handleFilterChange);
    
    // Initialize dashboard customization features
    initializeDashboardCustomization();
    
    // Initialize deal form functionality
    initializeDealForm();
    
    // Initialize email report sharing functionality
    initializeEmailReports();
    
    // Initialize history tracker functionality
    initializeHistoryTracker();
    
    logDebug("Application initialized successfully");
  } catch (error) {
    logError('Error initializing application:', error);
    console.error('Error initializing application:', error);
    displayErrorMessage('Failed to initialize application. Please try again later.');
  }
}

/**
 * Display error message
 * @param {string} message - Error message to display
 */
function displayErrorMessage(message) {
  console.error(message);
  
  // Create error element if it doesn't exist
  let errorElement = document.getElementById('error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'error-message';
    errorElement.className = 'error-message';
    document.body.appendChild(errorElement);
  }
  
  // Set error message
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Hide error message after 5 seconds
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

// Export functions
export {
  init,
  displayErrorMessage
};

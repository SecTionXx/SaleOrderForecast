/**
 * app.js - Main application entry point
 * Initializes the SaleOrderForecast application and sets up all components
 */

import { initLoadingStates, withLoading } from './app/loadingIntegration.js';
import { initDataProcessing } from './utils/dataProcessingOptimizer.js';
import { setupForecastingAdapter } from './analytics/forecastingAdapter.js';
import { initUI } from './ui/uiManager.js';
import { logDebug, logError } from './utils/logger.js';
import { generateMockSalesData } from './utils/mockDataGenerator.js';

// Global application state
const appState = {
  isInitialized: false,
  currentPage: null,
  dataLoaded: false,
  salesData: [],
  forecastData: [],
  userPreferences: loadUserPreferences()
};

/**
 * Initialize the application
 */
async function initApp() {
  try {
    logDebug('Initializing application...');
    
    // Initialize loading states and transitions
    initLoadingStates();
    
    // Initialize data processing optimizations
    initDataProcessing();
    
    // Set up forecasting adapter
    setupForecastingAdapter();
    
    // Initialize UI components
    initUI();
    
    // Load initial data
    await loadInitialData();
    
    // Mark app as initialized
    appState.isInitialized = true;
    
    logDebug('Application initialized successfully');
    
    // Dispatch app ready event
    window.dispatchEvent(new CustomEvent('app-ready', { detail: { appState } }));
  } catch (error) {
    logError('Failed to initialize application:', error);
    
    // Show error message to user
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="app-error">
          <h2>Application Error</h2>
          <p>Failed to initialize the application. Please try refreshing the page.</p>
          <p class="error-details">${error.message}</p>
          <button id="retry-init" class="btn btn-primary">Retry</button>
        </div>
      `;
      
      // Set up retry button
      const retryButton = document.getElementById('retry-init');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }
  }
}

/**
 * Load initial application data
 */
async function loadInitialData() {
  return withLoading(async () => {
    // In a real application, this would load data from an API
    // For demo purposes, we'll use mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock sales data
    appState.salesData = generateMockSalesData(100, {
      includeTrend: true,
      includeSeasonal: true
    });
    
    appState.dataLoaded = true;
    
    return appState.salesData;
  }, {
    loadingMessage: 'Loading sales data...',
    errorMessage: 'Failed to load initial data. Please try again.'
  });
}

/**
 * Load user preferences from localStorage
 * @returns {Object} - User preferences
 */
function loadUserPreferences() {
  try {
    const storedPreferences = localStorage.getItem('userPreferences');
    
    if (storedPreferences) {
      return JSON.parse(storedPreferences);
    }
  } catch (error) {
    logError('Failed to load user preferences:', error);
  }
  
  // Default preferences
  return {
    theme: 'auto', // 'light', 'dark', or 'auto'
    dataDisplayMode: 'table', // 'table' or 'chart'
    chartType: 'line', // 'line', 'bar', 'pie', etc.
    pageSize: 10,
    defaultForecastMethod: 'movingAverage'
  };
}

/**
 * Save user preferences to localStorage
 * @param {Object} preferences - User preferences to save
 */
function saveUserPreferences(preferences) {
  try {
    const updatedPreferences = {
      ...appState.userPreferences,
      ...preferences
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
    appState.userPreferences = updatedPreferences;
    
    // Dispatch preferences changed event
    window.dispatchEvent(new CustomEvent('preferences-changed', {
      detail: { preferences: updatedPreferences }
    }));
    
    return updatedPreferences;
  } catch (error) {
    logError('Failed to save user preferences:', error);
    return appState.userPreferences;
  }
}

/**
 * Get current application state
 * @returns {Object} - Application state
 */
function getAppState() {
  return { ...appState };
}

/**
 * Update application state
 * @param {Object} newState - New state properties
 * @returns {Object} - Updated application state
 */
function updateAppState(newState) {
  const previousState = { ...appState };
  
  // Update state
  Object.assign(appState, newState);
  
  // Dispatch state changed event
  window.dispatchEvent(new CustomEvent('app-state-changed', {
    detail: {
      previousState,
      currentState: appState
    }
  }));
  
  return appState;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export public API
export {
  getAppState,
  updateAppState,
  loadInitialData,
  loadUserPreferences,
  saveUserPreferences
};

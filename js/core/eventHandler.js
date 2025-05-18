/**
 * eventHandler.js - Event Handler Module
 * Centralizes event handling for the application
 */

import { fetchDataAndInitializeDashboard } from './dashboard.js';
import { showExportOptions } from '../utils/exportData.js';
import { getState } from './state.js';
import { logDebug } from '../utils/logger.js';
import { showDealForm } from '../components/dealForm.js';
import { showPreferencesModal } from '../components/userPreferences.js';

/**
 * Initialize all event listeners for the application
 */
function initializeEventListeners() {
  logDebug('Initializing event listeners...');
  
  // Refresh button
  initializeRefreshButton();
  
  // Export button
  initializeExportButton();
  
  // Add deal button
  initializeAddDealButton();
  
  // User preferences button
  initializePreferencesButton();
  
  // Window resize event
  initializeResizeHandler();
  
  logDebug('Event listeners initialized');
}

/**
 * Initialize refresh button event listener
 */
function initializeRefreshButton() {
  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      logDebug('Refresh button clicked');
      fetchDataAndInitializeDashboard(true);
    });
  }
}

/**
 * Initialize export button event listener
 */
function initializeExportButton() {
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      logDebug('Export button clicked');
      const { filteredData } = getState();
      showExportOptions(filteredData);
    });
  }
}

/**
 * Initialize add deal button event listener
 */
function initializeAddDealButton() {
  const addDealBtn = document.getElementById('add-deal-btn');
  if (addDealBtn) {
    addDealBtn.addEventListener('click', () => {
      logDebug('Add deal button clicked');
      showDealForm();
    });
  }
}

/**
 * Initialize preferences button event listener
 */
function initializePreferencesButton() {
  const preferencesBtn = document.getElementById('preferences-btn');
  if (preferencesBtn) {
    preferencesBtn.addEventListener('click', () => {
      logDebug('Preferences button clicked');
      showPreferencesModal();
    });
  }
}

/**
 * Initialize window resize event handler
 */
function initializeResizeHandler() {
  // Debounce function to limit resize event handling
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  };
  
  // Handle window resize event
  const handleResize = debounce(() => {
    logDebug('Window resized');
    
    // Trigger chart resize if charts module is available
    if (window.charts) {
      Object.values(window.charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    }
    
    // Update responsive elements
    updateResponsiveElements();
  }, 250);
  
  // Add event listener
  window.addEventListener('resize', handleResize);
}

/**
 * Update responsive elements based on window size
 */
function updateResponsiveElements() {
  const windowWidth = window.innerWidth;
  
  // Update table columns visibility
  const table = document.getElementById('forecast-table');
  if (table) {
    if (windowWidth < 768) {
      table.classList.add('compact-view');
    } else {
      table.classList.remove('compact-view');
    }
  }
  
  // Update chart container sizes
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach(container => {
    if (windowWidth < 768) {
      container.style.height = '300px';
    } else {
      container.style.height = '400px';
    }
  });
}

/**
 * Register custom event handlers
 * @param {string} eventName - Name of the event
 * @param {Function} handler - Event handler function
 */
function registerEventHandler(eventName, handler) {
  if (typeof handler !== 'function') {
    logDebug(`Invalid handler for event: ${eventName}`);
    return;
  }
  
  document.addEventListener(eventName, handler);
  logDebug(`Registered handler for event: ${eventName}`);
}

/**
 * Trigger a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} detail - Event details
 */
function triggerEvent(eventName, detail = {}) {
  const event = new CustomEvent(eventName, { detail });
  document.dispatchEvent(event);
  logDebug(`Triggered event: ${eventName}`, detail);
}

// Export functions
export {
  initializeEventListeners,
  registerEventHandler,
  triggerEvent,
  updateResponsiveElements
};

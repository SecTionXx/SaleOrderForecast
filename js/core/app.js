/**
 * app.js - Main application entry point
 * Handles initialization and core functionality for the Order Forecast dashboard
 */

// Import modules
import { checkAuthentication, getAuthToken, getCurrentUser, logout, updateUserInfo } from '../auth/auth.js';
import { fetchDataWithCaching } from '../utils/dataFetch.js';
import { initializeTable, populateTable } from '../components/table.js';
import { initializeCharts, updateCharts } from '../charts/charts.js';
import { initializeFilters, applyFilters, handleFilterChange } from '../components/filters.js';
import { initializeDashboardCustomization } from '../components/dashboardCustomization.js';
import { initializeDealForm } from '../components/dealForm.js';
import { initializeHistoryTracker } from '../components/historyTracker.js';
import { initializeEmailReports } from '../components/emailReports.js';
import { exportToCSV, showExportOptions } from '../utils/exportData.js';
import { showLoadingIndicator, displayErrorMessage, updateLastRefreshTime } from '../utils/uiHelpers.js';
import { logDebug } from '../utils/logger.js';
import { initializeAdvancedForecasting } from '../components/advancedForecasting.js';
import { initializeCrmConnector } from '../integrations/crmConnector.js';
import { initializeCrmPreferences } from '../integrations/crmPreferences.js';
import { initializeForecastingTabs } from '../components/forecastingTabs.js';

// --- Global Variables ---
let allDealsData = []; // Holds the data fetched from the sheet
let filteredData = []; // Holds the filtered data
let currentPage = 1;
let itemsPerPage = 10;
let sortColumn = 'lastUpdated';
let sortDirection = 'desc';

// Authentication constants
const AUTH_TOKEN_KEY = 'orderforecast_auth_token';
const AUTH_USER_KEY = 'orderforecast_user';
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';

// --- Persistent Filter/Sort State ---
const FILTERS_KEY = "orderforecast_filters";

/**
 * Save filters to local storage
 * @param {Object} filters - The filters to save
 */
function saveFiltersToStorage(filters) {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

/**
 * Load filters from local storage
 * @returns {Object} - The saved filters
 */
function loadFiltersFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Main initialization function
 * Called when the DOM is loaded
 */
function init() {
  logDebug("app.js: DOM Loaded. Checking authentication...");
  
  // Check if user is authenticated
  checkAuthentication()
    .then(isAuthenticated => {
      if (isAuthenticated) {
        logDebug("User is authenticated. Initializing Dashboard...");
        initializeDashboard();
      } else {
        logDebug("User is not authenticated. Redirecting to login...");
        window.location.href = "login.html";
      }
    })
    .catch(error => {
      console.error("Authentication check failed:", error);
      // On error, redirect to login page
      window.location.href = "login.html";
    });
}

/**
 * Initialize the dashboard
 * Sets up all components and fetches initial data
 */
async function initializeDashboard() {
  try {
    // Show loading indicator
    showLoadingIndicator(true);
    
    // Initialize event listeners
    initializeEventListeners();

    // Fetch data and initialize dashboard
    await fetchDataAndInitializeDashboard(false);

    // Initialize feather icons
    feather.replace();

    // Initialize all components
    initializeFilters(handleFilterChange);
    initializeDashboardCustomization();
    initializeDealForm();
    initializeEmailReports();
    initializeHistoryTracker();
    
    // Initialize advanced forecasting
    initializeAdvancedForecasting(allDealsData);
    initializeForecastingTabs();
  
    // Initialize CRM integration
    initializeCrmConnector();
    initializeCrmPreferences();
    
    // Hide loading indicator
    showLoadingIndicator(false);
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    displayErrorMessage('Failed to initialize dashboard. Please try again later.');
    showLoadingIndicator(false);
  }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => fetchDataAndInitializeDashboard(true));
  }
  
  // Export button
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => showExportOptions(getCurrentFilteredData()));
  }
  
  // Add other event listeners as needed
}

/**
 * Get the currently filtered data
 * @returns {Array} - The filtered data
 */
function getCurrentFilteredData() {
  return filteredData;
}

/**
 * Fetch data and initialize the dashboard
 * @param {boolean} forceFresh - Whether to force a fresh data fetch
 */
async function fetchDataAndInitializeDashboard(forceFresh = false) {
  try {
    showLoadingIndicator(true);
    
    // Fetch data
    const data = await fetchDataWithCaching(forceFresh);
    allDealsData = data;
    
    // Apply filters
    filteredData = applyFilters(allDealsData);
    
    // Initialize table
    initializeTable();
    populateTable(filteredData);
    
    // Initialize charts
    initializeCharts(filteredData);
    
    // Update UI elements
    updateLastRefreshTime();
    
    showLoadingIndicator(false);
  } catch (error) {
    console.error('Error fetching data:', error);
    displayErrorMessage('Failed to fetch data. Please try again later.');
    showLoadingIndicator(false);
  }
}

// Export functions and variables that need to be accessible from other modules
export {
  init,
  getCurrentFilteredData,
  fetchDataAndInitializeDashboard,
  allDealsData,
  filteredData,
  saveFiltersToStorage,
  loadFiltersFromStorage
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

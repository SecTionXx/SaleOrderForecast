/**
 * dataManager.js - Centralized Data Management
 * Manages data flow between components (table, filters, charts)
 */

import { logDebug, logError } from '../utils/logger.js';
import chartManager from '../charts/index.js';

// Application state
let appState = {
  allData: [],
  filteredData: [],
  filters: {},
  sort: {
    column: 'lastUpdated',
    direction: 'desc'
  },
  pagination: {
    currentPage: 1,
    rowsPerPage: 10,
    totalItems: 0
  }
};

/**
 * Initialize the data manager
 * @param {Array} initialData - Initial dataset
 */
function initialize(initialData = []) {
  try {
    if (!Array.isArray(initialData)) {
      throw new Error('Initial data must be an array');
    }

    // Store initial data
    appState.allData = [...initialData];
    appState.filteredData = [...initialData];
    appState.pagination.totalItems = initialData.length;

    // Initialize charts with the full dataset
    updateCharts();

    logDebug('Data manager initialized with', initialData.length, 'items');
  } catch (error) {
    logError('Error initializing data manager:', error);
    throw error;
  }
}

/**
 * Apply filters to the data
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered data
 */
function applyFilters(filters = {}) {
  try {
    appState.filters = { ...filters };
    
    // Start with all data
    let result = [...appState.allData];
    
    // Apply each filter if it exists
    if (filters.salesRep) {
      result = result.filter(item => item.salesRep === filters.salesRep);
    }
    
    if (filters.dealStage) {
      result = result.filter(item => item.dealStage === filters.dealStage);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(item => {
        const itemDate = new Date(item.expectedCloseDate || item.date);
        return itemDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const itemDate = new Date(item.expectedCloseDate || item.date);
        return itemDate <= endDate;
      });
    }
    
    if (filters.minAmount !== undefined && filters.minAmount !== null) {
      result = result.filter(item => item.amount >= filters.minAmount);
    }
    
    if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
      result = result.filter(item => item.amount <= filters.maxAmount);
    }
    
    // Update state
    appState.filteredData = result;
    appState.pagination.totalItems = result.length;
    appState.pagination.currentPage = 1; // Reset to first page
    
    // Update charts with filtered data
    updateCharts();
    
    logDebug('Filters applied. Showing', result.length, 'of', appState.allData.length, 'items');
    
    return result;
  } catch (error) {
    logError('Error applying filters:', error);
    throw error;
  }
}

/**
 * Sort the filtered data
 * @param {string} column - Column to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} - Sorted data
 */
function sortData(column, direction = 'asc') {
  try {
    appState.sort.column = column;
    appState.sort.direction = direction;
    
    const sortedData = [...appState.filteredData].sort((a, b) => {
      let valueA = a[column];
      let valueB = b[column];
      
      // Handle different data types for sorting
      if (typeof valueA === 'string') valueA = valueA?.toString().toLowerCase() || '';
      if (typeof valueB === 'string') valueB = valueB?.toString().toLowerCase() || '';
      
      // Handle undefined/null values
      if (valueA == null) return direction === 'asc' ? -1 : 1;
      if (valueB == null) return direction === 'asc' ? 1 : -1;
      
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    appState.filteredData = sortedData;
    
    logDebug('Data sorted by', column, 'in', direction, 'order');
    
    return getPaginatedData();
  } catch (error) {
    logError('Error sorting data:', error);
    throw error;
  }
}

/**
 * Get paginated data based on current state
 * @returns {Object} - Paginated data and pagination info
 */
function getPaginatedData() {
  try {
    const { currentPage, rowsPerPage } = appState.pagination;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    const paginatedData = appState.filteredData.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      pagination: {
        ...appState.pagination,
        totalPages: Math.ceil(appState.filteredData.length / rowsPerPage)
      }
    };
  } catch (error) {
    logError('Error getting paginated data:', error);
    throw error;
  }
}

/**
 * Set the current page
 * @param {number} page - Page number (1-based)
 * @returns {Array} - Paginated data for the requested page
 */
function setCurrentPage(page) {
  try {
    if (page < 1 || page > Math.ceil(appState.filteredData.length / appState.pagination.rowsPerPage)) {
      throw new Error('Invalid page number');
    }
    
    appState.pagination.currentPage = page;
    
    logDebug('Page changed to', page);
    
    return getPaginatedData();
  } catch (error) {
    logError('Error setting current page:', error);
    throw error;
  }
}

/**
 * Update charts with current filtered data
 */
function updateCharts() {
  try {
    if (!chartManager.initialized) {
      // If chart manager is not initialized, try to initialize it
      const chartContainer = document.getElementById('chart-container') || document.body;
      chartManager.initialize(chartContainer);
    }
    
    if (appState.filteredData.length > 0) {
      chartManager.updateCharts(appState.filteredData);
    }
    logDebug('Charts updated with', appState.filteredData.length, 'items');
  } catch (error) {
    logError('Error updating charts:', error);
  }
}

/**
 * Get the current application state
 * @returns {Object} - Current application state (read-only)
 */
function getState() {
  return {
    ...appState,
    // Return copies to prevent direct state mutation
    allData: [...appState.allData],
    filteredData: [...appState.filteredData],
    filters: { ...appState.filters },
    sort: { ...appState.sort },
    pagination: { ...appState.pagination }
  };
}

// Make available globally for debugging
window.dataManager = {
  initialize,
  applyFilters,
  sortData,
  getPaginatedData,
  setCurrentPage,
  updateCharts,
  getState
};

export {
  initialize,
  applyFilters,
  sortData,
  getPaginatedData,
  setCurrentPage,
  updateCharts,
  getState
};

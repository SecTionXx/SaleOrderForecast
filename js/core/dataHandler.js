/**
 * dataHandler.js - Data Handling Module
 * Centralizes data processing and manipulation for the application
 */

import { fetchDataWithCaching } from '../modules/dataFetch.js';
import { logDebug, logError } from '../utils/logger.js';
import { getState, setAllDealsData, setFilteredData, updateLastRefreshTime } from './state.js';
import { showLoadingIndicator, displayErrorMessage } from '../utils/uiHelpers.js';

/**
 * Fetch data from the API or cache
 * @param {boolean} forceFresh - Whether to force a fresh data fetch
 * @returns {Promise<Array>} - The fetched data
 */
async function fetchData(forceFresh = false) {
  try {
    logDebug(`Fetching data (forceFresh: ${forceFresh})...`);
    
    // Show loading indicator
    showLoadingIndicator(true);
    
    // Fetch data from API or cache
    const data = await fetchDataWithCaching(forceFresh);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data received from API');
    }
    
    // Store the data in state
    setAllDealsData(data);
    
    // Update last refresh time
    updateLastRefreshTime();
    
    // Hide loading indicator
    showLoadingIndicator(false);
    
    logDebug(`Data fetched successfully: ${data.length} records`);
    return data;
  } catch (error) {
    showLoadingIndicator(false);
    logError('Error fetching data:', error);
    displayErrorMessage('Failed to fetch data. Please try again later.');
    return [];
  }
}

/**
 * Apply sorting to data
 * @param {Array} data - The data to sort
 * @returns {Array} - The sorted data
 */
function applySort(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return data;
  }
  
  const { sortColumn, sortDirection } = getState();
  
  if (!sortColumn) {
    return data;
  }
  
  logDebug(`Sorting data by ${sortColumn} (${sortDirection})`);
  
  // Create a copy of the data to avoid mutating the original
  const sortedData = [...data];
  
  // Sort the data
  sortedData.sort((a, b) => {
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];
    
    // Handle special cases
    if (sortColumn === 'lastUpdated' || sortColumn === 'createdDate' || sortColumn === 'expectedCloseDate' || sortColumn === 'closedDate') {
      // Convert to dates for comparison
      valueA = valueA ? new Date(valueA) : new Date(0);
      valueB = valueB ? new Date(valueB) : new Date(0);
    } else if (sortColumn === 'totalValue' || sortColumn === 'weightedValue') {
      // Convert to numbers for comparison
      valueA = parseFloat(valueA) || 0;
      valueB = parseFloat(valueB) || 0;
    } else if (sortColumn === 'probability') {
      // Convert to numbers for comparison
      valueA = parseFloat(valueA) || 0;
      valueB = parseFloat(valueB) || 0;
    } else {
      // Convert to strings for comparison
      valueA = String(valueA || '').toLowerCase();
      valueB = String(valueB || '').toLowerCase();
    }
    
    // Compare values
    if (valueA < valueB) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sortedData;
}

/**
 * Apply pagination to data
 * @param {Array} data - The data to paginate
 * @returns {Array} - The paginated data
 */
function applyPagination(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return data;
  }
  
  const { currentPage, itemsPerPage } = getState();
  
  if (!itemsPerPage || itemsPerPage <= 0) {
    return data;
  }
  
  logDebug(`Applying pagination: page ${currentPage}, ${itemsPerPage} items per page`);
  
  // Calculate start and end indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Return the paginated data
  return data.slice(startIndex, endIndex);
}

/**
 * Calculate summary metrics from data
 * @param {Array} data - The data to calculate metrics from
 * @returns {Object} - The calculated metrics
 */
function calculateSummaryMetrics(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      totalValue: 0,
      weightedValue: 0,
      closedWonValue: 0,
      avgProbability: 0,
      dealCount: 0,
      closedWonCount: 0,
      closedLostCount: 0,
      openDealsCount: 0
    };
  }
  
  // Calculate metrics
  const totalValue = data.reduce((sum, deal) => sum + (deal.totalValue || 0), 0);
  const weightedValue = data.reduce((sum, deal) => sum + (deal.weightedValue || 0), 0);
  const closedWonValue = data
    .filter(deal => deal.dealStage === 'Closed Won')
    .reduce((sum, deal) => sum + (deal.totalValue || 0), 0);
  const avgProbability = data.length > 0
    ? data.reduce((sum, deal) => sum + (deal.probability || 0), 0) / data.length
    : 0;
  const dealCount = data.length;
  const closedWonCount = data.filter(deal => deal.dealStage === 'Closed Won').length;
  const closedLostCount = data.filter(deal => deal.dealStage === 'Closed Lost').length;
  const openDealsCount = dealCount - closedWonCount - closedLostCount;
  
  return {
    totalValue,
    weightedValue,
    closedWonValue,
    avgProbability,
    dealCount,
    closedWonCount,
    closedLostCount,
    openDealsCount
  };
}

/**
 * Group data by a specific field
 * @param {Array} data - The data to group
 * @param {string} field - The field to group by
 * @returns {Object} - The grouped data
 */
function groupDataBy(data, field) {
  if (!data || !Array.isArray(data) || data.length === 0 || !field) {
    return {};
  }
  
  // Group data by the specified field
  return data.reduce((groups, item) => {
    const key = item[field] || 'Unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Calculate time-based metrics (e.g., monthly forecasts)
 * @param {Array} data - The data to calculate metrics from
 * @param {string} timeField - The field containing the time data
 * @param {string} valueField - The field containing the value data
 * @param {number} months - Number of months to include
 * @returns {Object} - The calculated metrics by time period
 */
function calculateTimeMetrics(data, timeField = 'expectedCloseDate', valueField = 'weightedValue', months = 6) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {};
  }
  
  // Initialize result object with months
  const result = {};
  const today = new Date();
  
  // Initialize months
  for (let i = 0; i < months; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
    result[monthKey] = { forecast: 0, actual: 0 };
  }
  
  // Calculate metrics for each deal
  data.forEach(deal => {
    // Get month key from deal
    let monthKey = '';
    if (deal[timeField] instanceof Date && !isNaN(deal[timeField].getTime())) {
      monthKey = deal[timeField].toISOString().slice(0, 7);
    } else if (typeof deal[timeField] === 'string' && deal[timeField].length >= 7) {
      monthKey = deal[timeField].slice(0, 7);
    }
    
    // Skip if month key is not valid
    if (!monthKey) return;
    
    // Initialize month if not exists
    if (!result[monthKey]) {
      result[monthKey] = { forecast: 0, actual: 0 };
    }
    
    // Add to forecast
    result[monthKey].forecast += deal[valueField] || 0;
    
    // Add to actual if closed won
    if (deal.dealStage === 'Closed Won') {
      result[monthKey].actual += deal.totalValue || 0;
    }
  });
  
  return result;
}

// Export functions
export {
  fetchData,
  applySort,
  applyPagination,
  calculateSummaryMetrics,
  groupDataBy,
  calculateTimeMetrics
};

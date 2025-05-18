/**
 * dashboard.js - Dashboard Module
 * Handles dashboard initialization and data handling
 */

import { fetchDataWithCaching } from '../modules/dataFetch.js';
import { updateCharts } from '../charts/charts.js';
import { populateTable } from '../components/table.js';
import { applyFilters } from '../components/filters.js';
import { showLoadingIndicator, displayErrorMessage, updateLastRefreshTime } from '../utils/uiHelpers.js';
import { logDebug, logError } from '../utils/logger.js';
import { 
  getState, 
  setLoading, 
  setAllDealsData, 
  setFilteredData, 
  updateLastRefreshTime as updateRefreshTime 
} from './state.js';

/**
 * Initialize the dashboard
 * @returns {Promise<void>}
 */
async function initializeDashboard() {
  try {
    logDebug('Initializing dashboard...');
    
    // Fetch data and initialize dashboard
    await fetchDataAndInitializeDashboard(false);
    
    // Initialize feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Set up the filter toggle button
    setupFilterToggle();
    
    // Set up summary toggle button
    setupSummaryToggle();
    
    logDebug('Dashboard initialized successfully');
  } catch (error) {
    logError('Error initializing dashboard:', error);
    displayErrorMessage('Failed to initialize dashboard. Please try again later.');
  }
}

/**
 * Fetch data and initialize the dashboard
 * @param {boolean} forceFresh - Whether to force a fresh data fetch
 * @returns {Promise<void>}
 */
async function fetchDataAndInitializeDashboard(forceFresh = false) {
  try {
    // Show loading indicator
    showLoadingIndicator(true);
    setLoading(true);
    
    // Fetch data from API or cache
    logDebug(`Fetching data (forceFresh: ${forceFresh})...`);
    const data = await fetchDataWithCaching(forceFresh);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data received from API');
    }
    
    // Store the data in state
    setAllDealsData(data);
    
    // Apply filters to the data
    const filteredData = applyFilters(data);
    setFilteredData(filteredData);
    
    // Update the UI with the filtered data
    updateDashboardUI(filteredData);
    
    // Update last refresh time
    updateLastRefreshTime();
    updateRefreshTime();
    
    // Hide loading indicator
    showLoadingIndicator(false);
    setLoading(false);
    
    logDebug(`Dashboard updated with ${data.length} records`);
    return data;
  } catch (error) {
    showLoadingIndicator(false);
    setLoading(false);
    logError('Error fetching data:', error);
    displayErrorMessage('Failed to fetch data. Please try again later.');
    return [];
  }
}

/**
 * Update the dashboard UI with new data
 * @param {Array} filteredData - The filtered data to display
 */
function updateDashboardUI(filteredData) {
  try {
    // Update the table with the filtered data
    populateTable(filteredData);
    
    // Update charts with the filtered data
    updateCharts(filteredData);
    
    // Update summary cards
    updateSummaryCards(filteredData);
    
    logDebug(`Dashboard UI updated with ${filteredData.length} records`);
  } catch (error) {
    logError('Error updating dashboard UI:', error);
    displayErrorMessage('Failed to update dashboard. Please try again later.');
  }
}

/**
 * Update summary cards with data
 * @param {Array} filteredData - The filtered data to display
 */
function updateSummaryCards(filteredData) {
  try {
    // Calculate summary metrics
    const totalValue = filteredData.reduce((sum, deal) => sum + (deal.totalValue || 0), 0);
    const weightedValue = filteredData.reduce((sum, deal) => sum + (deal.weightedValue || 0), 0);
    const closedWonValue = filteredData
      .filter(deal => deal.dealStage === 'Closed Won')
      .reduce((sum, deal) => sum + (deal.totalValue || 0), 0);
    const avgProbability = filteredData.length > 0
      ? filteredData.reduce((sum, deal) => sum + (deal.probability || 0), 0) / filteredData.length
      : 0;
    
    // Update summary cards in the UI
    updateSummaryCard('total-value', totalValue, 'currency');
    updateSummaryCard('weighted-value', weightedValue, 'currency');
    updateSummaryCard('closed-won-value', closedWonValue, 'currency');
    updateSummaryCard('avg-probability', avgProbability, 'percent');
    
    logDebug('Summary cards updated');
  } catch (error) {
    logError('Error updating summary cards:', error);
  }
}

/**
 * Update a single summary card
 * @param {string} id - The ID of the summary card
 * @param {number} value - The value to display
 * @param {string} type - The type of value (currency, percent, number)
 */
function updateSummaryCard(id, value, type) {
  const card = document.getElementById(id);
  if (!card) return;
  
  const valueElement = card.querySelector('.summary-value');
  if (!valueElement) return;
  
  // Format the value based on type
  let formattedValue = value;
  switch (type) {
    case 'currency':
      formattedValue = new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0
      }).format(value);
      break;
    case 'percent':
      formattedValue = `${Math.round(value)}%`;
      break;
    case 'number':
      formattedValue = new Intl.NumberFormat().format(value);
      break;
  }
  
  valueElement.textContent = formattedValue;
  
  // Update trend if previous value is available
  const previousValue = parseFloat(valueElement.dataset.previousValue || '0');
  if (!isNaN(previousValue) && previousValue !== 0) {
    updateTrend(id, value, previousValue);
  }
  
  // Store current value as previous for next update
  valueElement.dataset.previousValue = value;
}

/**
 * Update trend indicator for a summary card
 * @param {string} id - The ID of the summary card
 * @param {number} currentValue - The current value
 * @param {number} previousValue - The previous value
 */
function updateTrend(id, currentValue, previousValue) {
  const card = document.getElementById(id);
  if (!card) return;
  
  const trendElement = card.querySelector('.trend-indicator');
  if (!trendElement) return;
  
  // Calculate percentage change
  const change = currentValue - previousValue;
  const percentChange = previousValue !== 0
    ? (change / Math.abs(previousValue)) * 100
    : 0;
  
  // Determine trend direction
  let trendClass = 'neutral';
  let trendIcon = 'minus';
  
  if (percentChange > 1) {
    trendClass = 'positive';
    trendIcon = 'arrow-up';
  } else if (percentChange < -1) {
    trendClass = 'negative';
    trendIcon = 'arrow-down';
  }
  
  // Update trend element
  trendElement.className = `trend-indicator ${trendClass}`;
  trendElement.innerHTML = `
    <i data-feather="${trendIcon}" class="trend-icon"></i>
    <span class="trend-value">${Math.abs(Math.round(percentChange))}%</span>
  `;
  
  // Update feather icons if available
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
}

/**
 * Set up the filter toggle button
 */
function setupFilterToggle() {
  const toggleBtn = document.getElementById('toggle-filters-btn');
  const filterSection = document.getElementById('filters-section');
  
  if (!toggleBtn || !filterSection) return;
  
  toggleBtn.addEventListener('click', () => {
    const isVisible = filterSection.classList.toggle('expanded');
    
    // Update button icon and text
    const icon = toggleBtn.querySelector('i');
    const text = toggleBtn.querySelector('span');
    
    if (icon) {
      icon.setAttribute('data-feather', isVisible ? 'chevron-up' : 'chevron-down');
    }
    
    if (text) {
      text.textContent = isVisible ? 'Hide Filters' : 'Show Filters';
    }
    
    // Update feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  });
}

/**
 * Set up the summary toggle button
 */
function setupSummaryToggle() {
  const toggleBtn = document.getElementById('toggle-summary-btn');
  const summarySection = document.getElementById('summary-section');
  
  if (!toggleBtn || !summarySection) return;
  
  toggleBtn.addEventListener('click', () => {
    const isVisible = summarySection.classList.toggle('expanded');
    
    // Update button icon and text
    const icon = toggleBtn.querySelector('i');
    const text = toggleBtn.querySelector('span');
    
    if (icon) {
      icon.setAttribute('data-feather', isVisible ? 'chevron-up' : 'chevron-down');
    }
    
    if (text) {
      text.textContent = isVisible ? 'Hide Summary' : 'Show Summary';
    }
    
    // Update feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  });
}

// Export functions
export {
  initializeDashboard,
  fetchDataAndInitializeDashboard,
  updateDashboardUI,
  updateSummaryCards
};

/**
 * dataContainerWithLoading.js
 * A component that wraps data containers (tables, charts) with loading states
 * and provides a unified interface for handling data loading and transitions
 */

import { globalLoadingManager, createApiLoadingManager } from '../utils/loadingStateManager.js';
import { logDebug, logError } from '../utils/logger.js';
import { createProgressiveTable } from './progressiveTable.js';
import { createProgressiveChart } from './progressiveChart.js';

/**
 * Creates a data container with loading states
 * @param {HTMLElement} containerElement - The container element
 * @param {Object} options - Configuration options
 * @returns {Object} - Data container controller
 */
export function createDataContainerWithLoading(containerElement, options = {}) {
  if (!containerElement) {
    logError('Container element is required');
    return null;
  }
  
  const {
    type = 'table', // 'table' or 'chart'
    loadingMessage = 'Loading data...',
    errorMessage = 'Failed to load data. Please try again.',
    emptyMessage = 'No data available.',
    dataProvider = null,
    initialData = null,
    progressiveOptions = {},
    refreshInterval = 0, // 0 means no auto-refresh
    renderDelay = 50, // Small delay to allow UI to update before rendering
    showLoadingIndicator = true,
    showEmptyState = true,
    showErrorState = true,
    onDataLoaded = null,
    onError = null
  } = options;
  
  // Create API loading manager
  const apiLoadingManager = createApiLoadingManager({
    containerSelector: `#${containerElement.id}`,
    loadingMessage,
    errorMessage,
    showSuccessMessage: false
  });
  
  // Create container structure
  setupContainerStructure(containerElement, type);
  
  // Get container elements
  const contentContainer = containerElement.querySelector('.data-content');
  const emptyStateContainer = containerElement.querySelector('.empty-state');
  const errorStateContainer = containerElement.querySelector('.error-state');
  const refreshButton = containerElement.querySelector('.refresh-button');
  
  // Create progressive component based on type
  let progressiveComponent = null;
  
  if (type === 'table') {
    progressiveComponent = createProgressiveTable(contentContainer, progressiveOptions);
  } else if (type === 'chart') {
    progressiveComponent = createProgressiveChart(contentContainer, progressiveOptions);
  } else {
    logError(`Invalid container type: ${type}`);
    return null;
  }
  
  // Set initial state
  let currentData = initialData || [];
  let isLoading = false;
  let hasError = false;
  let refreshTimerId = null;
  
  // Initialize with initial data if provided
  if (initialData && initialData.length > 0) {
    setTimeout(() => {
      progressiveComponent.setData(initialData);
      updateContainerState();
    }, renderDelay);
  } else {
    updateContainerState();
  }
  
  // Set up refresh button
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      refreshData();
    });
  }
  
  // Set up auto-refresh if enabled
  if (refreshInterval > 0 && dataProvider) {
    startAutoRefresh();
  }
  
  /**
   * Set up container structure
   * @param {HTMLElement} container - Container element
   * @param {string} type - Container type ('table' or 'chart')
   */
  function setupContainerStructure(container, type) {
    // Add container class
    container.classList.add('data-container');
    container.classList.add(`data-container-${type}`);
    
    // Create container structure if it doesn't exist
    if (!container.querySelector('.data-content')) {
      container.innerHTML = `
        <div class="data-header">
          <h3 class="data-title">${container.dataset.title || ''}</h3>
          <div class="data-actions">
            <button class="refresh-button" title="Refresh data">
              <i data-feather="refresh-cw"></i>
            </button>
          </div>
        </div>
        <div class="data-content"></div>
        <div class="empty-state" style="display: none;">
          <p>${emptyMessage}</p>
        </div>
        <div class="error-state" style="display: none;">
          <p>${errorMessage}</p>
          <button class="retry-button">Try Again</button>
        </div>
      `;
      
      // Set up retry button
      const retryButton = container.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          refreshData();
        });
      }
      
      // Initialize feather icons if available
      if (window.feather) {
        window.feather.replace();
      }
    }
  }
  
  /**
   * Update container state based on current data and loading state
   */
  function updateContainerState() {
    // Update container classes
    containerElement.classList.toggle('is-loading', isLoading);
    containerElement.classList.toggle('has-error', hasError);
    containerElement.classList.toggle('is-empty', !isLoading && !hasError && (!currentData || currentData.length === 0));
    
    // Update visibility of container elements
    if (contentContainer) {
      contentContainer.style.display = (!isLoading && !hasError && currentData && currentData.length > 0) ? 'block' : 'none';
    }
    
    if (emptyStateContainer && showEmptyState) {
      emptyStateContainer.style.display = (!isLoading && !hasError && (!currentData || currentData.length === 0)) ? 'block' : 'none';
    }
    
    if (errorStateContainer && showErrorState) {
      errorStateContainer.style.display = (hasError && !isLoading) ? 'block' : 'none';
    }
  }
  
  /**
   * Load data using the provided data provider
   * @returns {Promise} - Promise that resolves with the loaded data
   */
  async function loadData() {
    if (!dataProvider) {
      logError('No data provider specified');
      return currentData;
    }
    
    isLoading = true;
    hasError = false;
    updateContainerState();
    
    if (showLoadingIndicator) {
      globalLoadingManager.setLoading(containerElement, true, loadingMessage);
    }
    
    try {
      const data = await apiLoadingManager.withLoading(async () => {
        return await dataProvider();
      });
      
      currentData = data || [];
      isLoading = false;
      hasError = false;
      
      // Render data with a small delay to allow UI to update
      setTimeout(() => {
        progressiveComponent.setData(currentData);
        
        if (onDataLoaded && typeof onDataLoaded === 'function') {
          onDataLoaded(currentData);
        }
        
        updateContainerState();
      }, renderDelay);
      
      return currentData;
    } catch (error) {
      isLoading = false;
      hasError = true;
      
      if (showErrorState) {
        const errorMessageEl = errorStateContainer.querySelector('p');
        if (errorMessageEl) {
          errorMessageEl.textContent = error.message || errorMessage;
        }
      }
      
      if (onError && typeof onError === 'function') {
        onError(error);
      }
      
      updateContainerState();
      logError('Error loading data:', error);
      
      throw error;
    } finally {
      if (showLoadingIndicator) {
        globalLoadingManager.setLoading(containerElement, false);
      }
    }
  }
  
  /**
   * Refresh data
   * @returns {Promise} - Promise that resolves with the refreshed data
   */
  async function refreshData() {
    try {
      return await loadData();
    } catch (error) {
      // Error already handled in loadData
      return currentData;
    }
  }
  
  /**
   * Start auto-refresh timer
   */
  function startAutoRefresh() {
    stopAutoRefresh();
    
    if (refreshInterval > 0) {
      refreshTimerId = setInterval(() => {
        refreshData();
      }, refreshInterval);
    }
  }
  
  /**
   * Stop auto-refresh timer
   */
  function stopAutoRefresh() {
    if (refreshTimerId) {
      clearInterval(refreshTimerId);
      refreshTimerId = null;
    }
  }
  
  /**
   * Set new data
   * @param {Array} data - New data
   */
  function setData(data) {
    currentData = data || [];
    progressiveComponent.setData(currentData);
    updateContainerState();
  }
  
  /**
   * Update container options
   * @param {Object} newOptions - New options
   */
  function updateOptions(newOptions = {}) {
    // Update refresh interval if changed
    if (newOptions.refreshInterval !== undefined && newOptions.refreshInterval !== refreshInterval) {
      refreshInterval = newOptions.refreshInterval;
      
      if (refreshInterval > 0 && dataProvider) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    }
    
    // Update progressive component options if provided
    if (newOptions.progressiveOptions) {
      progressiveComponent.updateOptions(newOptions.progressiveOptions);
    }
  }
  
  /**
   * Destroy the component and clean up resources
   */
  function destroy() {
    stopAutoRefresh();
    
    if (progressiveComponent && typeof progressiveComponent.destroy === 'function') {
      progressiveComponent.destroy();
    }
    
    // Remove event listeners
    const refreshButton = containerElement.querySelector('.refresh-button');
    if (refreshButton) {
      refreshButton.removeEventListener('click', refreshData);
    }
    
    const retryButton = containerElement.querySelector('.retry-button');
    if (retryButton) {
      retryButton.removeEventListener('click', refreshData);
    }
  }
  
  // Return public API
  return {
    loadData,
    refreshData,
    setData,
    updateOptions,
    destroy,
    
    // Getters
    getContainer: () => containerElement,
    getComponent: () => progressiveComponent,
    getData: () => currentData,
    isLoading: () => isLoading,
    hasError: () => hasError,
    
    // Pass-through to progressive component
    render: () => progressiveComponent.render(),
    clear: () => progressiveComponent.clear()
  };
}

/**
 * Creates a table with loading states
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {Object} - Table controller
 */
export function createTableWithLoading(container, options = {}) {
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  return createDataContainerWithLoading(containerElement, {
    type: 'table',
    ...options
  });
}

/**
 * Creates a chart with loading states
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {Object} - Chart controller
 */
export function createChartWithLoading(container, options = {}) {
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  return createDataContainerWithLoading(containerElement, {
    type: 'chart',
    ...options
  });
}

/**
 * loadingIntegration.js
 * Integrates loading states and transitions with the main application
 * Provides a centralized way to manage loading states and transitions
 * for various components throughout the application
 */

import { 
  globalLoadingManager, 
  globalTransitionManager,
  createApiLoadingManager,
  createButtonLoadingState,
  createFormLoadingState
} from '../utils/loadingStateManager.js';
import { createTableWithLoading, createChartWithLoading } from '../components/dataContainerWithLoading.js';
import { logDebug, logError } from '../utils/logger.js';

// Create application-wide API loading manager
const appApiLoadingManager = createApiLoadingManager({
  containerSelector: '#app',
  loadingMessage: 'Loading data...',
  errorMessage: 'Failed to load data. Please try again.',
  showSuccessMessage: false
});

/**
 * Initialize loading states and transitions for the application
 */
export function initLoadingStates() {
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Set up global loading indicator
    setupGlobalLoadingIndicator();
    
    // Set up page transitions
    setupPageTransitions();
    
    // Set up form loading states
    setupFormLoadingStates();
    
    // Set up button loading states
    setupButtonLoadingStates();
    
    // Set up data containers
    setupDataContainers();
    
    // Set up navigation loading states
    setupNavigationLoadingStates();
    
    logDebug('Loading states initialized');
  });
}

/**
 * Set up global loading indicator
 */
function setupGlobalLoadingIndicator() {
  // Create global loading indicator if it doesn't exist
  if (!document.getElementById('global-loading-indicator')) {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'global-loading-indicator';
    loadingIndicator.className = 'global-loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-message">Loading...</div>
    `;
    
    document.body.appendChild(loadingIndicator);
  }
  
  // Listen for API loading events
  window.addEventListener('api-loading-start', (event) => {
    const indicator = document.getElementById('global-loading-indicator');
    if (indicator) {
      const messageEl = indicator.querySelector('.loading-message');
      if (messageEl && event.detail && event.detail.message) {
        messageEl.textContent = event.detail.message;
      }
      
      indicator.classList.add('active');
    }
  });
  
  window.addEventListener('api-loading-end', () => {
    const indicator = document.getElementById('global-loading-indicator');
    if (indicator) {
      indicator.classList.remove('active');
    }
  });
}

/**
 * Set up page transitions
 */
function setupPageTransitions() {
  // Find page containers
  const pageContainers = document.querySelectorAll('.page');
  
  if (pageContainers.length === 0) {
    return;
  }
  
  // Initialize transition manager if not already initialized
  if (!globalTransitionManager) {
    const appContainer = document.querySelector('#app') || document.body;
    
    globalTransitionManager = createTransitionManager({
      containerSelector: appContainer,
      pageClass: 'page',
      activePageClass: 'active',
      transitionDuration: 300,
      defaultTransition: 'fade'
    });
  }
  
  // Set up navigation links
  const navLinks = document.querySelectorAll('a[data-page]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      
      const targetPageId = link.getAttribute('data-page');
      const transition = link.getAttribute('data-transition') || 'fade';
      
      if (targetPageId && globalTransitionManager) {
        globalTransitionManager.showPage(`#${targetPageId}`, transition);
        
        // Update active navigation link
        navLinks.forEach(navLink => {
          navLink.classList.toggle('active', navLink === link);
        });
      }
    });
  });
  
  // Set initial page based on URL hash if present
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    globalTransitionManager.showPage(`#${hash}`, 'fade', false);
    
    // Update active navigation link
    const activeLink = document.querySelector(`a[data-page="${hash}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  } else {
    // Show first page by default
    const firstPage = pageContainers[0];
    if (firstPage && firstPage.id) {
      globalTransitionManager.showPage(`#${firstPage.id}`, 'fade', false);
      
      // Update active navigation link
      const activeLink = document.querySelector(`a[data-page="${firstPage.id}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  }
  
  // Update hash when page changes
  window.addEventListener('page-changed', (event) => {
    if (event.detail && event.detail.pageId) {
      const pageId = event.detail.pageId.substring(1); // Remove leading #
      window.location.hash = pageId;
    }
  });
}

/**
 * Set up form loading states
 */
function setupFormLoadingStates() {
  // Find all forms with data-loading attribute
  const forms = document.querySelectorAll('form[data-loading]');
  
  forms.forEach(form => {
    // Create form loading state
    const formLoading = createFormLoadingState(form, {
      loadingMessage: form.getAttribute('data-loading-message') || 'Submitting...',
      errorMessage: form.getAttribute('data-error-message') || 'Form submission failed. Please try again.',
      successMessage: form.getAttribute('data-success-message') || 'Form submitted successfully.',
      showSuccessMessage: form.getAttribute('data-show-success') !== 'false',
      resetFormOnSuccess: form.getAttribute('data-reset-on-success') === 'true'
    });
    
    // Store loading state controller in form's data
    form._loadingState = formLoading;
    
    // Wrap form submission with loading state
    form.addEventListener('submit', formLoading.withLoading(async (event) => {
      event.preventDefault();
      
      // Get form submission handler if specified
      const handlerName = form.getAttribute('data-submit-handler');
      
      if (handlerName && window[handlerName] && typeof window[handlerName] === 'function') {
        // Call handler with form as argument
        return await window[handlerName](form);
      } else {
        // Default form submission
        const formData = new FormData(form);
        const formAction = form.getAttribute('action') || '';
        const formMethod = form.getAttribute('method') || 'POST';
        
        // Submit form using fetch
        const response = await fetch(formAction, {
          method: formMethod,
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Form submission failed: ${response.statusText}`);
        }
        
        return await response.json();
      }
    }));
  });
}

/**
 * Set up button loading states
 */
function setupButtonLoadingStates() {
  // Find all buttons with data-loading attribute
  const buttons = document.querySelectorAll('button[data-loading]');
  
  buttons.forEach(button => {
    // Create button loading state
    const buttonLoading = createButtonLoadingState(button, {
      loadingText: button.getAttribute('data-loading-text') || '',
      disableWhileLoading: button.getAttribute('data-disable-loading') !== 'false'
    });
    
    // Store loading state controller in button's data
    button._loadingState = buttonLoading;
    
    // Wrap click handler with loading state if handler specified
    const handlerName = button.getAttribute('data-click-handler');
    
    if (handlerName && window[handlerName] && typeof window[handlerName] === 'function') {
      button.addEventListener('click', buttonLoading.withLoading(async (event) => {
        return await window[handlerName](button, event);
      }));
    }
  });
}

/**
 * Set up data containers with loading states
 */
function setupDataContainers() {
  // Find all table containers
  const tableContainers = document.querySelectorAll('[data-container="table"]');
  
  tableContainers.forEach(container => {
    // Get data provider function name if specified
    const dataProviderName = container.getAttribute('data-provider');
    let dataProvider = null;
    
    if (dataProviderName && window[dataProviderName] && typeof window[dataProviderName] === 'function') {
      dataProvider = window[dataProviderName];
    }
    
    // Create table with loading
    const table = createTableWithLoading(container, {
      loadingMessage: container.getAttribute('data-loading-message') || 'Loading data...',
      errorMessage: container.getAttribute('data-error-message') || 'Failed to load data. Please try again.',
      emptyMessage: container.getAttribute('data-empty-message') || 'No data available.',
      dataProvider,
      refreshInterval: parseInt(container.getAttribute('data-refresh-interval') || '0', 10),
      progressiveOptions: {
        columns: JSON.parse(container.getAttribute('data-columns') || '[]'),
        pageSize: parseInt(container.getAttribute('data-page-size') || '10', 10),
        sortable: container.getAttribute('data-sortable') !== 'false',
        filterable: container.getAttribute('data-filterable') !== 'false'
      }
    });
    
    // Store table controller in container's data
    container._tableController = table;
    
    // Load initial data if auto-load is enabled
    if (container.getAttribute('data-auto-load') !== 'false' && dataProvider) {
      table.loadData();
    }
  });
  
  // Find all chart containers
  const chartContainers = document.querySelectorAll('[data-container="chart"]');
  
  chartContainers.forEach(container => {
    // Get data provider function name if specified
    const dataProviderName = container.getAttribute('data-provider');
    let dataProvider = null;
    
    if (dataProviderName && window[dataProviderName] && typeof window[dataProviderName] === 'function') {
      dataProvider = window[dataProviderName];
    }
    
    // Create chart with loading
    const chart = createChartWithLoading(container, {
      loadingMessage: container.getAttribute('data-loading-message') || 'Loading data...',
      errorMessage: container.getAttribute('data-error-message') || 'Failed to load data. Please try again.',
      emptyMessage: container.getAttribute('data-empty-message') || 'No data available.',
      dataProvider,
      refreshInterval: parseInt(container.getAttribute('data-refresh-interval') || '0', 10),
      progressiveOptions: {
        type: container.getAttribute('data-chart-type') || 'line',
        xKey: container.getAttribute('data-x-key') || 'date',
        yKey: container.getAttribute('data-y-key') || 'value',
        groupKey: container.getAttribute('data-group-key') || '',
        aggregation: container.getAttribute('data-aggregation') || 'sum',
        timeUnit: container.getAttribute('data-time-unit') || 'day'
      }
    });
    
    // Store chart controller in container's data
    container._chartController = chart;
    
    // Load initial data if auto-load is enabled
    if (container.getAttribute('data-auto-load') !== 'false' && dataProvider) {
      chart.loadData();
    }
  });
}

/**
 * Set up navigation loading states
 */
function setupNavigationLoadingStates() {
  // Find all navigation links with data-loading attribute
  const navLinks = document.querySelectorAll('a[data-loading]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      // Skip if link has target attribute
      if (link.getAttribute('target')) {
        return;
      }
      
      // Skip if link is for page transition
      if (link.getAttribute('data-page')) {
        return;
      }
      
      // Get loading message
      const loadingMessage = link.getAttribute('data-loading-message') || 'Loading...';
      
      // Show loading indicator
      document.body.classList.add('navigation-loading');
      
      // Show global loading indicator
      const indicator = document.getElementById('global-loading-indicator');
      if (indicator) {
        const messageEl = indicator.querySelector('.loading-message');
        if (messageEl) {
          messageEl.textContent = loadingMessage;
        }
        
        indicator.classList.add('active');
      }
    });
  });
}

/**
 * Show loading state for a specific element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} message - Loading message
 * @returns {Object} - Loading controller
 */
export function showLoading(element, message = 'Loading...') {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
  
  if (!targetElement) {
    logError('Target element not found');
    return null;
  }
  
  return globalLoadingManager.setLoading(targetElement, true, message);
}

/**
 * Hide loading state for a specific element
 * @param {HTMLElement|string} element - Element or selector
 */
export function hideLoading(element) {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
  
  if (!targetElement) {
    logError('Target element not found');
    return;
  }
  
  globalLoadingManager.setLoading(targetElement, false);
}

/**
 * Show error message for a specific element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} message - Error message
 */
export function showError(element, message) {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
  
  if (!targetElement) {
    logError('Target element not found');
    return;
  }
  
  globalLoadingManager.showError(targetElement, message);
}

/**
 * Show success message for a specific element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} message - Success message
 */
export function showSuccess(element, message) {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
  
  if (!targetElement) {
    logError('Target element not found');
    return;
  }
  
  globalLoadingManager.showSuccess(targetElement, message);
}

/**
 * Perform an API call with loading state
 * @param {Function} apiCall - API call function
 * @param {Object} options - Loading options
 * @returns {Promise} - API call result
 */
export function withLoading(apiCall, options = {}) {
  return appApiLoadingManager.withLoading(apiCall, options);
}

/**
 * Navigate to a page with transition
 * @param {string} pageId - Target page ID
 * @param {string} transition - Transition type
 */
export function navigateToPage(pageId, transition = 'fade') {
  if (!globalTransitionManager) {
    logError('Transition manager not initialized');
    return;
  }
  
  // Add # prefix if not present
  const targetPageId = pageId.startsWith('#') ? pageId : `#${pageId}`;
  
  globalTransitionManager.showPage(targetPageId, transition);
  
  // Update active navigation link
  const navLinks = document.querySelectorAll('a[data-page]');
  navLinks.forEach(link => {
    const linkPageId = link.getAttribute('data-page');
    link.classList.toggle('active', linkPageId === pageId || linkPageId === pageId.substring(1));
  });
}

// Export API loading manager for direct use
export { appApiLoadingManager };

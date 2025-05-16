/**
 * filters.js - Filters Component Module
 * Handles filter initialization, application, and UI interaction
 */

import { logDebug } from '../utils/logger.js';

// Filters state
let activeFilters = {};
const FILTERS_KEY = "orderforecast_filters";

/**
 * Initialize filters component
 * @param {Function} onFilterChange - Callback function when filters change
 */
function initializeFilters(onFilterChange) {
  // Load saved filters
  loadFiltersFromStorage();
  
  // Initialize filter controls
  initializeFilterControls(onFilterChange);
  
  // Set up filter toggle button
  setupFilterToggle();
  
  // Initialize advanced filters if available
  initializeAdvancedFilters(onFilterChange);
}

/**
 * Initialize filter controls
 * @param {Function} onFilterChange - Callback function when filters change
 */
function initializeFilterControls(onFilterChange) {
  // Sales rep filter
  const salesRepFilter = document.getElementById('sales-rep-filter');
  if (salesRepFilter) {
    salesRepFilter.addEventListener('change', () => {
      activeFilters.salesRep = salesRepFilter.value || null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.salesRep) {
      salesRepFilter.value = activeFilters.salesRep;
    }
  }
  
  // Deal stage filter
  const dealStageFilter = document.getElementById('deal-stage-filter');
  if (dealStageFilter) {
    dealStageFilter.addEventListener('change', () => {
      activeFilters.dealStage = dealStageFilter.value || null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.dealStage) {
      dealStageFilter.value = activeFilters.dealStage;
    }
  }
  
  // Date range filters
  const startDateFilter = document.getElementById('start-date-filter');
  const endDateFilter = document.getElementById('end-date-filter');
  
  if (startDateFilter) {
    startDateFilter.addEventListener('change', () => {
      activeFilters.startDate = startDateFilter.value || null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.startDate) {
      startDateFilter.value = activeFilters.startDate;
    }
  }
  
  if (endDateFilter) {
    endDateFilter.addEventListener('change', () => {
      activeFilters.endDate = endDateFilter.value || null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.endDate) {
      endDateFilter.value = activeFilters.endDate;
    }
  }
  
  // Amount range filters
  const minAmountFilter = document.getElementById('min-amount-filter');
  const maxAmountFilter = document.getElementById('max-amount-filter');
  
  if (minAmountFilter) {
    minAmountFilter.addEventListener('change', () => {
      activeFilters.minAmount = minAmountFilter.value ? parseFloat(minAmountFilter.value) : null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.minAmount !== undefined && activeFilters.minAmount !== null) {
      minAmountFilter.value = activeFilters.minAmount;
    }
  }
  
  if (maxAmountFilter) {
    maxAmountFilter.addEventListener('change', () => {
      activeFilters.maxAmount = maxAmountFilter.value ? parseFloat(maxAmountFilter.value) : null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.maxAmount !== undefined && activeFilters.maxAmount !== null) {
      maxAmountFilter.value = activeFilters.maxAmount;
    }
  }
  
  // Search filter
  const searchFilter = document.getElementById('search-filter');
  if (searchFilter) {
    searchFilter.addEventListener('input', () => {
      activeFilters.search = searchFilter.value || null;
      saveFiltersToStorage();
      if (onFilterChange) onFilterChange();
    });
    
    // Set initial value from saved filters
    if (activeFilters.search) {
      searchFilter.value = activeFilters.search;
    }
  }
  
  // Reset filters button
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      resetFilters();
      if (onFilterChange) onFilterChange();
    });
  }
}

/**
 * Initialize advanced filters
 * @param {Function} onFilterChange - Callback function when filters change
 */
function initializeAdvancedFilters(onFilterChange) {
  // Advanced filter controls implementation
  // This would be expanded based on your specific advanced filtering needs
  
  // For now, just a placeholder for future implementation
  const advancedFiltersContainer = document.getElementById('advanced-filters');
  if (!advancedFiltersContainer) return;
  
  // Advanced filters toggle
  const advancedFiltersToggle = document.getElementById('advanced-filters-toggle');
  if (advancedFiltersToggle) {
    advancedFiltersToggle.addEventListener('click', () => {
      advancedFiltersContainer.classList.toggle('active');
      
      // Update toggle button text/icon
      const icon = advancedFiltersToggle.querySelector('i');
      if (icon) {
        const isActive = advancedFiltersContainer.classList.contains('active');
        icon.setAttribute('data-feather', isActive ? 'chevron-up' : 'chevron-down');
        feather.replace();
      }
    });
  }
}

/**
 * Set up the filter toggle button
 */
function setupFilterToggle() {
  const filterToggleBtn = document.getElementById('toggle-filters-btn');
  const filtersSection = document.getElementById('filters-section');
  
  if (!filterToggleBtn || !filtersSection) return;
  
  filterToggleBtn.addEventListener('click', () => {
    const isActive = filtersSection.classList.toggle('active');
    filterToggleBtn.classList.toggle('active', isActive);
    
    // Update document CSS variable for filters height
    if (isActive) {
      const filtersHeight = filtersSection.scrollHeight;
      document.documentElement.style.setProperty('--filters-height', `${filtersHeight}px`);
    } else {
      document.documentElement.style.setProperty('--filters-height', '0px');
    }
    
    // Update body padding
    document.body.style.paddingTop = `calc(var(--header-height) + var(--summary-cards-height) + var(--filters-height))`;
  });
}

/**
 * Apply filters to data
 * @param {Array} data - The data to filter
 * @returns {Array} - The filtered data
 */
function applyFilters(data) {
  if (!data || !data.length) return [];
  
  return data.filter(item => {
    // Sales rep filter
    if (activeFilters.salesRep && item.salesRep !== activeFilters.salesRep) {
      return false;
    }
    
    // Deal stage filter
    if (activeFilters.dealStage && item.dealStage !== activeFilters.dealStage) {
      return false;
    }
    
    // Date range filters
    if (activeFilters.startDate) {
      const startDate = new Date(activeFilters.startDate);
      const itemDate = new Date(item.expectedCloseDate);
      if (itemDate < startDate) {
        return false;
      }
    }
    
    if (activeFilters.endDate) {
      const endDate = new Date(activeFilters.endDate);
      const itemDate = new Date(item.expectedCloseDate);
      if (itemDate > endDate) {
        return false;
      }
    }
    
    // Amount range filters
    if (activeFilters.minAmount !== undefined && activeFilters.minAmount !== null) {
      if (item.forecastAmount < activeFilters.minAmount) {
        return false;
      }
    }
    
    if (activeFilters.maxAmount !== undefined && activeFilters.maxAmount !== null) {
      if (item.forecastAmount > activeFilters.maxAmount) {
        return false;
      }
    }
    
    // Search filter
    if (activeFilters.search) {
      const searchTerm = activeFilters.search.toLowerCase();
      const searchFields = [
        item.dealName,
        item.customerName,
        item.salesRep,
        item.dealStage,
        item.notes
      ];
      
      // Check if any field contains the search term
      const matchesSearch = searchFields.some(field => {
        return field && field.toString().toLowerCase().includes(searchTerm);
      });
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    // If all filters pass, include the item
    return true;
  });
}

/**
 * Reset all filters
 */
function resetFilters() {
  // Clear active filters
  activeFilters = {};
  
  // Reset filter controls
  const salesRepFilter = document.getElementById('sales-rep-filter');
  if (salesRepFilter) salesRepFilter.value = '';
  
  const dealStageFilter = document.getElementById('deal-stage-filter');
  if (dealStageFilter) dealStageFilter.value = '';
  
  const startDateFilter = document.getElementById('start-date-filter');
  if (startDateFilter) startDateFilter.value = '';
  
  const endDateFilter = document.getElementById('end-date-filter');
  if (endDateFilter) endDateFilter.value = '';
  
  const minAmountFilter = document.getElementById('min-amount-filter');
  if (minAmountFilter) minAmountFilter.value = '';
  
  const maxAmountFilter = document.getElementById('max-amount-filter');
  if (maxAmountFilter) maxAmountFilter.value = '';
  
  const searchFilter = document.getElementById('search-filter');
  if (searchFilter) searchFilter.value = '';
  
  // Clear saved filters
  localStorage.removeItem(FILTERS_KEY);
  
  logDebug('Filters reset');
}

/**
 * Save filters to local storage
 */
function saveFiltersToStorage() {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(activeFilters));
  logDebug('Filters saved to storage', activeFilters);
}

/**
 * Load filters from local storage
 */
function loadFiltersFromStorage() {
  try {
    const savedFilters = localStorage.getItem(FILTERS_KEY);
    if (savedFilters) {
      activeFilters = JSON.parse(savedFilters);
      logDebug('Filters loaded from storage', activeFilters);
    }
  } catch (error) {
    console.error('Error loading filters from storage:', error);
    activeFilters = {};
  }
}

/**
 * Get the current active filters
 * @returns {Object} - The active filters
 */
function getActiveFilters() {
  return { ...activeFilters };
}

/**
 * Handle filter change event
 * This is the callback that will be passed to initializeFilters
 */
function handleFilterChange() {
  // Dispatch a custom event that other components can listen for
  const event = new CustomEvent('filters-changed', {
    detail: { filters: getActiveFilters() }
  });
  document.dispatchEvent(event);
}

// Export functions
export {
  initializeFilters,
  applyFilters,
  resetFilters,
  getActiveFilters,
  handleFilterChange,
  setupFilterToggle
};

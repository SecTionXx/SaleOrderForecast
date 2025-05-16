// advancedFilters.js - Enhanced filtering capabilities for the dashboard

/**
 * Initialize advanced filtering functionality
 * @param {Function} onFilterChange - Callback function when filters change
 */
function initializeAdvancedFilters(onFilterChange) {
  console.log('Initializing advanced filters...');
  
  // Initialize multi-select filters
  initializeMultiSelectFilters();
  
  // Initialize date range presets
  initializeDateRangePresets();
  
  // Initialize filter presets
  initializeFilterPresets();
  
  // Initialize filter combinations
  initializeFilterCombinations();
}

/**
 * Initialize multi-select filter functionality
 */
function initializeMultiSelectFilters() {
  // Get all multi-select containers
  const multiSelectContainers = document.querySelectorAll('.multi-select-container');
  
  multiSelectContainers.forEach(container => {
    const selectElement = container.querySelector('select');
    const selectedItemsContainer = container.querySelector('.selected-items');
    const dropdownContainer = container.querySelector('.dropdown-container');
    
    if (!selectElement || !selectedItemsContainer || !dropdownContainer) return;
    
    // Hide the original select element
    selectElement.style.display = 'none';
    
    // Create the multi-select UI
    createMultiSelectUI(selectElement, selectedItemsContainer, dropdownContainer);
    
    // Initialize the dropdown toggle
    const dropdownToggle = container.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.addEventListener('click', () => {
        dropdownContainer.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (event) => {
        if (!container.contains(event.target)) {
          dropdownContainer.classList.remove('show');
        }
      });
    }
  });
}

/**
 * Create the multi-select UI elements
 * @param {HTMLSelectElement} selectElement - The original select element
 * @param {HTMLElement} selectedItemsContainer - Container for selected items
 * @param {HTMLElement} dropdownContainer - Container for the dropdown
 */
function createMultiSelectUI(selectElement, selectedItemsContainer, dropdownContainer) {
  // Create dropdown items from select options
  const options = Array.from(selectElement.options);
  
  // Clear existing content
  dropdownContainer.innerHTML = '';
  
  // Create dropdown items
  options.forEach(option => {
    if (option.value === '') return; // Skip the "All" option
    
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = option.value;
    checkbox.id = `multi-${selectElement.id}-${option.value.replace(/\s+/g, '-')}`;
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = option.textContent;
    
    item.appendChild(checkbox);
    item.appendChild(label);
    dropdownContainer.appendChild(item);
    
    // Handle checkbox change
    checkbox.addEventListener('change', () => {
      updateSelectedItems(selectElement, selectedItemsContainer);
      triggerFilterChange(selectElement);
    });
  });
}

/**
 * Update the selected items display
 * @param {HTMLSelectElement} selectElement - The original select element
 * @param {HTMLElement} selectedItemsContainer - Container for selected items
 */
function updateSelectedItems(selectElement, selectedItemsContainer) {
  // Clear existing selected items
  selectedItemsContainer.innerHTML = '';
  
  // Get all checked checkboxes
  const container = selectElement.closest('.multi-select-container');
  const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
  
  if (checkedBoxes.length === 0) {
    const placeholder = document.createElement('span');
    placeholder.className = 'placeholder';
    placeholder.textContent = 'All';
    selectedItemsContainer.appendChild(placeholder);
    return;
  }
  
  // Add selected items
  checkedBoxes.forEach(checkbox => {
    const item = document.createElement('span');
    item.className = 'selected-item';
    item.textContent = checkbox.nextElementSibling.textContent;
    
    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-item';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkbox.checked = false;
      updateSelectedItems(selectElement, selectedItemsContainer);
      triggerFilterChange(selectElement);
    });
    
    item.appendChild(removeBtn);
    selectedItemsContainer.appendChild(item);
  });
}

/**
 * Trigger filter change event
 * @param {HTMLSelectElement} selectElement - The original select element
 */
function triggerFilterChange(selectElement) {
  // Create and dispatch change event
  const event = new Event('change', { bubbles: true });
  selectElement.dispatchEvent(event);
}

/**
 * Initialize date range presets
 */
function initializeDateRangePresets() {
  const dateRangeContainer = document.getElementById('date-range-container');
  if (!dateRangeContainer) return;
  
  const startDateInput = document.getElementById('start-date-filter');
  const endDateInput = document.getElementById('end-date-filter');
  
  if (!startDateInput || !endDateInput) return;
  
  // Create preset buttons container if it doesn't exist
  let presetContainer = document.getElementById('date-presets-container');
  if (!presetContainer) {
    presetContainer = document.createElement('div');
    presetContainer.id = 'date-presets-container';
    presetContainer.className = 'date-presets-container';
    dateRangeContainer.appendChild(presetContainer);
  }
  
  // Define date presets
  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Month', type: 'month' },
    { label: 'Last Month', type: 'last-month' },
    { label: 'This Quarter', type: 'quarter' },
    { label: 'This Year', type: 'year' }
  ];
  
  // Create preset buttons
  presets.forEach(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-preset-btn';
    button.textContent = preset.label;
    
    button.addEventListener('click', () => {
      const [start, end] = calculateDateRange(preset);
      
      // Format dates for input fields (YYYY-MM-DD)
      startDateInput.value = formatDateForInput(start);
      endDateInput.value = formatDateForInput(end);
      
      // Trigger change events
      startDateInput.dispatchEvent(new Event('change', { bubbles: true }));
      endDateInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    presetContainer.appendChild(button);
  });
}

/**
 * Calculate date range based on preset
 * @param {Object} preset - The date preset configuration
 * @returns {Array} - Array with start and end dates
 */
function calculateDateRange(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let start = new Date(today);
  let end = new Date(today);
  
  if (preset.days !== undefined) {
    // Simple day-based presets
    start.setDate(today.getDate() - preset.days);
  } else if (preset.type === 'month') {
    // This month
    start = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (preset.type === 'last-month') {
    // Last month
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    end = new Date(today.getFullYear(), today.getMonth(), 0);
  } else if (preset.type === 'quarter') {
    // This quarter
    const quarter = Math.floor(today.getMonth() / 3);
    start = new Date(today.getFullYear(), quarter * 3, 1);
  } else if (preset.type === 'year') {
    // This year
    start = new Date(today.getFullYear(), 0, 1);
  }
  
  return [start, end];
}

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initialize filter presets (saved filters)
 */
function initializeFilterPresets() {
  // Create filter presets UI elements
  createFilterPresetsUI();
  
  // Load saved presets from localStorage
  loadSavedFilterPresets();
  
  // Initialize save preset button
  const savePresetButton = document.getElementById('save-preset-btn');
  if (savePresetButton) {
    savePresetButton.addEventListener('click', saveCurrentFilterAsPreset);
  }
}

/**
 * Create filter presets UI elements
 */
function createFilterPresetsUI() {
  const filtersSection = document.getElementById('filters-section');
  if (!filtersSection) return;
  
  // Create presets container if it doesn't exist
  let presetsContainer = document.getElementById('filter-presets-container');
  if (!presetsContainer) {
    presetsContainer = document.createElement('div');
    presetsContainer.id = 'filter-presets-container';
    presetsContainer.className = 'filter-presets-container';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'presets-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Saved Filters';
    
    const saveButton = document.createElement('button');
    saveButton.id = 'save-preset-btn';
    saveButton.className = 'save-preset-btn';
    saveButton.innerHTML = '<i data-feather="save"></i> Save Current';
    
    header.appendChild(title);
    header.appendChild(saveButton);
    presetsContainer.appendChild(header);
    
    // Create presets list
    const presetsList = document.createElement('div');
    presetsList.id = 'presets-list';
    presetsList.className = 'presets-list';
    presetsContainer.appendChild(presetsList);
    
    // Add to filters section
    filtersSection.appendChild(presetsContainer);
    
    // Initialize feather icons
    if (window.feather && typeof window.feather.replace === 'function') {
      window.feather.replace();
    }
  }
}

/**
 * Load saved filter presets from localStorage
 */
function loadSavedFilterPresets() {
  const presetsList = document.getElementById('presets-list');
  if (!presetsList) return;
  
  // Clear existing presets
  presetsList.innerHTML = '';
  
  // Get saved presets from localStorage
  const savedPresets = getSavedFilterPresets();
  
  if (savedPresets.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-presets';
    emptyMessage.textContent = 'No saved filters yet';
    presetsList.appendChild(emptyMessage);
    return;
  }
  
  // Create preset items
  savedPresets.forEach((preset, index) => {
    const presetItem = document.createElement('div');
    presetItem.className = 'preset-item';
    
    const presetName = document.createElement('span');
    presetName.className = 'preset-name';
    presetName.textContent = preset.name;
    
    const presetActions = document.createElement('div');
    presetActions.className = 'preset-actions';
    
    const applyButton = document.createElement('button');
    applyButton.className = 'apply-preset-btn';
    applyButton.innerHTML = '<i data-feather="check"></i>';
    applyButton.title = 'Apply Filter';
    applyButton.addEventListener('click', () => applyFilterPreset(preset));
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-preset-btn';
    deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
    deleteButton.title = 'Delete Filter';
    deleteButton.addEventListener('click', () => deleteFilterPreset(index));
    
    presetActions.appendChild(applyButton);
    presetActions.appendChild(deleteButton);
    
    presetItem.appendChild(presetName);
    presetItem.appendChild(presetActions);
    presetsList.appendChild(presetItem);
  });
  
  // Initialize feather icons
  if (window.feather && typeof window.feather.replace === 'function') {
    window.feather.replace();
  }
}

/**
 * Get saved filter presets from localStorage
 * @returns {Array} - Array of saved filter presets
 */
function getSavedFilterPresets() {
  try {
    const presets = localStorage.getItem('orderforecast_filter_presets');
    return presets ? JSON.parse(presets) : [];
  } catch (error) {
    console.error('Error loading saved filter presets:', error);
    return [];
  }
}

/**
 * Save current filter as preset
 */
function saveCurrentFilterAsPreset() {
  // Get current filter values
  const salesRep = document.getElementById('sales-rep-filter')?.value || '';
  const dealStage = document.getElementById('deal-stage-filter')?.value || '';
  const forecastMonth = document.getElementById('forecast-month-filter')?.value || '';
  const searchTerm = document.getElementById('search-deal-filter')?.value || '';
  const startDate = document.getElementById('start-date-filter')?.value || '';
  const endDate = document.getElementById('end-date-filter')?.value || '';
  
  // Check if there are any active filters
  const hasActiveFilters = salesRep || dealStage || forecastMonth || searchTerm || startDate || endDate;
  
  if (!hasActiveFilters) {
    alert('Please set at least one filter before saving');
    return;
  }
  
  // Prompt for preset name
  const presetName = prompt('Enter a name for this filter preset:');
  if (!presetName) return;
  
  // Create preset object
  const preset = {
    name: presetName,
    filters: {
      salesRep,
      dealStage,
      forecastMonth,
      searchTerm,
      startDate,
      endDate
    },
    createdAt: new Date().toISOString()
  };
  
  // Get existing presets
  const savedPresets = getSavedFilterPresets();
  
  // Add new preset
  savedPresets.push(preset);
  
  // Save to localStorage
  localStorage.setItem('orderforecast_filter_presets', JSON.stringify(savedPresets));
  
  // Reload presets UI
  loadSavedFilterPresets();
}

/**
 * Apply filter preset
 * @param {Object} preset - The filter preset to apply
 */
function applyFilterPreset(preset) {
  const filters = preset.filters;
  
  // Apply filters to form elements
  if (filters.salesRep) {
    const salesRepFilter = document.getElementById('sales-rep-filter');
    if (salesRepFilter) {
      salesRepFilter.value = filters.salesRep;
      salesRepFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  if (filters.dealStage) {
    const dealStageFilter = document.getElementById('deal-stage-filter');
    if (dealStageFilter) {
      dealStageFilter.value = filters.dealStage;
      dealStageFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  if (filters.forecastMonth) {
    const forecastMonthFilter = document.getElementById('forecast-month-filter');
    if (forecastMonthFilter) {
      forecastMonthFilter.value = filters.forecastMonth;
      forecastMonthFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  if (filters.searchTerm) {
    const searchDealFilter = document.getElementById('search-deal-filter');
    if (searchDealFilter) {
      searchDealFilter.value = filters.searchTerm;
      searchDealFilter.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  if (filters.startDate) {
    const startDateFilter = document.getElementById('start-date-filter');
    if (startDateFilter) {
      startDateFilter.value = filters.startDate;
      startDateFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  if (filters.endDate) {
    const endDateFilter = document.getElementById('end-date-filter');
    if (endDateFilter) {
      endDateFilter.value = filters.endDate;
      endDateFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

/**
 * Delete filter preset
 * @param {number} index - The index of the preset to delete
 */
function deleteFilterPreset(index) {
  if (!confirm('Are you sure you want to delete this filter preset?')) return;
  
  // Get existing presets
  const savedPresets = getSavedFilterPresets();
  
  // Remove preset at index
  savedPresets.splice(index, 1);
  
  // Save to localStorage
  localStorage.setItem('orderforecast_filter_presets', JSON.stringify(savedPresets));
  
  // Reload presets UI
  loadSavedFilterPresets();
}

/**
 * Initialize filter combinations (AND/OR logic)
 */
function initializeFilterCombinations() {
  const filterLogicContainer = document.getElementById('filter-logic-container');
  if (!filterLogicContainer) return;
  
  // Create filter logic toggle if it doesn't exist
  let logicToggle = document.getElementById('filter-logic-toggle');
  if (!logicToggle) {
    logicToggle = document.createElement('div');
    logicToggle.id = 'filter-logic-toggle';
    logicToggle.className = 'filter-logic-toggle';
    
    const andOption = document.createElement('button');
    andOption.className = 'logic-option active';
    andOption.dataset.logic = 'AND';
    andOption.textContent = 'Match ALL filters (AND)';
    
    const orOption = document.createElement('button');
    orOption.className = 'logic-option';
    orOption.dataset.logic = 'OR';
    orOption.textContent = 'Match ANY filter (OR)';
    
    logicToggle.appendChild(andOption);
    logicToggle.appendChild(orOption);
    
    filterLogicContainer.appendChild(logicToggle);
    
    // Add event listeners
    andOption.addEventListener('click', () => {
      setFilterLogic('AND');
      andOption.classList.add('active');
      orOption.classList.remove('active');
    });
    
    orOption.addEventListener('click', () => {
      setFilterLogic('OR');
      orOption.classList.add('active');
      andOption.classList.remove('active');
    });
  }
}

/**
 * Set filter logic (AND/OR)
 * @param {string} logic - The filter logic to set ('AND' or 'OR')
 */
function setFilterLogic(logic) {
  // Store the filter logic in localStorage
  localStorage.setItem('orderforecast_filter_logic', logic);
  
  // Trigger filter change
  document.dispatchEvent(new CustomEvent('filter-logic-changed', { detail: { logic } }));
}

/**
 * Get current filter logic
 * @returns {string} - The current filter logic ('AND' or 'OR')
 */
function getFilterLogic() {
  return localStorage.getItem('orderforecast_filter_logic') || 'AND';
}

// Export functions
export {
  initializeAdvancedFilters,
  getFilterLogic
};

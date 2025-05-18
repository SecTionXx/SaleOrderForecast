/**
 * progressiveTable.js - Progressive Loading Table Component
 * Provides a reusable component for displaying large datasets with progressive loading
 * and virtualization for improved performance
 */

import { progressiveLoad, virtualizedTable } from '../utils/progressiveLoader.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Create a progressive loading table
 * @param {string|HTMLElement} container - Container element or selector for the table
 * @param {Object} options - Configuration options
 * @returns {Object} - Table control methods
 */
export function createProgressiveTable(container, options = {}) {
  // Get container element
  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerEl) {
    logError('Progressive table container not found:', container);
    return null;
  }
  
  const {
    columns = [],                // Column definitions
    data = [],                   // Table data
    pageSize = 50,               // Number of rows per page
    height = '400px',            // Table height
    rowHeight = 40,              // Height of each row
    headerHeight = 50,           // Height of the header
    loadingText = 'Loading data...', // Text to show while loading
    emptyText = 'No data available', // Text to show when no data
    sortable = true,             // Whether columns are sortable
    filterable = true,           // Whether columns are filterable
    selectable = false,          // Whether rows are selectable
    onRowClick = null,           // Row click handler
    onSort = null,               // Sort handler
    onFilter = null,             // Filter handler
    onSelectionChange = null,    // Selection change handler
    getRowKey = (row) => row.id || row._id || null, // Function to get row key
    className = '',              // Additional CSS class
    virtualized = true,          // Whether to use virtualization
    progressiveRendering = true, // Whether to render progressively
    showLoadingIndicator = true  // Whether to show loading indicator
  } = options;
  
  // State variables
  let tableData = [...data];
  let sortColumn = null;
  let sortDirection = 'asc';
  let filters = {};
  let selectedRows = new Set();
  let isLoading = false;
  let virtualTable = null;
  
  // Create table elements
  containerEl.className = `progressive-table-container ${className}`;
  containerEl.style.height = height;
  containerEl.style.overflow = 'auto';
  containerEl.style.position = 'relative';
  
  // Create table structure
  const tableEl = document.createElement('div');
  tableEl.className = 'progressive-table';
  
  const headerEl = document.createElement('div');
  headerEl.className = 'table-header';
  
  const bodyEl = document.createElement('div');
  bodyEl.className = 'table-body';
  
  const loadingEl = document.createElement('div');
  loadingEl.className = 'table-loading';
  loadingEl.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">${loadingText}</div>
    <div class="loading-progress">0%</div>
  `;
  loadingEl.style.display = 'none';
  
  const emptyEl = document.createElement('div');
  emptyEl.className = 'table-empty';
  emptyEl.textContent = emptyText;
  emptyEl.style.display = 'none';
  
  containerEl.appendChild(tableEl);
  tableEl.appendChild(headerEl);
  tableEl.appendChild(bodyEl);
  containerEl.appendChild(loadingEl);
  containerEl.appendChild(emptyEl);
  
  // Render table header
  function renderHeader() {
    headerEl.innerHTML = '';
    headerEl.style.height = `${headerHeight}px`;
    
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';
    
    // Add selection column if selectable
    if (selectable) {
      const selectAllCell = document.createElement('div');
      selectAllCell.className = 'header-cell select-cell';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'select-all-checkbox';
      checkbox.checked = selectedRows.size > 0 && selectedRows.size === tableData.length;
      checkbox.indeterminate = selectedRows.size > 0 && selectedRows.size < tableData.length;
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          // Select all rows
          selectedRows.clear();
          tableData.forEach(row => {
            const rowKey = getRowKey(row);
            if (rowKey !== null) {
              selectedRows.add(rowKey);
            }
          });
        } else {
          // Deselect all rows
          selectedRows.clear();
        }
        
        // Update UI
        renderBody();
        
        // Trigger selection change handler
        if (onSelectionChange) {
          const selectedItems = tableData.filter(row => {
            const rowKey = getRowKey(row);
            return rowKey !== null && selectedRows.has(rowKey);
          });
          
          onSelectionChange(selectedItems, selectedRows);
        }
      });
      
      selectAllCell.appendChild(checkbox);
      headerRow.appendChild(selectAllCell);
    }
    
    // Add column headers
    columns.forEach(column => {
      const headerCell = document.createElement('div');
      headerCell.className = 'header-cell';
      headerCell.style.width = column.width || 'auto';
      
      const headerContent = document.createElement('div');
      headerContent.className = 'header-content';
      headerContent.textContent = column.title || column.field || '';
      
      headerCell.appendChild(headerContent);
      
      // Add sort indicator if sortable
      if (sortable && column.sortable !== false) {
        headerCell.classList.add('sortable');
        
        const sortIndicator = document.createElement('span');
        sortIndicator.className = 'sort-indicator';
        
        if (sortColumn === column.field) {
          sortIndicator.classList.add(sortDirection);
          headerCell.classList.add('sorted');
        }
        
        headerContent.appendChild(sortIndicator);
        
        // Add sort handler
        headerCell.addEventListener('click', () => {
          if (sortColumn === column.field) {
            // Toggle sort direction
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            // Set new sort column
            sortColumn = column.field;
            sortDirection = 'asc';
          }
          
          // Sort data
          sortData();
          
          // Update UI
          renderHeader();
          renderBody();
          
          // Trigger sort handler
          if (onSort) {
            onSort(sortColumn, sortDirection);
          }
        });
      }
      
      // Add filter if filterable
      if (filterable && column.filterable !== false) {
        headerCell.classList.add('filterable');
        
        const filterIcon = document.createElement('span');
        filterIcon.className = 'filter-icon';
        filterIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>';
        
        if (filters[column.field]) {
          headerCell.classList.add('filtered');
        }
        
        headerContent.appendChild(filterIcon);
        
        // Add filter handler
        filterIcon.addEventListener('click', (event) => {
          event.stopPropagation(); // Prevent sort
          
          // Show filter popup
          showFilterPopup(column, event.target);
        });
      }
      
      headerRow.appendChild(headerCell);
    });
    
    headerEl.appendChild(headerRow);
  }
  
  // Render table body
  function renderBody() {
    if (virtualized && virtualTable) {
      // Update virtualized table
      virtualTable.refresh();
      return;
    }
    
    bodyEl.innerHTML = '';
    
    // Show empty message if no data
    if (tableData.length === 0) {
      emptyEl.style.display = 'flex';
      return;
    } else {
      emptyEl.style.display = 'none';
    }
    
    if (virtualized) {
      // Create virtualized table
      virtualTable = virtualizedTable(containerEl, tableData, renderRow, {
        rowHeight,
        headerHeight,
        getRowKey,
        overscan: 10
      });
    } else if (progressiveRendering) {
      // Progressive rendering
      setLoading(true);
      
      progressiveLoad(tableData, (chunk) => {
        chunk.forEach(row => {
          const rowEl = document.createElement('div');
          rowEl.className = 'table-row';
          rowEl.style.height = `${rowHeight}px`;
          
          renderRowContent(rowEl, row);
          bodyEl.appendChild(rowEl);
        });
      }, {
        chunkSize: pageSize,
        delayBetweenChunks: 10,
        onProgress: (progress) => {
          updateLoadingProgress(progress.progress);
        },
        onComplete: () => {
          setLoading(false);
        }
      });
    } else {
      // Standard rendering
      tableData.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'table-row';
        rowEl.style.height = `${rowHeight}px`;
        
        renderRowContent(rowEl, row);
        bodyEl.appendChild(rowEl);
      });
    }
  }
  
  // Render a single row (for virtualized table)
  function renderRow(rowEl, row, index) {
    rowEl.className = 'table-row';
    rowEl.style.height = `${rowHeight}px`;
    
    renderRowContent(rowEl, row);
    return rowEl;
  }
  
  // Render row content
  function renderRowContent(rowEl, row) {
    rowEl.innerHTML = '';
    
    const rowKey = getRowKey(row);
    
    // Add selection cell if selectable
    if (selectable) {
      const selectCell = document.createElement('div');
      selectCell.className = 'table-cell select-cell';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'select-row-checkbox';
      checkbox.checked = rowKey !== null && selectedRows.has(rowKey);
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          // Select row
          if (rowKey !== null) {
            selectedRows.add(rowKey);
          }
        } else {
          // Deselect row
          if (rowKey !== null) {
            selectedRows.delete(rowKey);
          }
        }
        
        // Update header checkbox
        updateSelectAllCheckbox();
        
        // Trigger selection change handler
        if (onSelectionChange) {
          const selectedItems = tableData.filter(row => {
            const key = getRowKey(row);
            return key !== null && selectedRows.has(key);
          });
          
          onSelectionChange(selectedItems, selectedRows);
        }
      });
      
      selectCell.appendChild(checkbox);
      rowEl.appendChild(selectCell);
    }
    
    // Add row click handler
    if (onRowClick) {
      rowEl.classList.add('clickable');
      rowEl.addEventListener('click', (event) => {
        // Don't trigger if clicking on checkbox
        if (event.target.type !== 'checkbox') {
          onRowClick(row, event);
        }
      });
    }
    
    // Add cells for each column
    columns.forEach(column => {
      const cell = document.createElement('div');
      cell.className = 'table-cell';
      cell.style.width = column.width || 'auto';
      
      // Get cell value
      let value = row[column.field];
      
      // Format value if formatter provided
      if (column.formatter) {
        value = column.formatter(value, row);
      }
      
      // Render cell content
      if (column.render) {
        // Custom render function
        const content = column.render(value, row);
        
        if (typeof content === 'string') {
          cell.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          cell.appendChild(content);
        }
      } else {
        // Default rendering
        cell.textContent = value !== undefined && value !== null ? value : '';
      }
      
      rowEl.appendChild(cell);
    });
    
    // Highlight selected row
    if (rowKey !== null && selectedRows.has(rowKey)) {
      rowEl.classList.add('selected');
    }
  }
  
  // Show filter popup
  function showFilterPopup(column, target) {
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'filter-popup';
    
    // Get current filter value
    const currentFilter = filters[column.field] || '';
    
    // Create filter input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'filter-input';
    input.placeholder = `Filter ${column.title || column.field}...`;
    input.value = currentFilter;
    
    // Create buttons
    const applyButton = document.createElement('button');
    applyButton.className = 'filter-button apply';
    applyButton.textContent = 'Apply';
    
    const clearButton = document.createElement('button');
    clearButton.className = 'filter-button clear';
    clearButton.textContent = 'Clear';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'filter-button close';
    closeButton.textContent = 'Cancel';
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'filter-buttons';
    buttonContainer.appendChild(applyButton);
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(closeButton);
    
    // Add elements to popup
    popup.appendChild(input);
    popup.appendChild(buttonContainer);
    
    // Position popup
    const rect = target.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    
    popup.style.position = 'absolute';
    popup.style.top = `${rect.bottom - containerRect.top + 5}px`;
    popup.style.left = `${rect.left - containerRect.left}px`;
    popup.style.zIndex = '1000';
    
    // Add popup to container
    containerEl.appendChild(popup);
    
    // Focus input
    input.focus();
    
    // Apply filter
    function applyFilter() {
      const value = input.value.trim();
      
      if (value) {
        filters[column.field] = value;
      } else {
        delete filters[column.field];
      }
      
      // Filter data
      filterData();
      
      // Update UI
      renderHeader();
      renderBody();
      
      // Trigger filter handler
      if (onFilter) {
        onFilter(filters);
      }
      
      // Remove popup
      containerEl.removeChild(popup);
    }
    
    // Clear filter
    function clearFilter() {
      delete filters[column.field];
      
      // Filter data
      filterData();
      
      // Update UI
      renderHeader();
      renderBody();
      
      // Trigger filter handler
      if (onFilter) {
        onFilter(filters);
      }
      
      // Remove popup
      containerEl.removeChild(popup);
    }
    
    // Close popup
    function closePopup() {
      containerEl.removeChild(popup);
    }
    
    // Add event listeners
    applyButton.addEventListener('click', applyFilter);
    clearButton.addEventListener('click', clearFilter);
    closeButton.addEventListener('click', closePopup);
    
    // Apply filter on Enter
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        applyFilter();
      } else if (event.key === 'Escape') {
        closePopup();
      }
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function clickOutside(event) {
      if (!popup.contains(event.target) && event.target !== target) {
        closePopup();
        document.removeEventListener('click', clickOutside);
      }
    });
  }
  
  // Sort data
  function sortData() {
    if (!sortColumn) {
      return;
    }
    
    tableData.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      // Handle null/undefined values
      if (aValue === undefined || aValue === null) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (bValue === undefined || bValue === null) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      
      // Compare values based on type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }
  
  // Filter data
  function filterData() {
    // Reset to original data
    tableData = [...data];
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      tableData = tableData.filter(row => {
        return Object.entries(filters).every(([field, filterValue]) => {
          const value = row[field];
          
          if (value === undefined || value === null) {
            return false;
          }
          
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      });
    }
    
    // Apply sort
    sortData();
  }
  
  // Update select all checkbox
  function updateSelectAllCheckbox() {
    const checkbox = headerEl.querySelector('.select-all-checkbox');
    
    if (checkbox) {
      checkbox.checked = selectedRows.size > 0 && selectedRows.size === tableData.length;
      checkbox.indeterminate = selectedRows.size > 0 && selectedRows.size < tableData.length;
    }
  }
  
  // Set loading state
  function setLoading(loading) {
    isLoading = loading;
    
    if (showLoadingIndicator) {
      loadingEl.style.display = loading ? 'flex' : 'none';
    }
  }
  
  // Update loading progress
  function updateLoadingProgress(progress) {
    const progressEl = loadingEl.querySelector('.loading-progress');
    
    if (progressEl) {
      progressEl.textContent = `${progress}%`;
    }
  }
  
  // Initialize table
  function initialize() {
    // Filter and sort initial data
    filterData();
    
    // Render table
    renderHeader();
    renderBody();
    
    // Show empty message if no data
    if (tableData.length === 0) {
      emptyEl.style.display = 'flex';
    }
  }
  
  // Initialize
  initialize();
  
  // Return public API
  return {
    // Get current data
    getData: () => tableData,
    
    // Set new data
    setData: (newData) => {
      data = [...newData];
      filterData();
      renderBody();
    },
    
    // Add data
    addData: (newData) => {
      data = [...data, ...newData];
      filterData();
      renderBody();
    },
    
    // Refresh table
    refresh: () => {
      filterData();
      renderHeader();
      renderBody();
    },
    
    // Set sort
    setSort: (column, direction) => {
      sortColumn = column;
      sortDirection = direction || 'asc';
      sortData();
      renderHeader();
      renderBody();
    },
    
    // Set filter
    setFilter: (column, value) => {
      if (value) {
        filters[column] = value;
      } else {
        delete filters[column];
      }
      
      filterData();
      renderHeader();
      renderBody();
    },
    
    // Clear filters
    clearFilters: () => {
      filters = {};
      filterData();
      renderHeader();
      renderBody();
    },
    
    // Get selected rows
    getSelected: () => {
      return tableData.filter(row => {
        const rowKey = getRowKey(row);
        return rowKey !== null && selectedRows.has(rowKey);
      });
    },
    
    // Set selected rows
    setSelected: (keys) => {
      selectedRows.clear();
      
      keys.forEach(key => {
        selectedRows.add(key);
      });
      
      updateSelectAllCheckbox();
      renderBody();
    },
    
    // Clear selection
    clearSelection: () => {
      selectedRows.clear();
      updateSelectAllCheckbox();
      renderBody();
    },
    
    // Destroy table
    destroy: () => {
      if (virtualTable) {
        virtualTable.destroy();
      }
      
      containerEl.innerHTML = '';
    }
  };
}

/**
 * Create a data table with progressive loading
 * Simplified version with default styling
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Array} columns - Column definitions
 * @param {Array} data - Table data
 * @param {Object} options - Additional options
 * @returns {Object} - Table control methods
 */
export function createDataTable(container, columns, data, options = {}) {
  return createProgressiveTable(container, {
    columns,
    data,
    ...options
  });
}

/**
 * table.js - Table Component Module
 * Handles table initialization, population, and interaction
 */

import { formatDate, formatCurrency, displayErrorMessage } from '../utils/uiHelpers.js';
import { logDebug, logError } from '../utils/logger.js';

// Table state
let currentPage = 1;
let rowsPerPage = 10;
let sortColumn = 'lastUpdated';
let sortDirection = 'desc';

/**
 * Initialize the table component
 */
function initializeTable() {
  initializeRowDetails();
  initializeRowSelection();
  initializePagination();
  initializeSorting();
}

/**
 * Initialize row details functionality
 */
function initializeRowDetails() {
  const tableBody = document.getElementById('forecast-table-body');
  if (!tableBody) return;
  
  // Delegate click event for expandable rows
  tableBody.addEventListener('click', (event) => {
    const expandButton = event.target.closest('.expand-row-btn');
    if (!expandButton) return;
    
    const row = expandButton.closest('tr');
    const detailsRow = row.nextElementSibling;
    
    if (detailsRow && detailsRow.classList.contains('row-details')) {
      // Toggle visibility
      const isExpanded = detailsRow.classList.toggle('expanded');
      
      // Update button icon
      const icon = expandButton.querySelector('i');
      if (icon) {
        if (isExpanded) {
          icon.setAttribute('data-feather', 'chevron-up');
        } else {
          icon.setAttribute('data-feather', 'chevron-down');
        }
        feather.replace();
      }
    }
  });
}

/**
 * Initialize row selection functionality
 */
function initializeRowSelection() {
  const tableBody = document.getElementById('forecast-table-body');
  if (!tableBody) return;
  
  // Delegate click event for row selection
  tableBody.addEventListener('click', (event) => {
    const checkbox = event.target.closest('input[type="checkbox"]');
    if (!checkbox) return;
    
    const row = checkbox.closest('tr');
    if (row) {
      row.classList.toggle('selected', checkbox.checked);
      updateSelectedCount();
    }
  });
  
  // Select all checkbox
  const selectAllCheckbox = document.getElementById('select-all-rows');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const row = checkbox.closest('tr');
        if (row) {
          row.classList.toggle('selected', checkbox.checked);
        }
      });
      updateSelectedCount();
    });
  }
}

/**
 * Update the selected rows count
 */
function updateSelectedCount() {
  const selectedCountElement = document.getElementById('selected-count');
  if (!selectedCountElement) return;
  
  const selectedRows = document.querySelectorAll('#forecast-table-body tr.selected');
  selectedCountElement.textContent = selectedRows.length;
  
  // Show/hide bulk actions
  const bulkActions = document.getElementById('bulk-actions');
  if (bulkActions) {
    bulkActions.style.display = selectedRows.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Initialize pagination functionality
 */
function initializePagination() {
  // Rows per page selector
  const rowsPerPageSelect = document.getElementById('rows-per-page');
  if (rowsPerPageSelect) {
    rowsPerPageSelect.addEventListener('change', () => {
      rowsPerPage = parseInt(rowsPerPageSelect.value, 10);
      currentPage = 1; // Reset to first page
      const event = new CustomEvent('pagination-changed');
      document.dispatchEvent(event);
    });
  }
  
  // Previous page button
  const prevButton = document.getElementById('pagination-prev');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        const event = new CustomEvent('pagination-changed');
        document.dispatchEvent(event);
      }
    });
  }
  
  // Next page button
  const nextButton = document.getElementById('pagination-next');
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const totalPages = Math.ceil(document.querySelectorAll('#forecast-table-body tr:not(.row-details)').length / rowsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        const event = new CustomEvent('pagination-changed');
        document.dispatchEvent(event);
      }
    });
  }
}

/**
 * Initialize sorting functionality
 */
function initializeSorting() {
  const tableHeaders = document.querySelectorAll('th[data-sort]');
  tableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-sort');
      
      // Toggle direction if same column, otherwise default to ascending
      if (column === sortColumn) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      
      // Update sort indicators
      updateSortIndicators();
      
      // Trigger sort event
      const event = new CustomEvent('sort-changed', {
        detail: { column: sortColumn, direction: sortDirection }
      });
      document.dispatchEvent(event);
    });
  });
}

/**
 * Update sort indicators in the table headers
 */
function updateSortIndicators() {
  const tableHeaders = document.querySelectorAll('th[data-sort]');
  tableHeaders.forEach(header => {
    // Remove existing indicators
    header.classList.remove('sort-asc', 'sort-desc');
    
    // Add indicator to current sort column
    if (header.getAttribute('data-sort') === sortColumn) {
      header.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

/**
 * Populate the table with data
 * @param {Array} data - The data to populate the table with
 */
function populateTable(data) {
  const tableBody = document.getElementById('forecast-table-body');
  if (!tableBody) {
    logError('Table body element not found');
    return;
  }
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Check if data is empty
  if (!data || data.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="8" class="text-center py-4 text-gray-500">
        No data available. Try adjusting your filters.
      </td>
    `;
    tableBody.appendChild(emptyRow);
    updatePaginationInfo(0, 0);
    return;
  }
  
  // Apply pagination
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  
  // Generate rows
  paginatedData.forEach(deal => {
    const row = generateTableRow(deal);
    tableBody.appendChild(row);
  });
  
  // Update pagination info
  updatePaginationInfo(paginatedData.length, data.length);
  
  // Replace feather icons
  if (window.feather) {
    feather.replace();
  }
}

/**
 * Generate a table row for a deal
 * @param {Object} deal - The deal data
 * @returns {HTMLElement} - The generated row
 */
function generateTableRow(deal) {
  const row = document.createElement('tr');
  row.className = 'hover:bg-gray-50';
  row.setAttribute('data-id', deal.id);
  
  row.innerHTML = `
    <td class="px-4 py-3 whitespace-nowrap">
      <div class="flex items-center">
        <input type="checkbox" class="form-checkbox h-4 w-4 text-indigo-600">
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center">
        <div>
          <div class="font-medium text-gray-900">${deal.dealName}</div>
          <div class="text-sm text-gray-500">${deal.customerName}</div>
        </div>
      </div>
    </td>
    <td class="px-4 py-3 whitespace-nowrap">
      ${formatDealStageCell(deal.dealStage)}
    </td>
    <td class="px-4 py-3 whitespace-nowrap">
      ${formatCurrencyCell(deal.forecastAmount)}
    </td>
    <td class="px-4 py-3 whitespace-nowrap">
      ${formatPercentCell(deal.probability)}
    </td>
    <td class="px-4 py-3 whitespace-nowrap">
      ${formatDateCell(deal.expectedCloseDate)}
    </td>
    <td class="px-4 py-3 whitespace-nowrap">
      <div class="text-sm text-gray-900">${deal.salesRep}</div>
    </td>
    <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
      ${createActionButtons(deal)}
    </td>
  `;
  
  return row;
}

/**
 * Format a deal stage cell
 * @param {string} stage - The deal stage
 * @returns {string} - The formatted HTML
 */
function formatDealStageCell(stage) {
  const stageClasses = getStatusBadgeClass(stage);
  return `
    <span class="deal-stage ${stageClasses}">
      ${stage}
    </span>
  `;
}

/**
 * Format a currency cell
 * @param {number} value - The currency value
 * @returns {string} - The formatted HTML
 */
function formatCurrencyCell(value) {
  return `
    <div class="text-sm text-gray-900">${formatCurrency(value)}</div>
  `;
}

/**
 * Format a percentage cell
 * @param {number} value - The percentage value
 * @returns {string} - The formatted HTML
 */
function formatPercentCell(value) {
  const percentage = value * 100;
  let colorClass = 'text-gray-900';
  
  if (percentage >= 75) {
    colorClass = 'text-green-600';
  } else if (percentage >= 50) {
    colorClass = 'text-blue-600';
  } else if (percentage >= 25) {
    colorClass = 'text-yellow-600';
  } else {
    colorClass = 'text-red-600';
  }
  
  return `
    <div class="text-sm ${colorClass} font-medium">${percentage}%</div>
  `;
}

/**
 * Format a date cell
 * @param {string} date - The date string
 * @returns {string} - The formatted HTML
 */
function formatDateCell(date) {
  return `
    <div class="text-sm text-gray-900">${formatDate(date)}</div>
  `;
}

/**
 * Create action buttons for a row
 * @param {Object} deal - The deal data
 * @returns {string} - The HTML for the action buttons
 */
function createActionButtons(deal) {
  return `
    <div class="flex justify-end items-center space-x-2">
      <button class="action-button edit-button" data-id="${deal.id}" title="Edit Deal">
        <i data-feather="edit-2" class="h-4 w-4"></i>
      </button>
      <button class="action-button view-history-btn" data-id="${deal.id}" title="View History">
        <i data-feather="clock" class="h-4 w-4"></i>
      </button>
      <button class="action-button expand-row-btn" title="Show Details">
        <i data-feather="chevron-down" class="h-4 w-4"></i>
      </button>
    </div>
  `;
}

/**
 * Get the CSS class for a status badge
 * @param {string} status - The status text
 * @returns {string} - The CSS class
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Proposal Sent':
      return 'bg-blue-100 text-blue-800';
    case 'Negotiation':
      return 'bg-yellow-100 text-yellow-800';
    case 'Verbal Agreement':
      return 'bg-purple-100 text-purple-800';
    case 'Closed Won':
      return 'bg-green-100 text-green-800';
    case 'Closed Lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Update pagination information
 * @param {number} visibleCount - Number of visible items
 * @param {number} totalCount - Total number of items
 */
function updatePaginationInfo(visibleCount, totalCount) {
  const paginationInfo = document.getElementById('pagination-info');
  if (!paginationInfo) return;
  
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(startIndex + visibleCount - 1, totalCount);
  
  const spans = paginationInfo.querySelectorAll('span');
  if (spans.length >= 3) {
    spans[0].textContent = startIndex;
    spans[1].textContent = endIndex;
    spans[2].textContent = totalCount;
  }
  
  // Update pagination buttons state
  const prevButton = document.getElementById('pagination-prev');
  const nextButton = document.getElementById('pagination-next');
  
  if (prevButton) {
    prevButton.disabled = currentPage <= 1;
  }
  
  if (nextButton) {
    nextButton.disabled = endIndex >= totalCount;
  }
}

/**
 * Reset pagination to the first page
 */
function resetPagination() {
  currentPage = 1;
}

// Export functions
export {
  initializeTable,
  populateTable,
  resetPagination,
  generateTableRow,
  formatDealStageCell,
  formatCurrencyCell,
  formatPercentCell,
  formatDateCell,
  createActionButtons,
  getStatusBadgeClass,
  updatePaginationInfo
};

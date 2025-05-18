/**
 * Table Component
 * A reusable data table component with sorting, filtering, and pagination
 */

import { BaseComponent } from './base/BaseComponent.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Table component that extends BaseComponent
 */
export class Table extends BaseComponent {
  /**
   * Create a new Table
   * @param {Object} options - Table options
   * @param {Array} [options.columns] - Column definitions
   * @param {Array} [options.data] - Table data
   * @param {boolean} [options.sortable] - Whether columns are sortable
   * @param {boolean} [options.filterable] - Whether the table is filterable
   * @param {boolean} [options.paginate] - Whether to enable pagination
   * @param {number} [options.pageSize=10] - Number of rows per page
   * @param {string} [options.emptyMessage='No data available'] - Message to show when no data
   * @param {string} [options.className] - Additional CSS classes
   * @param {Object} [options.styles] - Inline styles
   */
  constructor({
    columns = [],
    data = [],
    sortable = true,
    filterable = true,
    paginate = true,
    pageSize = 10,
    emptyMessage = 'No data available',
    className = '',
    styles = {},
    ...rest
  } = {}) {
    super({
      className: `table-container ${className}`.trim(),
      styles,
      ...rest
    });
    
    this.columns = this.normalizeColumns(columns);
    this.originalData = [...data];
    this.filteredData = [...data];
    this.sortable = sortable;
    this.filterable = filterable;
    this.paginate = paginate;
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filters = {};
    this.emptyMessage = emptyMessage;
    
    // Initialize the table
    this.initialize();
  }
  
  /**
   * Normalize column definitions
   * @param {Array} columns - Column definitions
   * @returns {Array} Normalized column definitions
   */
  normalizeColumns(columns) {
    return columns.map(column => ({
      key: column.key || column.field || '',
      title: column.title || column.header || '',
      field: column.field || column.key || '',
      sortable: column.sortable !== false,
      filterable: column.filterable !== false,
      width: column.width || '',
      align: column.align || 'left',
      render: column.render || null,
      headerRender: column.headerRender || null,
      className: column.className || '',
      ...column
    }));
  }
  
  /**
   * Initialize the table
   */
  initialize() {
    // Create table structure
    this.createTable();
    
    // Render the table
    this.render();
  }
  
  /**
   * Create the table structure
   */
  createTable() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create table wrapper
    this.tableWrapper = document.createElement('div');
    this.tableWrapper.className = 'table-responsive';
    
    // Create the table
    this.table = document.createElement('table');
    this.table.className = 'table';
    
    // Create the header
    this.thead = document.createElement('thead');
    this.thead.className = 'table-header';
    
    // Create the body
    this.tbody = document.createElement('tbody');
    this.tbody.className = 'table-body';
    
    // Create the footer
    this.tfoot = document.createElement('tfoot');
    this.tfoot.className = 'table-footer';
    
    // Assemble the table
    this.table.appendChild(this.thead);
    this.table.appendChild(this.tbody);
    this.tableWrapper.appendChild(this.table);
    this.element.appendChild(this.tableWrapper);
    
    // Add filter row if filterable
    if (this.filterable) {
      this.createFilterRow();
    }
    
    // Add pagination if enabled
    if (this.paginate) {
      this.createPagination();
    }
  }
  
  /**
   * Create the table header
   */
  createHeader() {
    // Clear existing header
    this.thead.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    
    this.columns.forEach(column => {
      const th = document.createElement('th');
      th.className = `column-${column.key} ${column.className || ''}`.trim();
      
      if (column.width) {
        th.style.width = column.width;
      }
      
      if (column.align) {
        th.style.textAlign = column.align;
      }
      
      // Use custom header renderer if provided
      if (typeof column.headerRender === 'function') {
        th.innerHTML = column.headerRender(column);
      } else {
        th.textContent = column.title;
      }
      
      // Add sorting if sortable
      if (this.sortable && column.sortable !== false) {
        th.setAttribute('role', 'button');
        th.setAttribute('tabindex', '0');
        th.classList.add('sortable');
        
        // Add sort indicator
        const sortIcon = document.createElement('span');
        sortIcon.className = 'sort-icon';
        th.appendChild(sortIcon);
        
        // Add sort direction indicator if this is the sorted column
        if (this.sortColumn === column.key) {
          th.classList.add(`sort-${this.sortDirection}`);
        }
        
        // Add click handler for sorting
        th.addEventListener('click', () => this.sortBy(column.key));
        th.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.sortBy(column.key);
          }
        });
      }
      
      headerRow.appendChild(th);
    });
    
    this.thead.appendChild(headerRow);
  }
  
  /**
   * Create the filter row
   */
  createFilterRow() {
    // Clear existing filter row if any
    const existingFilterRow = this.thead.querySelector('.filter-row');
    if (existingFilterRow) {
      this.thead.removeChild(existingFilterRow);
    }
    
    // Create filter row
    const filterRow = document.createElement('tr');
    filterRow.className = 'filter-row';
    
    this.columns.forEach(column => {
      const td = document.createElement('td');
      
      if (column.filterable !== false) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'table-filter';
        input.placeholder = `Filter ${column.title || column.key}`;
        input.setAttribute('data-column', column.key);
        
        // Set initial filter value if any
        if (this.filters[column.key]) {
          input.value = this.filters[column.key];
        }
        
        // Add input event listener for filtering
        input.addEventListener('input', (e) => {
          this.filterBy(column.key, e.target.value);
        });
        
        td.appendChild(input);
      }
      
      filterRow.appendChild(td);
    });
    
    this.thead.appendChild(filterRow);
  }
  
  /**
   * Create the table body
   */
  createBody() {
    // Clear existing body
    this.tbody.innerHTML = '';
    
    // Show empty message if no data
    if (this.filteredData.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = this.columns.length;
      cell.className = 'empty-message';
      cell.textContent = this.emptyMessage;
      row.appendChild(cell);
      this.tbody.appendChild(row);
      return;
    }
    
    // Get paginated data if pagination is enabled
    const displayData = this.paginate 
      ? this.getPaginatedData()
      : this.filteredData;
    
    // Create rows
    displayData.forEach((rowData, rowIndex) => {
      const row = document.createElement('tr');
      row.className = `data-row ${rowIndex % 2 === 0 ? 'even' : 'odd'}`;
      
      this.columns.forEach(column => {
        const cell = document.createElement('td');
        
        if (column.align) {
          cell.style.textAlign = column.align;
        }
        
        // Use custom renderer if provided
        if (typeof column.render === 'function') {
          const content = column.render(rowData[column.field], rowData, rowIndex);
          
          if (content instanceof HTMLElement) {
            cell.appendChild(content);
          } else if (content !== null && content !== undefined) {
            cell.innerHTML = content;
          }
        } else {
          // Default rendering
          const value = rowData[column.field];
          cell.textContent = value !== null && value !== undefined ? String(value) : '';
        }
        
        // Add data attributes for filtering/sorting
        cell.setAttribute('data-column', column.key);
        cell.setAttribute('data-value', rowData[column.field] || '');
        
        row.appendChild(cell);
      });
      
      this.tbody.appendChild(row);
    });
  }
  
  /**
   * Create pagination controls
   */
  createPagination() {
    // Clear existing pagination if any
    const existingPagination = this.element.querySelector('.pagination');
    if (existingPagination) {
      this.element.removeChild(existingPagination);
    }
    
    // Don't show pagination if not enough data
    if (this.filteredData.length <= this.pageSize) {
      return;
    }
    
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    
    // Create pagination container
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-prev';
    prevButton.textContent = 'Previous';
    prevButton.disabled = this.currentPage === 1;
    prevButton.addEventListener('click', () => this.goToPage(this.currentPage - 1));
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-next';
    nextButton.textContent = 'Next';
    nextButton.disabled = this.currentPage === totalPages;
    nextButton.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    
    // Assemble pagination
    pagination.appendChild(prevButton);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextButton);
    
    // Add to table
    this.element.appendChild(pagination);
  }
  
  /**
   * Get paginated data
   * @returns {Array} Paginated data
   */
  getPaginatedData() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredData.slice(startIndex, endIndex);
  }
  
  /**
   * Render the table
   */
  render() {
    this.createHeader();
    this.createBody();
    
    if (this.paginate) {
      this.createPagination();
    }
  }
  
  /**
   * Sort the table by a column
   * @param {string} columnKey - The column key to sort by
   */
  sortBy(columnKey) {
    // Toggle sort direction if clicking the same column
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }
    
    // Sort the data
    this.filteredData.sort((a, b) => {
      const aValue = a[columnKey];
      const bValue = b[columnKey];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // Compare values
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Reset to first page
    this.currentPage = 1;
    
    // Re-render the table
    this.render();
  }
  
  /**
   * Filter the table by column values
   * @param {string} columnKey - The column key to filter by
   * @param {string} value - The filter value
   */
  filterBy(columnKey, value) {
    // Update filters
    if (value) {
      this.filters[columnKey] = value.toLowerCase();
    } else {
      delete this.filters[columnKey];
    }
    
    // Apply filters
    this.filteredData = this.originalData.filter(row => {
      return Object.entries(this.filters).every(([key, filterValue]) => {
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(filterValue);
      });
    });
    
    // Reset to first page
    this.currentPage = 1;
    
    // Re-render the table
    this.render();
  }
  
  /**
   * Go to a specific page
   * @param {number} page - The page number to go to
   */
  goToPage(page) {
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.render();
      
      // Scroll to top of the table
      this.element.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  /**
   * Set the table data
   * @param {Array} data - The new data
   */
  setData(data) {
    this.originalData = [...data];
    this.filteredData = [...data];
    this.currentPage = 1;
    this.filters = {};
    
    // Re-render the table
    this.render();
  }
  
  /**
   * Add a row to the table
   * @param {Object} rowData - The row data to add
   * @param {boolean} [prepend=false] - Whether to prepend the row
   */
  addRow(rowData, prepend = false) {
    if (prepend) {
      this.originalData.unshift(rowData);
    } else {
      this.originalData.push(rowData);
    }
    
    // Reapply filters and re-render
    this.filteredData = [...this.originalData];
    
    if (Object.keys(this.filters).length > 0) {
      this.filteredData = this.filteredData.filter(row => {
        return Object.entries(this.filters).every(([key, value]) => {
          const cellValue = String(row[key] || '').toLowerCase();
          return cellValue.includes(value);
        });
      });
    }
    
    // Re-render the table
    this.render();
  }
  
  /**
   * Update a row in the table
   * @param {number} index - The index of the row to update
   * @param {Object} rowData - The updated row data
   */
  updateRow(index, rowData) {
    if (index >= 0 && index < this.originalData.length) {
      this.originalData[index] = { ...this.originalData[index], ...rowData };
      
      // Find and update in filtered data
      const rowId = this.originalData[index].id; // Assuming each row has an id
      if (rowId) {
        const filteredIndex = this.filteredData.findIndex(row => row.id === rowId);
        if (filteredIndex !== -1) {
          this.filteredData[filteredIndex] = { ...this.filteredData[filteredIndex], ...rowData };
        }
      }
      
      // Re-render the table
      this.render();
    }
  }
  
  /**
   * Remove a row from the table
   * @param {number} index - The index of the row to remove
   */
  removeRow(index) {
    if (index >= 0 && index < this.originalData.length) {
      const rowId = this.originalData[index].id; // Assuming each row has an id
      this.originalData.splice(index, 1);
      
      // Remove from filtered data
      if (rowId) {
        const filteredIndex = this.filteredData.findIndex(row => row.id === rowId);
        if (filteredIndex !== -1) {
          this.filteredData.splice(filteredIndex, 1);
        }
      }
      
      // Re-render the table
      this.render();
    }
  }
  
  /**
   * Get the current table data
   * @returns {Array} The current table data
   */
  getData() {
    return [...this.originalData];
  }
  
  /**
   * Get the filtered table data
   * @returns {Array} The filtered table data
   */
  getFilteredData() {
    return [...this.filteredData];
  }
  
  /**
   * Clean up the table
   */
  destroy() {
    // Remove event listeners
    // (Event listeners are automatically cleaned up by the browser when elements are removed)
    
    // Call parent destroy
    super.destroy();
  }
}

// Export a convenience function to create tables
export function createTable(options) {
  return new Table(options);
}

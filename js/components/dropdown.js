/**
 * dropdown.js - Reusable Dropdown Component
 * Provides a standardized dropdown implementation with various options
 */

import { logDebug } from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

class Dropdown {
  /**
   * Create a new dropdown instance
   * @param {Object} options - Dropdown configuration options
   */
  constructor(options = {}) {
    this.options = {
      id: options.id || `dropdown-${generateId()}`,
      trigger: options.trigger || null, // DOM element that triggers the dropdown
      container: options.container || null, // DOM element that contains the dropdown
      items: options.items || [], // Array of dropdown items
      position: options.position || 'bottom-start', // top, bottom, left, right with -start or -end
      width: options.width || 'auto', // auto, fit-content, or specific width
      maxHeight: options.maxHeight || null,
      closeOnSelect: options.closeOnSelect !== false,
      closeOnClickOutside: options.closeOnClickOutside !== false,
      animation: options.animation || 'fade', // fade, slide, none
      className: options.className || '',
      itemClassName: options.itemClassName || '',
      selectedClassName: options.selectedClassName || 'selected',
      disabledClassName: options.disabledClassName || 'disabled',
      onSelect: options.onSelect || null,
      onOpen: options.onOpen || null,
      onClose: options.onClose || null,
      multiSelect: options.multiSelect || false,
      searchable: options.searchable || false,
      placeholder: options.placeholder || 'Select an option',
      emptyMessage: options.emptyMessage || 'No options available',
      noResultsMessage: options.noResultsMessage || 'No results found'
    };
    
    this.element = null;
    this.triggerElement = null;
    this.containerElement = null;
    this.menuElement = null;
    this.searchInput = null;
    this.isOpen = false;
    this.selectedItems = options.selectedItems || [];
    this.eventHandlers = {};
    
    // Initialize the dropdown
    this._init();
    
    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.toggle = this.toggle.bind(this);
    this._handleClickOutside = this._handleClickOutside.bind(this);
    this._handleTriggerClick = this._handleTriggerClick.bind(this);
    this._handleItemClick = this._handleItemClick.bind(this);
    this._handleSearch = this._handleSearch.bind(this);
  }
  
  /**
   * Initialize the dropdown
   * @private
   */
  _init() {
    // Get or create trigger element
    if (this.options.trigger) {
      if (typeof this.options.trigger === 'string') {
        this.triggerElement = document.querySelector(this.options.trigger);
      } else if (this.options.trigger instanceof HTMLElement) {
        this.triggerElement = this.options.trigger;
      }
    }
    
    // Get or create container element
    if (this.options.container) {
      if (typeof this.options.container === 'string') {
        this.containerElement = document.querySelector(this.options.container);
      } else if (this.options.container instanceof HTMLElement) {
        this.containerElement = this.options.container;
      }
    } else if (this.triggerElement) {
      // Use trigger's parent as container if not specified
      this.containerElement = this.triggerElement.parentElement;
    }
    
    // Create dropdown element if not using an existing one
    if (!document.getElementById(this.options.id)) {
      this._createDropdownElement();
    } else {
      this.element = document.getElementById(this.options.id);
      this._setupExistingDropdown();
    }
    
    // Set up event listeners
    if (this.triggerElement) {
      this.triggerElement.addEventListener('click', this._handleTriggerClick);
    }
    
    if (this.options.closeOnClickOutside) {
      document.addEventListener('click', this._handleClickOutside);
    }
    
    // Set up search if enabled
    if (this.options.searchable && this.searchInput) {
      this.searchInput.addEventListener('input', this._handleSearch);
    }
  }
  
  /**
   * Create the dropdown DOM element
   * @private
   */
  _createDropdownElement() {
    // Create dropdown container
    this.element = document.createElement('div');
    this.element.id = this.options.id;
    this.element.className = `dropdown ${this.options.className}`;
    this.element.setAttribute('aria-expanded', 'false');
    
    // Create dropdown menu
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'dropdown-menu';
    
    // Set position
    this.menuElement.classList.add(`dropdown-${this.options.position}`);
    
    // Set width
    if (this.options.width !== 'auto') {
      this.menuElement.style.width = typeof this.options.width === 'number' 
        ? `${this.options.width}px` 
        : this.options.width;
    }
    
    // Set max height if provided
    if (this.options.maxHeight) {
      this.menuElement.style.maxHeight = typeof this.options.maxHeight === 'number' 
        ? `${this.options.maxHeight}px` 
        : this.options.maxHeight;
      this.menuElement.style.overflowY = 'auto';
    }
    
    // Add search input if searchable
    if (this.options.searchable) {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'dropdown-search';
      
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = 'dropdown-search-input';
      this.searchInput.placeholder = 'Search...';
      
      searchContainer.appendChild(this.searchInput);
      this.menuElement.appendChild(searchContainer);
    }
    
    // Create dropdown items
    this._renderItems();
    
    // Append to container
    this.element.appendChild(this.menuElement);
    
    if (this.containerElement) {
      this.containerElement.appendChild(this.element);
    } else {
      document.body.appendChild(this.element);
    }
  }
  
  /**
   * Set up an existing dropdown element
   * @private
   */
  _setupExistingDropdown() {
    // Find dropdown menu
    this.menuElement = this.element.querySelector('.dropdown-menu');
    
    // Find search input if searchable
    if (this.options.searchable) {
      this.searchInput = this.element.querySelector('.dropdown-search-input');
      
      if (this.searchInput) {
        this.searchInput.addEventListener('input', this._handleSearch);
      }
    }
    
    // Set up items
    const items = this.element.querySelectorAll('.dropdown-item');
    items.forEach(item => {
      item.addEventListener('click', this._handleItemClick);
    });
  }
  
  /**
   * Render dropdown items
   * @private
   */
  _renderItems() {
    if (!this.menuElement) return;
    
    // Clear existing items (except search)
    const searchContainer = this.menuElement.querySelector('.dropdown-search');
    this.menuElement.innerHTML = '';
    
    // Re-add search if it exists
    if (searchContainer) {
      this.menuElement.appendChild(searchContainer);
    }
    
    // Check if there are items
    if (this.options.items.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'dropdown-empty';
      emptyMessage.textContent = this.options.emptyMessage;
      this.menuElement.appendChild(emptyMessage);
      return;
    }
    
    // Create item container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'dropdown-items';
    
    // Add items
    this.options.items.forEach((item, index) => {
      // Skip if filtered out by search
      if (item.hidden) return;
      
      const itemElement = document.createElement('div');
      itemElement.className = `dropdown-item ${this.options.itemClassName}`;
      itemElement.setAttribute('data-value', item.value);
      itemElement.setAttribute('data-index', index);
      
      // Set selected state
      if (this._isItemSelected(item)) {
        itemElement.classList.add(this.options.selectedClassName);
      }
      
      // Set disabled state
      if (item.disabled) {
        itemElement.classList.add(this.options.disabledClassName);
      } else {
        itemElement.addEventListener('click', (e) => this._handleItemClick(e, item));
      }
      
      // Set content
      if (typeof item.content === 'string') {
        itemElement.innerHTML = item.content;
      } else if (item.content instanceof HTMLElement) {
        itemElement.appendChild(item.content);
      } else {
        itemElement.textContent = item.label || item.value;
      }
      
      itemsContainer.appendChild(itemElement);
    });
    
    this.menuElement.appendChild(itemsContainer);
    
    // Check if all items are filtered out
    if (this.options.items.every(item => item.hidden)) {
      const noResultsMessage = document.createElement('div');
      noResultsMessage.className = 'dropdown-empty';
      noResultsMessage.textContent = this.options.noResultsMessage;
      this.menuElement.appendChild(noResultsMessage);
    }
  }
  
  /**
   * Check if an item is selected
   * @param {Object} item - Dropdown item
   * @returns {boolean} - True if item is selected
   * @private
   */
  _isItemSelected(item) {
    if (this.options.multiSelect) {
      return this.selectedItems.some(selectedItem => 
        selectedItem.value === item.value || selectedItem === item.value
      );
    } else {
      return this.selectedItems.length > 0 && 
        (this.selectedItems[0].value === item.value || this.selectedItems[0] === item.value);
    }
  }
  
  /**
   * Handle trigger click
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }
  
  /**
   * Handle item click
   * @param {MouseEvent} event - Mouse event
   * @param {Object} item - Dropdown item
   * @private
   */
  _handleItemClick(event, item) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get item if not provided
    if (!item) {
      const index = parseInt(event.currentTarget.getAttribute('data-index'), 10);
      item = this.options.items[index];
    }
    
    // Skip if item is disabled
    if (item.disabled) return;
    
    // Handle selection
    if (this.options.multiSelect) {
      const isSelected = this._isItemSelected(item);
      
      if (isSelected) {
        // Remove from selection
        this.selectedItems = this.selectedItems.filter(selectedItem => 
          selectedItem.value !== item.value && selectedItem !== item.value
        );
      } else {
        // Add to selection
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = [item];
    }
    
    // Update UI
    this._renderItems();
    
    // Call onSelect callback
    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(this.options.multiSelect ? this.selectedItems : this.selectedItems[0], this);
    }
    
    // Trigger select event
    this._triggerEvent('select', {
      item,
      selectedItems: this.selectedItems
    });
    
    // Close dropdown if needed
    if (this.options.closeOnSelect && !this.options.multiSelect) {
      this.close();
    }
  }
  
  /**
   * Handle click outside
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleClickOutside(event) {
    if (!this.isOpen) return;
    
    // Check if click is outside dropdown and trigger
    const isOutside = !this.element.contains(event.target) && 
      (!this.triggerElement || !this.triggerElement.contains(event.target));
    
    if (isOutside) {
      this.close();
    }
  }
  
  /**
   * Handle search input
   * @param {InputEvent} event - Input event
   * @private
   */
  _handleSearch(event) {
    const searchValue = event.target.value.toLowerCase();
    
    // Filter items
    this.options.items.forEach(item => {
      const itemText = (item.label || item.value).toLowerCase();
      item.hidden = searchValue !== '' && !itemText.includes(searchValue);
    });
    
    // Re-render items
    this._renderItems();
  }
  
  /**
   * Open the dropdown
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  open() {
    if (this.isOpen) return this;
    
    logDebug('Dropdown', `Opening dropdown: ${this.options.id}`);
    
    // Show dropdown
    this.element.classList.add('dropdown-open');
    this.element.setAttribute('aria-expanded', 'true');
    
    // Set open state
    this.isOpen = true;
    
    // Focus search input if searchable
    if (this.options.searchable && this.searchInput) {
      setTimeout(() => {
        this.searchInput.focus();
      }, 0);
    }
    
    // Call onOpen callback
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(this);
    }
    
    // Trigger open event
    this._triggerEvent('open');
    
    return this;
  }
  
  /**
   * Close the dropdown
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  close() {
    if (!this.isOpen) return this;
    
    logDebug('Dropdown', `Closing dropdown: ${this.options.id}`);
    
    // Hide dropdown
    this.element.classList.remove('dropdown-open');
    this.element.setAttribute('aria-expanded', 'false');
    
    // Set open state
    this.isOpen = false;
    
    // Clear search if searchable
    if (this.options.searchable && this.searchInput) {
      this.searchInput.value = '';
      
      // Reset hidden state
      this.options.items.forEach(item => {
        item.hidden = false;
      });
      
      // Re-render items
      this._renderItems();
    }
    
    // Call onClose callback
    if (typeof this.options.onClose === 'function') {
      this.options.onClose(this);
    }
    
    // Trigger close event
    this._triggerEvent('close');
    
    return this;
  }
  
  /**
   * Toggle the dropdown
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }
  
  /**
   * Set dropdown items
   * @param {Array} items - Array of dropdown items
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  setItems(items) {
    this.options.items = items;
    this._renderItems();
    return this;
  }
  
  /**
   * Get selected items
   * @returns {Array} - Array of selected items
   */
  getSelectedItems() {
    return this.selectedItems;
  }
  
  /**
   * Set selected items
   * @param {Array|Object} items - Selected items
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  setSelectedItems(items) {
    if (Array.isArray(items)) {
      this.selectedItems = items;
    } else {
      this.selectedItems = [items];
    }
    
    this._renderItems();
    return this;
  }
  
  /**
   * Clear selection
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  clearSelection() {
    this.selectedItems = [];
    this._renderItems();
    return this;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(callback);
    
    return this;
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Dropdown} - The dropdown instance for chaining
   */
  off(event, callback) {
    if (!this.eventHandlers[event]) return this;
    
    if (callback) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
    } else {
      this.eventHandlers[event] = [];
    }
    
    return this;
  }
  
  /**
   * Trigger event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _triggerEvent(event, data = {}) {
    if (!this.eventHandlers[event]) return;
    
    this.eventHandlers[event].forEach(callback => {
      callback({
        type: event,
        target: this,
        data
      });
    });
  }
  
  /**
   * Destroy the dropdown
   */
  destroy() {
    // Remove event listeners
    if (this.triggerElement) {
      this.triggerElement.removeEventListener('click', this._handleTriggerClick);
    }
    
    if (this.options.closeOnClickOutside) {
      document.removeEventListener('click', this._handleClickOutside);
    }
    
    if (this.options.searchable && this.searchInput) {
      this.searchInput.removeEventListener('input', this._handleSearch);
    }
    
    // Remove elements
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clear references
    this.element = null;
    this.menuElement = null;
    this.searchInput = null;
    this.eventHandlers = {};
    this.isOpen = false;
  }
}

export default Dropdown;

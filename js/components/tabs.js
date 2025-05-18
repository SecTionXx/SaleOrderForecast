/**
 * tabs.js - Reusable Tabs Component
 * Provides a standardized tabs implementation with various options
 */

import { logDebug } from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

class Tabs {
  /**
   * Create a new tabs instance
   * @param {Object} options - Tabs configuration options
   */
  constructor(options = {}) {
    this.options = {
      id: options.id || `tabs-${generateId()}`,
      container: options.container || null, // DOM element that contains the tabs
      tabs: options.tabs || [], // Array of tab items
      activeTab: options.activeTab || 0, // Index or ID of active tab
      animation: options.animation || 'fade', // fade, slide, none
      className: options.className || '',
      tabClassName: options.tabClassName || '',
      contentClassName: options.contentClassName || '',
      activeClassName: options.activeClassName || 'active',
      disabledClassName: options.disabledClassName || 'disabled',
      orientation: options.orientation || 'horizontal', // horizontal, vertical
      responsive: options.responsive !== false,
      breakpoint: options.breakpoint || 768, // Breakpoint for responsive tabs
      onTabChange: options.onTabChange || null,
      persistActiveTab: options.persistActiveTab || false,
      storageKey: options.storageKey || 'orderforecast_active_tab',
      lazy: options.lazy !== false // Lazy load tab content
    };
    
    this.element = null;
    this.tabsElement = null;
    this.contentElement = null;
    this.containerElement = null;
    this.activeTabIndex = null;
    this.eventHandlers = {};
    
    // Initialize the tabs
    this._init();
    
    // Bind methods
    this._handleTabClick = this._handleTabClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleResize = this._handleResize.bind(this);
  }
  
  /**
   * Initialize the tabs
   * @private
   */
  _init() {
    // Get or create container element
    if (this.options.container) {
      if (typeof this.options.container === 'string') {
        this.containerElement = document.querySelector(this.options.container);
      } else if (this.options.container instanceof HTMLElement) {
        this.containerElement = this.options.container;
      }
    }
    
    // Create tabs element if not using an existing one
    if (!document.getElementById(this.options.id)) {
      this._createTabsElement();
    } else {
      this.element = document.getElementById(this.options.id);
      this._setupExistingTabs();
    }
    
    // Set up responsive behavior
    if (this.options.responsive) {
      window.addEventListener('resize', this._handleResize);
      this._handleResize();
    }
    
    // Set active tab
    if (this.options.persistActiveTab) {
      const savedTabIndex = this._getSavedTabIndex();
      if (savedTabIndex !== null) {
        this.setActiveTab(savedTabIndex);
      } else {
        this.setActiveTab(this.options.activeTab);
      }
    } else {
      this.setActiveTab(this.options.activeTab);
    }
  }
  
  /**
   * Create the tabs DOM element
   * @private
   */
  _createTabsElement() {
    // Create tabs container
    this.element = document.createElement('div');
    this.element.id = this.options.id;
    this.element.className = `tabs ${this.options.className}`;
    this.element.setAttribute('role', 'tablist');
    
    // Set orientation
    this.element.classList.add(`tabs-${this.options.orientation}`);
    
    // Create tabs navigation
    this.tabsElement = document.createElement('div');
    this.tabsElement.className = 'tabs-nav';
    
    // Create tabs content
    this.contentElement = document.createElement('div');
    this.contentElement.className = `tabs-content ${this.options.contentClassName}`;
    
    // Create tabs
    this.options.tabs.forEach((tab, index) => {
      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.className = `tab ${this.options.tabClassName}`;
      tabButton.setAttribute('role', 'tab');
      tabButton.setAttribute('aria-selected', 'false');
      tabButton.setAttribute('id', `${this.options.id}-tab-${index}`);
      tabButton.setAttribute('aria-controls', `${this.options.id}-panel-${index}`);
      tabButton.setAttribute('data-tab-index', index);
      
      // Set tab content
      if (typeof tab.label === 'string') {
        tabButton.textContent = tab.label;
      } else if (tab.label instanceof HTMLElement) {
        tabButton.appendChild(tab.label);
      }
      
      // Set disabled state
      if (tab.disabled) {
        tabButton.classList.add(this.options.disabledClassName);
        tabButton.setAttribute('disabled', 'disabled');
        tabButton.setAttribute('aria-disabled', 'true');
      } else {
        tabButton.addEventListener('click', (e) => this._handleTabClick(e, index));
      }
      
      // Add tab to tabs navigation
      this.tabsElement.appendChild(tabButton);
      
      // Create tab panel
      const tabPanel = document.createElement('div');
      tabPanel.className = 'tab-panel';
      tabPanel.setAttribute('role', 'tabpanel');
      tabPanel.setAttribute('id', `${this.options.id}-panel-${index}`);
      tabPanel.setAttribute('aria-labelledby', `${this.options.id}-tab-${index}`);
      tabPanel.setAttribute('hidden', 'hidden');
      
      // Set tab content
      if (typeof tab.content === 'string') {
        tabPanel.innerHTML = tab.content;
      } else if (tab.content instanceof HTMLElement) {
        tabPanel.appendChild(tab.content);
      } else if (typeof tab.content === 'function') {
        // Lazy loading - will be called when tab is activated
        tabPanel.dataset.lazyContent = 'true';
      }
      
      // Add tab panel to content
      this.contentElement.appendChild(tabPanel);
    });
    
    // Add keyboard navigation
    this.tabsElement.addEventListener('keydown', this._handleKeydown);
    
    // Append to container
    this.element.appendChild(this.tabsElement);
    this.element.appendChild(this.contentElement);
    
    if (this.containerElement) {
      this.containerElement.appendChild(this.element);
    } else if (document.body) {
      document.body.appendChild(this.element);
    }
  }
  
  /**
   * Set up existing tabs element
   * @private
   */
  _setupExistingTabs() {
    // Find tabs navigation and content
    this.tabsElement = this.element.querySelector('.tabs-nav');
    this.contentElement = this.element.querySelector('.tabs-content');
    
    if (!this.tabsElement || !this.contentElement) {
      console.error('Invalid tabs element structure');
      return;
    }
    
    // Get tabs
    const tabButtons = this.tabsElement.querySelectorAll('.tab');
    const tabPanels = this.contentElement.querySelectorAll('.tab-panel');
    
    // Set up tab click handlers
    tabButtons.forEach((tabButton, index) => {
      if (!tabButton.hasAttribute('disabled')) {
        tabButton.addEventListener('click', (e) => this._handleTabClick(e, index));
      }
    });
    
    // Add keyboard navigation
    this.tabsElement.addEventListener('keydown', this._handleKeydown);
  }
  
  /**
   * Handle tab click
   * @param {MouseEvent} event - Mouse event
   * @param {number} index - Tab index
   * @private
   */
  _handleTabClick(event, index) {
    event.preventDefault();
    
    // Skip if tab is disabled
    if (this.options.tabs[index]?.disabled) return;
    
    this.setActiveTab(index);
  }
  
  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  _handleKeydown(event) {
    // Skip if no tabs
    if (!this.tabsElement) return;
    
    const tabs = Array.from(this.tabsElement.querySelectorAll('.tab:not([disabled])'));
    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);
    
    // Skip if no tab is focused
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.setActiveTab(parseInt(tabs[currentIndex].getAttribute('data-tab-index'), 10));
        return;
    }
    
    // Focus next tab
    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
    }
  }
  
  /**
   * Handle resize for responsive tabs
   * @private
   */
  _handleResize() {
    if (!this.element || !this.options.responsive) return;
    
    const isMobile = window.innerWidth < this.options.breakpoint;
    
    if (isMobile) {
      this.element.classList.add('tabs-mobile');
    } else {
      this.element.classList.remove('tabs-mobile');
    }
  }
  
  /**
   * Get saved tab index from storage
   * @returns {number|null} - Saved tab index or null
   * @private
   */
  _getSavedTabIndex() {
    if (!this.options.persistActiveTab) return null;
    
    try {
      const savedIndex = localStorage.getItem(this.options.storageKey);
      return savedIndex !== null ? parseInt(savedIndex, 10) : null;
    } catch (error) {
      console.error('Error getting saved tab index:', error);
      return null;
    }
  }
  
  /**
   * Save active tab index to storage
   * @param {number} index - Tab index
   * @private
   */
  _saveTabIndex(index) {
    if (!this.options.persistActiveTab) return;
    
    try {
      localStorage.setItem(this.options.storageKey, index.toString());
    } catch (error) {
      console.error('Error saving tab index:', error);
    }
  }
  
  /**
   * Load lazy content for a tab
   * @param {number} index - Tab index
   * @private
   */
  _loadLazyContent(index) {
    const tab = this.options.tabs[index];
    const panel = this.contentElement.querySelector(`#${this.options.id}-panel-${index}`);
    
    if (!tab || !panel || !panel.dataset.lazyContent) return;
    
    // Call content function to load content
    if (typeof tab.content === 'function') {
      const content = tab.content();
      
      // Clear panel
      panel.innerHTML = '';
      
      // Set content
      if (typeof content === 'string') {
        panel.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        panel.appendChild(content);
      } else if (content instanceof Promise) {
        // Show loading indicator
        panel.innerHTML = '<div class="tabs-loading">Loading...</div>';
        
        // Wait for content to load
        content
          .then(result => {
            // Clear panel
            panel.innerHTML = '';
            
            // Set content
            if (typeof result === 'string') {
              panel.innerHTML = result;
            } else if (result instanceof HTMLElement) {
              panel.appendChild(result);
            }
          })
          .catch(error => {
            console.error('Error loading tab content:', error);
            panel.innerHTML = '<div class="tabs-error">Error loading content</div>';
          });
      }
    }
    
    // Remove lazy content flag
    delete panel.dataset.lazyContent;
  }
  
  /**
   * Set active tab
   * @param {number|string} tabIdentifier - Tab index or ID
   * @returns {Tabs} - The tabs instance for chaining
   */
  setActiveTab(tabIdentifier) {
    // Skip if no tabs
    if (!this.tabsElement || !this.contentElement) return this;
    
    // Convert string ID to index if needed
    let index = tabIdentifier;
    if (typeof tabIdentifier === 'string' && isNaN(parseInt(tabIdentifier, 10))) {
      index = this.options.tabs.findIndex(tab => tab.id === tabIdentifier);
    }
    
    // Convert to number
    index = parseInt(index, 10);
    
    // Skip if invalid index
    if (isNaN(index) || index < 0 || index >= this.options.tabs.length) {
      console.error('Invalid tab index:', tabIdentifier);
      return this;
    }
    
    // Skip if tab is disabled
    if (this.options.tabs[index]?.disabled) {
      console.error('Cannot activate disabled tab:', index);
      return this;
    }
    
    // Skip if already active
    if (this.activeTabIndex === index) return this;
    
    logDebug('Tabs', `Setting active tab: ${index}`);
    
    // Get tab elements
    const tabButtons = this.tabsElement.querySelectorAll('.tab');
    const tabPanels = this.contentElement.querySelectorAll('.tab-panel');
    
    // Deactivate current tab
    if (this.activeTabIndex !== null && this.activeTabIndex >= 0 && this.activeTabIndex < tabButtons.length) {
      tabButtons[this.activeTabIndex].classList.remove(this.options.activeClassName);
      tabButtons[this.activeTabIndex].setAttribute('aria-selected', 'false');
      tabButtons[this.activeTabIndex].setAttribute('tabindex', '-1');
      
      if (this.activeTabIndex < tabPanels.length) {
        tabPanels[this.activeTabIndex].setAttribute('hidden', 'hidden');
      }
    }
    
    // Activate new tab
    if (index >= 0 && index < tabButtons.length) {
      tabButtons[index].classList.add(this.options.activeClassName);
      tabButtons[index].setAttribute('aria-selected', 'true');
      tabButtons[index].setAttribute('tabindex', '0');
      
      if (index < tabPanels.length) {
        tabPanels[index].removeAttribute('hidden');
        
        // Load lazy content if needed
        if (this.options.lazy) {
          this._loadLazyContent(index);
        }
      }
    }
    
    // Update active tab index
    this.activeTabIndex = index;
    
    // Save active tab index
    this._saveTabIndex(index);
    
    // Call onTabChange callback
    if (typeof this.options.onTabChange === 'function') {
      this.options.onTabChange(index, this.options.tabs[index], this);
    }
    
    // Trigger tab change event
    this._triggerEvent('tabChange', {
      index,
      tab: this.options.tabs[index]
    });
    
    return this;
  }
  
  /**
   * Get active tab index
   * @returns {number} - Active tab index
   */
  getActiveTabIndex() {
    return this.activeTabIndex;
  }
  
  /**
   * Get active tab
   * @returns {Object} - Active tab
   */
  getActiveTab() {
    if (this.activeTabIndex === null || this.activeTabIndex < 0 || this.activeTabIndex >= this.options.tabs.length) {
      return null;
    }
    
    return this.options.tabs[this.activeTabIndex];
  }
  
  /**
   * Set tabs
   * @param {Array} tabs - Array of tab items
   * @returns {Tabs} - The tabs instance for chaining
   */
  setTabs(tabs) {
    // Skip if no tabs element
    if (!this.tabsElement || !this.contentElement) return this;
    
    // Store new tabs
    this.options.tabs = tabs;
    
    // Clear tabs navigation and content
    this.tabsElement.innerHTML = '';
    this.contentElement.innerHTML = '';
    
    // Create tabs
    tabs.forEach((tab, index) => {
      // Create tab button
      const tabButton = document.createElement('button');
      tabButton.className = `tab ${this.options.tabClassName}`;
      tabButton.setAttribute('role', 'tab');
      tabButton.setAttribute('aria-selected', 'false');
      tabButton.setAttribute('id', `${this.options.id}-tab-${index}`);
      tabButton.setAttribute('aria-controls', `${this.options.id}-panel-${index}`);
      tabButton.setAttribute('data-tab-index', index);
      
      // Set tab content
      if (typeof tab.label === 'string') {
        tabButton.textContent = tab.label;
      } else if (tab.label instanceof HTMLElement) {
        tabButton.appendChild(tab.label);
      }
      
      // Set disabled state
      if (tab.disabled) {
        tabButton.classList.add(this.options.disabledClassName);
        tabButton.setAttribute('disabled', 'disabled');
        tabButton.setAttribute('aria-disabled', 'true');
      } else {
        tabButton.addEventListener('click', (e) => this._handleTabClick(e, index));
      }
      
      // Add tab to tabs navigation
      this.tabsElement.appendChild(tabButton);
      
      // Create tab panel
      const tabPanel = document.createElement('div');
      tabPanel.className = 'tab-panel';
      tabPanel.setAttribute('role', 'tabpanel');
      tabPanel.setAttribute('id', `${this.options.id}-panel-${index}`);
      tabPanel.setAttribute('aria-labelledby', `${this.options.id}-tab-${index}`);
      tabPanel.setAttribute('hidden', 'hidden');
      
      // Set tab content
      if (typeof tab.content === 'string') {
        tabPanel.innerHTML = tab.content;
      } else if (tab.content instanceof HTMLElement) {
        tabPanel.appendChild(tab.content);
      } else if (typeof tab.content === 'function') {
        // Lazy loading - will be called when tab is activated
        tabPanel.dataset.lazyContent = 'true';
      }
      
      // Add tab panel to content
      this.contentElement.appendChild(tabPanel);
    });
    
    // Set active tab
    const savedTabIndex = this._getSavedTabIndex();
    if (savedTabIndex !== null && savedTabIndex < tabs.length) {
      this.setActiveTab(savedTabIndex);
    } else {
      this.setActiveTab(0);
    }
    
    return this;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Tabs} - The tabs instance for chaining
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
   * @returns {Tabs} - The tabs instance for chaining
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
   * Destroy the tabs
   */
  destroy() {
    // Remove event listeners
    if (this.tabsElement) {
      this.tabsElement.removeEventListener('keydown', this._handleKeydown);
      
      const tabButtons = this.tabsElement.querySelectorAll('.tab');
      tabButtons.forEach((tabButton, index) => {
        tabButton.removeEventListener('click', (e) => this._handleTabClick(e, index));
      });
    }
    
    if (this.options.responsive) {
      window.removeEventListener('resize', this._handleResize);
    }
    
    // Remove elements
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clear references
    this.element = null;
    this.tabsElement = null;
    this.contentElement = null;
    this.activeTabIndex = null;
    this.eventHandlers = {};
  }
}

export default Tabs;

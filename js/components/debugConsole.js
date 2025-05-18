/**
 * Debug Console Component
 * Provides a UI for viewing debug information and troubleshooting the application
 */

import debugTool from '../utils/debugTool.js';
import { logDebug } from '../utils/logger.js';

class DebugConsole {
  constructor() {
    this.isVisible = false;
    this.activeTab = 'all';
    this.container = null;
    this.tabs = ['all', 'api', 'auth', 'data', 'charts', 'errors'];
  }

  /**
   * Initialize the debug console
   */
  init() {
    try {
      // Create console container if it doesn't exist
      if (!this.container) {
        this.createConsoleUI();
      }
      
      // Register keyboard shortcut (Ctrl+Shift+D)
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          this.toggleVisibility();
          e.preventDefault();
        }
      });
      
      // Register message listener
      window.addEventListener('debug-message', (e) => {
        this.addEntry(e.detail);
        this.updateContent();
      });
      
      logDebug('Debug console initialized');
    } catch (error) {
      console.error('Failed to initialize debug console:', error);
    }
  }

  /**
   * Create the console UI elements
   */
  createConsoleUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'debug-console';
    this.container.style.display = 'none';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'debug-console-header';
    
    const title = document.createElement('h3');
    title.textContent = 'SaleOrderForecast Debug Console';
    
    const actions = document.createElement('div');
    actions.className = 'debug-console-actions';
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      debugTool.clear();
      this.updateContent();
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      this.toggleVisibility(false);
    });
    
    actions.appendChild(clearBtn);
    actions.appendChild(closeBtn);
    
    header.appendChild(title);
    header.appendChild(actions);
    
    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'debug-console-tabs';
    
    this.tabs.forEach(tabName => {
      const tab = document.createElement('button');
      tab.className = 'debug-console-tab';
      tab.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
      tab.dataset.tab = tabName;
      
      if (tabName === this.activeTab) {
        tab.classList.add('active');
      }
      
      tab.addEventListener('click', () => {
        this.setActiveTab(tabName);
      });
      
      tabs.appendChild(tab);
    });
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'debug-console-content';
    
    // Assemble the console
    this.container.appendChild(header);
    this.container.appendChild(tabs);
    this.container.appendChild(content);
    
    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Toggle console visibility
   * @param {boolean} [visible] - Force visibility state
   */
  toggleVisibility(visible) {
    this.isVisible = visible !== undefined ? visible : !this.isVisible;
    
    if (this.container) {
      this.container.style.display = this.isVisible ? 'flex' : 'none';
      
      if (this.isVisible) {
        this.updateContent();
      }
    }
    
    logDebug(`Debug console ${this.isVisible ? 'shown' : 'hidden'}`);
  }

  /**
   * Set the active tab
   * @param {string} tabName - Tab name to activate
   */
  setActiveTab(tabName) {
    if (this.tabs.includes(tabName)) {
      this.activeTab = tabName;
      
      // Update tab UI
      const tabButtons = this.container.querySelectorAll('.debug-console-tab');
      tabButtons.forEach(tab => {
        if (tab.dataset.tab === tabName) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Update content
      this.updateContent();
    }
  }

  /**
   * Add a debug entry to the console
   * @param {Object} entry - Debug entry
   */
  addEntry(entry) {
    debugTool.log(entry.category || 'general', entry.message, entry.data);
  }

  /**
   * Update the console content based on active tab
   */
  updateContent() {
    if (!this.isVisible || !this.container) return;
    
    const contentArea = this.container.querySelector('.debug-console-content');
    if (!contentArea) return;
    
    // Clear current content
    contentArea.innerHTML = '';
    
    // Get debug info
    const debugInfo = debugTool.getInfo();
    
    // Filter entries based on active tab
    let entries = debugInfo.entries;
    if (this.activeTab !== 'all') {
      entries = entries.filter(entry => entry.category === this.activeTab);
    }
    
    // Display entries or empty state
    if (entries.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'debug-console-empty';
      emptyState.textContent = 'No debug information available for this category';
      contentArea.appendChild(emptyState);
    } else {
      // Sort entries by timestamp (newest first)
      entries.sort((a, b) => b.timestamp - a.timestamp);
      
      // Create entry elements
      entries.forEach(entry => {
        const entryElement = this.createEntryElement(entry);
        contentArea.appendChild(entryElement);
      });
    }
  }

  /**
   * Create an element for a debug entry
   * @param {Object} entry - Debug entry
   * @returns {HTMLElement} Entry element
   */
  createEntryElement(entry) {
    const entryElement = document.createElement('div');
    entryElement.className = 'debug-console-entry';
    
    // Entry header
    const header = document.createElement('div');
    header.className = 'debug-console-entry-header';
    
    // Entry message
    const message = document.createElement('div');
    message.className = 'debug-console-entry-message';
    message.textContent = entry.message || 'No message';
    
    // Entry timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'debug-console-entry-timestamp';
    timestamp.textContent = new Date(entry.timestamp).toLocaleTimeString();
    
    header.appendChild(message);
    header.appendChild(timestamp);
    
    // Entry data
    if (entry.data) {
      const dataElement = document.createElement('pre');
      dataElement.className = 'debug-console-entry-data';
      
      try {
        if (typeof entry.data === 'object') {
          dataElement.textContent = JSON.stringify(entry.data, null, 2);
        } else {
          dataElement.textContent = String(entry.data);
        }
      } catch (error) {
        dataElement.textContent = 'Error displaying data: ' + error.message;
      }
      
      entryElement.appendChild(header);
      entryElement.appendChild(dataElement);
    } else {
      entryElement.appendChild(header);
    }
    
    return entryElement;
  }
}

// Create and export a singleton instance
const debugConsole = new DebugConsole();
export default debugConsole;

/**
 * Dashboard Customization Component
 * Allows users to customize dashboard layout and appearance
 */

import { getState, updateState, addStateListener, removeStateListener } from '../core/state.js';
import { logDebug } from '../utils/logger.js';

class DashboardCustomization {
  constructor() {
    this.initialized = false;
    this.currentTheme = 'light';
    this.currentLayout = 'default';
    this.stateListener = null;
  }

  /**
   * Initialize the dashboard customization component
   */
  init() {
    if (this.initialized) return;
    
    logDebug('Initializing dashboard customization');
    
    // Load saved preferences
    this.loadSavedPreferences();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Add state listener
    this.stateListener = this.handleStateChange.bind(this);
    addStateListener(this.stateListener);
    
    this.initialized = true;
  }

  /**
   * Load saved user preferences
   */
  loadSavedPreferences() {
    try {
      const savedPreferences = localStorage.getItem('orderforecast_dashboard_preferences');
      
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        
        // Apply theme
        if (preferences.theme) {
          this.applyTheme(preferences.theme);
        }
        
        // Apply layout
        if (preferences.layout) {
          this.applyLayout(preferences.layout);
        }
        
        logDebug('Loaded dashboard preferences', preferences);
      }
    } catch (error) {
      logDebug('Error loading dashboard preferences', error);
    }
  }

  /**
   * Set up event listeners for customization controls
   */
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.savePreferences();
      });
    }
    
    // Layout options
    const layoutOptions = document.querySelectorAll('[data-layout-option]');
    layoutOptions.forEach(option => {
      option.addEventListener('click', () => {
        const layout = option.getAttribute('data-layout-option');
        this.applyLayout(layout);
        this.savePreferences();
      });
    });
  }

  /**
   * Apply theme to the dashboard
   * @param {string} theme - Theme to apply ('light' or 'dark')
   */
  applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    this.currentTheme = theme;
    
    // Update theme toggle if it exists
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'light' 
        ? '<i data-feather="moon"></i>' 
        : '<i data-feather="sun"></i>';
      
      // Update feather icons
      if (window.feather) {
        window.feather.replace();
      }
    }
    
    logDebug(`Applied theme: ${theme}`);
  }

  /**
   * Apply layout to the dashboard
   * @param {string} layout - Layout to apply ('default', 'compact', 'expanded')
   */
  applyLayout(layout) {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.classList.remove('layout-default', 'layout-compact', 'layout-expanded');
      dashboard.classList.add(`layout-${layout}`);
      this.currentLayout = layout;
      
      // Update active layout option
      const layoutOptions = document.querySelectorAll('[data-layout-option]');
      layoutOptions.forEach(option => {
        const optionLayout = option.getAttribute('data-layout-option');
        option.classList.toggle('active', optionLayout === layout);
      });
      
      logDebug(`Applied layout: ${layout}`);
    }
  }

  /**
   * Save current preferences to localStorage
   */
  savePreferences() {
    try {
      const preferences = {
        theme: this.currentTheme,
        layout: this.currentLayout
      };
      
      localStorage.setItem('orderforecast_dashboard_preferences', JSON.stringify(preferences));
      logDebug('Saved dashboard preferences', preferences);
    } catch (error) {
      logDebug('Error saving dashboard preferences', error);
    }
  }

  /**
   * Handle state changes
   * @param {Object} newState - New application state
   */
  handleStateChange(newState) {
    // Update UI based on state changes if needed
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this.stateListener) {
      removeStateListener(this.stateListener);
    }
  }
}

// Create and export singleton instance
const dashboardCustomization = new DashboardCustomization();
export default dashboardCustomization;

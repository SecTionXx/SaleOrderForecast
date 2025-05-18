/**
 * UI Initialization Module
 * Handles the setup and coordination of UI components
 */

import { appState } from '../state/appState.js';
import { logDebug, logInfo } from '../utils/logger.js';
import { createElement, toggleClass } from '../utils/domUtils.js';

// Import UI components
import { initializeHeader } from '../components/header.js';
import { initializeSidebar } from '../components/sidebar.js';
import { initializeMainContent } from '../components/mainContent.js';
import { initializeModals } from '../components/modals.js';
import { initializeToasts } from '../components/toasts.js';

// Track UI state
const uiState = {
  isDarkMode: false,
  isSidebarCollapsed: false,
  isLoading: false
};

/**
 * Initialize all UI components
 */
export function initializeUI() {
  logInfo('Initializing UI components...');
  
  try {
    // Apply saved theme preferences
    applyThemePreferences();
    
    // Initialize core UI components
    initializeHeader();
    initializeSidebar();
    initializeMainContent();
    initializeModals();
    initializeToasts();
    
    // Setup global event listeners
    setupGlobalEventListeners();
    
    // Subscribe to app state changes
    setupStateSubscriptions();
    
    logInfo('UI components initialized');
  } catch (error) {
    logError('Failed to initialize UI', error);
    throw error;
  }
}

/**
 * Apply saved theme preferences
 */
function applyThemePreferences() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}

/**
 * Set the application theme
 * @param {'light'|'dark'|'system'} theme - Theme to apply
 */
export function setTheme(theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark' || 
                 (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Update class on root element
  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  
  // Update UI state
  uiState.isDarkMode = isDark;
  
  // Save preference
  localStorage.setItem('theme', theme);
  
  // Dispatch theme change event
  document.dispatchEvent(new CustomEvent('theme:change', { 
    detail: { theme, isDarkMode: isDark } 
  }));
}

/**
 * Toggle sidebar collapsed state
 * @param {boolean} [collapsed] - Force collapsed state (optional)
 */
export function toggleSidebar(collapsed) {
  const newState = collapsed !== undefined ? collapsed : !uiState.isSidebarCollapsed;
  
  if (newState !== uiState.isSidebarCollapsed) {
    uiState.isSidebarCollapsed = newState;
    
    // Update UI
    const root = document.documentElement;
    root.style.setProperty('--sidebar-width', newState ? '64px' : '250px');
    
    // Toggle class on body
    document.body.classList.toggle('sidebar-collapsed', newState);
    
    // Save preference
    localStorage.setItem('sidebarCollapsed', newState);
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('sidebar:toggle', { 
      detail: { collapsed: newState } 
    }));
  }
}

/**
 * Show loading indicator
 * @param {boolean} show - Whether to show or hide the loader
 * @param {string} [message] - Optional loading message
 */
export function showLoading(show, message = 'Loading...') {
  uiState.isLoading = show;
  
  let loader = document.getElementById('app-loader');
  
  if (show) {
    if (!loader) {
      // Create loader if it doesn't exist
      loader = createElement('div', {
        id: 'app-loader',
        class: 'app-loader',
        'aria-live': 'polite',
        'aria-busy': 'true'
      });
      
      const spinner = createElement('div', { class: 'spinner' });
      const messageEl = createElement('div', { class: 'loading-message' }, message);
      
      loader.appendChild(spinner);
      loader.appendChild(messageEl);
      document.body.appendChild(loader);
      
      // Add class to body
      document.body.classList.add('app-loading');
    } else if (message) {
      // Update message if provided
      const messageEl = loader.querySelector('.loading-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
  } else if (loader) {
    // Remove loader
    loader.remove();
    document.body.classList.remove('app-loading');
  }
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
  // Handle theme toggle
  document.addEventListener('click', (e) => {
    const themeToggle = e.target.closest('[data-theme-toggle]');
    if (themeToggle) {
      e.preventDefault();
      const theme = themeToggle.dataset.themeToggle;
      if (theme) {
        setTheme(theme);
      } else {
        // Toggle between light/dark
        setTheme(uiState.isDarkMode ? 'light' : 'dark');
      }
    }
    
    // Handle sidebar toggle
    if (e.target.closest('[data-sidebar-toggle]')) {
      e.preventDefault();
      toggleSidebar();
    }
  });
  
  // Handle system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'system') {
      setTheme('system');
    }
  });
}

/**
 * Setup subscriptions to app state changes
 */
function setupStateSubscriptions() {
  // Subscribe to loading state changes
  appState.subscribe((state, prevState) => {
    if (state.isLoading !== prevState.isLoading) {
      showLoading(state.isLoading, state.loadingMessage);
    }
  }, ['isLoading', 'loadingMessage']);
  
  // Subscribe to authentication state changes
  appState.subscribe((state, prevState) => {
    if (state.isAuthenticated !== prevState.isAuthenticated) {
      document.body.classList.toggle('authenticated', state.isAuthenticated);
      
      if (state.isAuthenticated) {
        logDebug('User authenticated, updating UI');
      } else {
        logDebug('User logged out, updating UI');
      }
    }
  }, ['isAuthenticated']);
}

// Export UI state and methods
export const ui = {
  get isDarkMode() { return uiState.isDarkMode; },
  get isLoading() { return uiState.isLoading; },
  get isSidebarCollapsed() { return uiState.isSidebarCollapsed; },
  setTheme,
  toggleSidebar,
  showLoading
};

// For debugging
if (typeof window !== 'undefined') {
  window.ui = ui;
}

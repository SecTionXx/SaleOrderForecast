import { CONFIG } from '../config.js';
import { debounce } from '../utils/domUtils.js';

/**
 * Application State Management
 * Centralized state management with persistence and change notifications
 */
class AppState {
  constructor(initialState = {}) {
    this.state = {
      // Authentication state
      isAuthenticated: false,
      user: null,
      permissions: [],
      
      // Data state
      allDealsData: [],
      filteredData: [],
      
      // UI state
      isLoading: false,
      currentPage: 1,
      itemsPerPage: CONFIG.TABLE.DEFAULT_ITEMS_PER_PAGE,
      sortColumn: CONFIG.TABLE.DEFAULT_SORT_COLUMN,
      sortDirection: CONFIG.TABLE.DEFAULT_SORT_DIRECTION,
      
      // Filters
      filters: {
        searchTerm: '',
        salesRep: '',
        dealStage: '',
        minAmount: '',
        maxAmount: '',
        startDate: '',
        endDate: ''
      },
      
      // Merge with any provided initial state
      ...initialState
    };
    
    // Subscribers for state changes
    this.subscribers = new Set();
    
    // Load persisted state from localStorage
    this.loadPersistedState();
    
    // Auto-save state to localStorage on changes
    this.persistState = debounce(() => this.savePersistedState(), 300);
  }
  
  /**
   * Get the current state or a specific part of it
   * @param {string} [path] - Dot notation path to a nested property
   * @returns {any} The current state or the value at the specified path
   */
  getState(path) {
    if (!path) return this.state;
    
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : undefined;
    }, this.state);
  }
  
  /**
   * Update the state with new values
   * @param {Object} updates - Object with state updates
   * @param {boolean} [silent] - If true, don't notify subscribers
   */
  setState(updates, silent = false) {
    const prevState = { ...this.state };
    
    // Deep merge updates into state
    const deepMerge = (target, source) => {
      Object.keys(source).forEach(key => {
        if (source[key] !== null && 
            typeof source[key] === 'object' && 
            !Array.isArray(source[key]) &&
            target[key] && 
            typeof target[key] === 'object') {
          // Recursively merge objects
          deepMerge(target[key], source[key]);
        } else {
          // Set the new value
          target[key] = source[key];
        }
      });
      return target;
    };
    
    // Apply updates
    this.state = deepMerge({ ...this.state }, updates);
    
    // Persist state changes
    this.persistState();
    
    // Notify subscribers if not silent
    if (!silent) {
      this.notifySubscribers(prevState);
    }
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call when state changes
   * @param {string|Array<string>} [paths] - Optional paths to subscribe to
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, paths) {
    const subscriber = {
      callback,
      paths: Array.isArray(paths) ? paths : paths ? [paths] : null
    };
    
    this.subscribers.add(subscriber);
    
    // Return unsubscribe function
    return () => this.subscribers.delete(subscriber);
  }
  
  /**
   * Notify subscribers of state changes
   * @private
   */
  notifySubscribers(prevState) {
    const currentState = this.state;
    
    // Helper to check if paths have changed
    const hasChanges = (paths) => {
      return paths.some(path => {
        const getNestedValue = (obj, path) => {
          return path.split('.').reduce((o, k) => o && o[k], obj);
        };
        
        const prevValue = getNestedValue(prevState, path);
        const currentValue = getNestedValue(currentState, path);
        
        return JSON.stringify(prevValue) !== JSON.stringify(currentValue);
      });
    };
    
    // Notify each subscriber
    this.subscribers.forEach(subscriber => {
      // If no specific paths, or if any of the watched paths changed
      if (!subscriber.paths || hasChanges(subscriber.paths)) {
        try {
          subscriber.callback(currentState, prevState);
        } catch (error) {
          console.error('Error in state subscriber:', error);
        }
      }
    });
  }
  
  /**
   * Load state from localStorage
   * @private
   */
  loadPersistedState() {
    try {
      const persisted = localStorage.getItem(CONFIG.STORAGE_KEYS.APP_STATE);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        
        // Merge with current state, preserving any defaults
        this.state = {
          ...this.state,
          ...parsed,
          // Don't persist loading states
          isLoading: this.state.isLoading
        };
        
        console.debug('Loaded persisted state:', this.state);
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
      // Clear corrupted state
      this.clearPersistedState();
    }
  }
  
  /**
   * Save state to localStorage
   * @private
   */
  savePersistedState() {
    try {
      // Don't persist everything, only what's needed
      const stateToPersist = {
        // UI state
        currentPage: this.state.currentPage,
        itemsPerPage: this.state.itemsPerPage,
        sortColumn: this.state.sortColumn,
        sortDirection: this.state.sortDirection,
        
        // Filters
        filters: this.state.filters,
        
        // User preferences could go here
      };
      
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.APP_STATE, 
        JSON.stringify(stateToPersist)
      );
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }
  
  /**
   * Clear persisted state
   */
  clearPersistedState() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.APP_STATE);
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  }
  
  /**
   * Reset state to initial values
   * @param {boolean} [keepAuth] - If true, keep authentication state
   */
  reset(keepAuth = false) {
    const authState = keepAuth ? {
      isAuthenticated: this.state.isAuthenticated,
      user: this.state.user,
      permissions: this.state.permissions
    } : {};
    
    this.setState({
      ...new AppState().getState(),
      ...authState
    });
  }
}

// Create and export a singleton instance
export const appState = new AppState();

// For debugging
if (typeof window !== 'undefined') {
  window.appState = appState;
}

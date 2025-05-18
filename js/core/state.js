/**
 * state.js - Application State Management
 * Centralizes state handling for the application
 */

// Application state
const state = {
  allDealsData: [],
  filteredData: [],
  currentPage: 1,
  itemsPerPage: 10,
  sortColumn: 'lastUpdated',
  sortDirection: 'desc',
  currentSort: { key: null, direction: "asc" },
  isLoading: false,
  lastRefreshTime: null
};

// State change listeners
const listeners = [];

/**
 * Update state with new values
 * @param {Object} newState - New state values to merge
 */
function updateState(newState) {
  // Merge new state with current state
  Object.assign(state, newState);
  
  // Notify listeners
  notifyListeners();
}

/**
 * Get current state
 * @returns {Object} - Current state
 */
function getState() {
  return { ...state };
}

/**
 * Add state change listener
 * @param {Function} listener - Function to call when state changes
 */
function addStateListener(listener) {
  if (typeof listener === 'function' && !listeners.includes(listener)) {
    listeners.push(listener);
  }
}

/**
 * Remove state change listener
 * @param {Function} listener - Listener to remove
 */
function removeStateListener(listener) {
  const index = listeners.indexOf(listener);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener(getState());
    } catch (error) {
      console.error('Error in state listener:', error);
    }
  });
}

/**
 * Reset state to initial values
 */
function resetState() {
  updateState({
    allDealsData: [],
    filteredData: [],
    currentPage: 1,
    itemsPerPage: 10,
    sortColumn: 'lastUpdated',
    sortDirection: 'desc',
    currentSort: { key: null, direction: "asc" },
    isLoading: false
  });
}

/**
 * Set loading state
 * @param {boolean} isLoading - Whether the app is loading
 */
function setLoading(isLoading) {
  updateState({ isLoading });
}

/**
 * Update filtered data
 * @param {Array} filteredData - New filtered data
 */
function setFilteredData(filteredData) {
  updateState({ filteredData });
}

/**
 * Update all deals data
 * @param {Array} allDealsData - New all deals data
 */
function setAllDealsData(allDealsData) {
  updateState({ allDealsData });
}

/**
 * Update sort settings
 * @param {string} column - Column to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 */
function updateSort(column, direction) {
  updateState({
    sortColumn: column,
    sortDirection: direction,
    currentSort: { key: column, direction }
  });
}

/**
 * Update pagination settings
 * @param {number} page - Current page
 */
function updatePagination(page) {
  updateState({ currentPage: page });
}

/**
 * Reset pagination to first page
 */
function resetPagination() {
  updateState({ currentPage: 1 });
}

/**
 * Update last refresh time
 */
function updateLastRefreshTime() {
  updateState({ lastRefreshTime: new Date() });
}

// Export functions
export {
  getState,
  updateState,
  addStateListener,
  removeStateListener,
  resetState,
  setLoading,
  setFilteredData,
  setAllDealsData,
  updateSort,
  updatePagination,
  resetPagination,
  updateLastRefreshTime
};

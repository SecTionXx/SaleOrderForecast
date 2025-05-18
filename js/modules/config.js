// Configuration constants and settings

export const CONFIG = {
  // Table settings
  TABLE: {
    DEFAULT_ITEMS_PER_PAGE: 10,
    DEFAULT_SORT_COLUMN: 'lastUpdated',
    DEFAULT_SORT_DIRECTION: 'desc',
    ROWS_PER_PAGE: 10,
  },
  
  // Chart settings
  CHART: {
    COLOR_SCHEME: {
      'Proposal Sent': 'rgba(59, 130, 246, 0.8)',
      'Negotiation': 'rgba(245, 158, 11, 0.8)',
      'Needs Analysis': 'rgba(16, 185, 129, 0.8)',
      'Proposal/Price Quote': 'rgba(139, 92, 246, 0.8)',
      'Closed Won': 'rgba(16, 185, 129, 0.8)',
      'Closed Lost': 'rgba(239, 68, 68, 0.8)',
      'Qualification': 'rgba(59, 130, 246, 0.8)',
      'Decision Maker Bought-In': 'rgba(245, 158, 11, 0.8)',
      'Contract Sent': 'rgba(16, 185, 129, 0.8)',
      'Perception Analysis': 'rgba(139, 92, 246, 0.8)',
      'Value Proposition': 'rgba(16, 185, 129, 0.8)',
      'Id. Decision Makers': 'rgba(239, 68, 68, 0.8)'
    }
  },
  
  // API settings
  API: {
    BASE_URL: '/api',
    ENDPOINTS: {
      AUTH: '/auth',
      DEALS: '/deals',
      USERS: '/users'
    },
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    TIMEOUT: 30000 // 30 seconds
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    FILTERS: 'deal_filters',
    PREFERENCES: 'user_preferences'
  },
  
  // UI settings
  UI: {
    LOADING_DELAY: 300, // ms
    TOAST_DURATION: 5000, // ms
    ANIMATION_DURATION: 300 // ms
  }
};

// Export as default for backward compatibility
export default CONFIG;

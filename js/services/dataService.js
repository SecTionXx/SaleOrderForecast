/**
 * dataService.js - Enhanced Data Service
 * Provides centralized data fetching with advanced caching strategies,
 * data transformation, and error handling
 */

import apiService from './apiService.js';
import { getSheetDataEndpoint, getCachedDataEndpoint } from './apiEndpoints.js';
import { logDebug, logError, logInfo } from '../utils/logger.js';

// Cache configuration
const CACHE_CONFIG = {
  // Main data cache
  MAIN_DATA: {
    KEY: 'orderforecast_data_cache',
    EXPIRY: 5 * 60 * 1000, // 5 minutes
    VERSION: 'v1'
  },
  // Metadata cache (e.g., deal stages, sales reps)
  METADATA: {
    KEY: 'orderforecast_metadata_cache',
    EXPIRY: 30 * 60 * 1000, // 30 minutes
    VERSION: 'v1'
  },
  // User preferences cache
  PREFERENCES: {
    KEY: 'orderforecast_preferences_cache',
    EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    VERSION: 'v1'
  }
};

/**
 * Fetch data with advanced caching strategy
 * @param {Object} options - Options for data fetching
 * @param {boolean} options.forceFresh - Force fresh data fetch
 * @param {string} options.cacheType - Type of cache to use (MAIN_DATA, METADATA, PREFERENCES)
 * @param {string} options.endpoint - API endpoint to fetch data from
 * @param {Object} options.params - Query parameters for the API request
 * @param {Function} options.transform - Function to transform the data before caching
 * @param {boolean} options.bypassCache - Bypass cache for this request only
 * @returns {Promise<Object>} - The fetched data
 */
async function fetchDataWithCaching(options = {}) {
  const {
    forceFresh = false,
    cacheType = 'MAIN_DATA',
    endpoint = getSheetDataEndpoint(),
    params = {},
    transform = data => data,
    bypassCache = false
  } = options;
  
  const cacheConfig = CACHE_CONFIG[cacheType] || CACHE_CONFIG.MAIN_DATA;
  const cacheKey = `${cacheConfig.KEY}_${cacheConfig.VERSION}`;
  
  // Check cache first if not forcing fresh data and not bypassing cache
  if (!forceFresh && !bypassCache) {
    const cachedData = getCachedData(cacheKey, cacheConfig.EXPIRY);
    if (cachedData) {
      logDebug(`Using cached data for ${cacheType}`);
      return cachedData;
    }
  }
  
  // Fetch fresh data
  logDebug(`Fetching fresh data for ${cacheType} from ${endpoint}`);
  try {
    // Add cache busting parameter for forced fresh data
    const requestParams = forceFresh ? { ...params, _t: Date.now() } : params;
    
    // Fetch data from server
    const data = await fetchDataFromServer(endpoint, requestParams);
    
    // Transform data if needed
    const transformedData = transform(data);
    
    // Cache the transformed data
    if (!bypassCache) {
      cacheData(cacheKey, transformedData);
    }
    
    return transformedData;
  } catch (error) {
    logError(`Error fetching data for ${cacheType}:`, error);
    
    // If forcing fresh data failed, try to use cache as fallback
    if (forceFresh && !bypassCache) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        logDebug(`Fresh fetch failed for ${cacheType}, using cached data as fallback`);
        return cachedData;
      }
    }
    
    // If no cached data available, throw the error
    throw error;
  }
}

/**
 * Fetch data from the server
 * @param {string} endpoint - API endpoint to fetch data from
 * @param {Object} params - Query parameters for the API request
 * @returns {Promise<Object>} - The fetched data
 */
async function fetchDataFromServer(endpoint, params = {}) {
  try {
    return await apiService.get(endpoint, { params });
  } catch (error) {
    // Enhanced error handling
    const status = error.status || 'Unknown';
    const message = error.message || 'Unknown error';
    
    // Throw a more descriptive error
    throw new Error(`Failed to fetch data (${status}): ${message}`);
  }
}

/**
 * Get cached data if available and not expired
 * @param {string} cacheKey - The cache key
 * @param {number} expiryTime - Cache expiry time in milliseconds
 * @returns {Object|null} - The cached data or null if not available
 */
function getCachedData(cacheKey, expiryTime = null) {
  try {
    const cacheJson = localStorage.getItem(cacheKey);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    
    // Check if cache has version and it matches current version
    if (!cache.version || cache.version !== CACHE_CONFIG.MAIN_DATA.VERSION) {
      logDebug('Cache version mismatch, invalidating');
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Check if cache is expired (if expiryTime is provided)
    if (expiryTime !== null) {
      const now = Date.now();
      if (now - cache.timestamp > expiryTime) {
        logDebug('Cache expired');
        return null;
      }
    }
    
    return cache.data;
  } catch (error) {
    logError('Error retrieving cached data:', error);
    return null;
  }
}

/**
 * Cache the fetched data
 * @param {string} cacheKey - The cache key
 * @param {Object} data - The data to cache
 */
function cacheData(cacheKey, data) {
  try {
    const cache = {
      timestamp: Date.now(),
      version: CACHE_CONFIG.MAIN_DATA.VERSION,
      data: data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cache));
    logDebug(`Data cached successfully with key ${cacheKey}`);
  } catch (error) {
    logError('Error caching data:', error);
    
    // If caching fails (e.g., quota exceeded), try to clear some space
    try {
      // Remove this specific cache first
      localStorage.removeItem(cacheKey);
      
      // If still failing, clear all caches
      if (error.name === 'QuotaExceededError') {
        clearAllCaches();
      }
    } catch (e) {
      // Ignore any errors from removing
    }
  }
}

/**
 * Clear a specific cache
 * @param {string} cacheType - Type of cache to clear (MAIN_DATA, METADATA, PREFERENCES)
 */
function clearCache(cacheType = 'MAIN_DATA') {
  try {
    const cacheConfig = CACHE_CONFIG[cacheType] || CACHE_CONFIG.MAIN_DATA;
    const cacheKey = `${cacheConfig.KEY}_${cacheConfig.VERSION}`;
    
    localStorage.removeItem(cacheKey);
    logDebug(`Cache cleared for ${cacheType}`);
  } catch (error) {
    logError(`Error clearing cache for ${cacheType}:`, error);
  }
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  try {
    Object.keys(CACHE_CONFIG).forEach(cacheType => {
      clearCache(cacheType);
    });
    logInfo('All caches cleared');
  } catch (error) {
    logError('Error clearing all caches:', error);
  }
}

/**
 * Get the timestamp of the last data fetch
 * @param {string} cacheType - Type of cache to check (MAIN_DATA, METADATA, PREFERENCES)
 * @returns {number|null} - Timestamp of the last fetch or null if not available
 */
function getLastFetchTimestamp(cacheType = 'MAIN_DATA') {
  try {
    const cacheConfig = CACHE_CONFIG[cacheType] || CACHE_CONFIG.MAIN_DATA;
    const cacheKey = `${cacheConfig.KEY}_${cacheConfig.VERSION}`;
    
    const cacheJson = localStorage.getItem(cacheKey);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    return cache.timestamp;
  } catch (error) {
    logError('Error retrieving last fetch timestamp:', error);
    return null;
  }
}

/**
 * Format relative time for last update display
 * @param {number} timestamp - Timestamp to format
 * @returns {string} - Formatted relative time
 */
function formatLastUpdateTime(timestamp) {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than a minute
  if (diff < 60 * 1000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // More than a day
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Fetch and process the main dashboard data
 * @param {boolean} forceFresh - Force fresh data fetch
 * @returns {Promise<Object>} - The processed dashboard data
 */
async function fetchDashboardData(forceFresh = false) {
  return fetchDataWithCaching({
    forceFresh,
    cacheType: 'MAIN_DATA',
    endpoint: getSheetDataEndpoint(),
    transform: (data) => {
      // Process and enhance the data
      return processDashboardData(data);
    }
  });
}

/**
 * Process and enhance dashboard data
 * @param {Array} data - Raw data from the API
 * @returns {Object} - Processed data with additional properties
 */
function processDashboardData(data) {
  if (!Array.isArray(data)) {
    logError('Invalid dashboard data format:', data);
    return { deals: [], metadata: {} };
  }
  
  try {
    // Extract unique values for filters
    const salesReps = [...new Set(data.map(item => item.salesRep).filter(Boolean))];
    const dealStages = [...new Set(data.map(item => item.dealStage).filter(Boolean))];
    const customers = [...new Set(data.map(item => item.customer).filter(Boolean))];
    
    // Calculate summary metrics
    const totalValue = data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    const weightedValue = data.reduce((sum, item) => {
      const value = parseFloat(item.value) || 0;
      const probability = parseFloat(item.probability) || 0;
      return sum + (value * probability / 100);
    }, 0);
    
    // Group by month for trend analysis
    const monthlyData = groupByMonth(data);
    
    // Add computed properties to each deal
    const enhancedDeals = data.map(deal => ({
      ...deal,
      weightedValue: (parseFloat(deal.value) || 0) * (parseFloat(deal.probability) || 0) / 100,
      daysInStage: calculateDaysInStage(deal.lastUpdated),
      isNew: isNewDeal(deal.createdDate),
      riskScore: calculateRiskScore(deal)
    }));
    
    return {
      deals: enhancedDeals,
      metadata: {
        salesReps,
        dealStages,
        customers,
        summary: {
          totalValue,
          weightedValue,
          dealCount: data.length,
          avgDealSize: data.length > 0 ? totalValue / data.length : 0
        },
        monthlyData
      }
    };
  } catch (error) {
    logError('Error processing dashboard data:', error);
    return { deals: data, metadata: {} };
  }
}

/**
 * Group deals by month for trend analysis
 * @param {Array} deals - Array of deal objects
 * @returns {Object} - Deals grouped by month
 */
function groupByMonth(deals) {
  const monthlyGroups = {};
  
  deals.forEach(deal => {
    const createdDate = deal.createdDate ? new Date(deal.createdDate) : null;
    if (!createdDate) return;
    
    const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        count: 0,
        totalValue: 0,
        weightedValue: 0,
        deals: []
      };
    }
    
    const value = parseFloat(deal.value) || 0;
    const probability = parseFloat(deal.probability) || 0;
    
    monthlyGroups[monthKey].count++;
    monthlyGroups[monthKey].totalValue += value;
    monthlyGroups[monthKey].weightedValue += (value * probability / 100);
    monthlyGroups[monthKey].deals.push(deal);
  });
  
  return monthlyGroups;
}

/**
 * Calculate days in current stage
 * @param {string} lastUpdated - Last updated date string
 * @returns {number} - Number of days in current stage
 */
function calculateDaysInStage(lastUpdated) {
  if (!lastUpdated) return 0;
  
  const lastUpdatedDate = new Date(lastUpdated);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = Math.abs(now - lastUpdatedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a deal is new (created within the last 7 days)
 * @param {string} createdDate - Created date string
 * @returns {boolean} - True if the deal is new
 */
function isNewDeal(createdDate) {
  if (!createdDate) return false;
  
  const created = new Date(createdDate);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 7;
}

/**
 * Calculate risk score for a deal (0-100, higher is riskier)
 * @param {Object} deal - Deal object
 * @returns {number} - Risk score
 */
function calculateRiskScore(deal) {
  let score = 0;
  
  // Lower probability means higher risk
  score += 100 - (parseFloat(deal.probability) || 0);
  
  // Older deals are riskier
  const daysInStage = calculateDaysInStage(deal.lastUpdated);
  if (daysInStage > 30) score += 20;
  if (daysInStage > 60) score += 20;
  
  // Certain stages are riskier
  if (deal.dealStage === 'Negotiation') score += 10;
  if (deal.dealStage === 'Proposal Sent') score += 15;
  
  // Cap at 100
  return Math.min(100, score);
}

// Export functions
export {
  fetchDataWithCaching,
  fetchDashboardData,
  clearCache,
  clearAllCaches,
  getLastFetchTimestamp,
  formatLastUpdateTime,
  processDashboardData
};

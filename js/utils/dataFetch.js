/**
 * dataFetch.js - Data Fetching Module
 * Handles fetching and caching data from the server
 */

import apiService from './apiService.js';
import { getSheetDataEndpoint } from './apiEndpoints.js';
import { logDebug, logError } from './logger.js';

// Cache settings
const CACHE_KEY = 'orderforecast_data_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetch data from the server with caching
 * @param {boolean} forceFresh - Whether to force a fresh data fetch
 * @returns {Promise<Array>} - The fetched data
 */
async function fetchDataWithCaching(forceFresh = false) {
  // Check cache first if not forcing fresh data
  if (!forceFresh) {
    const cachedData = getCachedData();
    if (cachedData) {
      logDebug('Using cached data');
      return cachedData;
    }
  }
  
  // Fetch fresh data
  logDebug('Fetching fresh data from server');
  try {
    const data = await fetchDataFromServer();
    cacheData(data);
    return data;
  } catch (error) {
    logError('Error fetching data from server:', error);
    
    // If forcing fresh data failed, try to use cache as fallback
    if (forceFresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        logDebug('Fresh fetch failed, using cached data as fallback');
        return cachedData;
      }
    }
    
    throw error;
  }
}

/**
 * Fetch data from the server using the standardized API service
 * @returns {Promise<Array>} - The fetched data
 */
async function fetchDataFromServer() {
  try {
    const endpoint = getSheetDataEndpoint();
    return await apiService.get(endpoint);
  } catch (error) {
    // Enhanced error handling with standardized API service
    const status = error.response?.status || 'Unknown';
    const message = error.response?.statusText || error.message || 'Unknown error';
    
    // Throw a more descriptive error
    throw new Error(`Failed to fetch data (${status}): ${message}`);
  }
}

/**
 * Get cached data if available and not expired
 * @returns {Array|null} - The cached data or null if not available
 */
function getCachedData() {
  try {
    const cacheJson = localStorage.getItem(CACHE_KEY);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cache.timestamp > CACHE_EXPIRY) {
      logDebug('Cache expired');
      return null;
    }
    
    return cache.data;
  } catch (error) {
    logError('Error retrieving cached data:', error);
    return null;
  }
}

/**
 * Cache the fetched data
 * @param {Array} data - The data to cache
 */
function cacheData(data) {
  try {
    const cache = {
      timestamp: Date.now(),
      data: data
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    logDebug('Data cached successfully');
  } catch (error) {
    logError('Error caching data:', error);
    // If caching fails (e.g., quota exceeded), try to remove the cache
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // Ignore any errors from removing
    }
  }
}

/**
 * Clear the data cache
 */
function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    logDebug('Cache cleared');
  } catch (error) {
    logError('Error clearing cache:', error);
  }
}

/**
 * Get the timestamp of the last data fetch
 * @returns {number|null} - Timestamp of the last fetch or null if not available
 */
function getLastFetchTimestamp() {
  try {
    const cacheJson = localStorage.getItem(CACHE_KEY);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    return cache.timestamp;
  } catch (error) {
    logError('Error retrieving last fetch timestamp:', error);
    return null;
  }
}

// Export functions
export {
  fetchDataWithCaching,
  fetchDataFromServer,
  clearCache,
  getLastFetchTimestamp
};

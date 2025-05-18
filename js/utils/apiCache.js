/**
 * apiCache.js - API Response Caching Utility
 * Provides caching functionality for API responses to improve performance and reduce API calls
 */

import config from '../config.js';
import { logDebug } from './logger.js';

// Cache storage
const cacheStore = new Map();

/**
 * Cache item structure with metadata
 */
class CacheItem {
  constructor(data, ttl) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl || config.api.cacheTTL;
  }

  /**
   * Check if the cache item is expired
   * @returns {boolean} - Whether the cache item is expired
   */
  isExpired() {
    return Date.now() > this.timestamp + this.ttl;
  }
}

/**
 * Generate a cache key from request information
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {Object} params - Request parameters
 * @returns {string} - Cache key
 */
export function generateCacheKey(url, method = 'GET', params = null) {
  // Only cache GET requests by default
  if (method !== 'GET' && method !== 'HEAD') {
    return null;
  }
  
  // Create a key from URL and serialized params
  let key = `${method}:${url}`;
  
  if (params) {
    // Sort keys for consistent cache keys regardless of parameter order
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
      
    key += `:${JSON.stringify(sortedParams)}`;
  }
  
  return key;
}

/**
 * Set a value in the cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export function setCacheItem(key, data, ttl) {
  if (!key || !config.api.cacheEnabled) return;
  
  cacheStore.set(key, new CacheItem(data, ttl));
  logDebug(`Cache: Item stored with key "${key}"`);
  
  // Clean up expired items occasionally
  if (Math.random() < 0.1) { // 10% chance to trigger cleanup
    cleanExpiredCache();
  }
}

/**
 * Get a value from the cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found/expired
 */
export function getCacheItem(key) {
  if (!key || !config.api.cacheEnabled) return null;
  
  const cacheItem = cacheStore.get(key);
  
  // Return null if item doesn't exist or is expired
  if (!cacheItem || cacheItem.isExpired()) {
    if (cacheItem) {
      // Remove expired item
      cacheStore.delete(key);
      logDebug(`Cache: Item with key "${key}" was expired and removed`);
    }
    return null;
  }
  
  logDebug(`Cache: Item retrieved with key "${key}"`);
  return cacheItem.data;
}

/**
 * Remove a specific item from the cache
 * @param {string} key - Cache key
 */
export function removeCacheItem(key) {
  if (!key) return;
  
  cacheStore.delete(key);
  logDebug(`Cache: Item with key "${key}" was removed`);
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  cacheStore.clear();
  logDebug('Cache: All items cleared');
}

/**
 * Clean up expired cache items
 */
export function cleanExpiredCache() {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, item] of cacheStore.entries()) {
    if (now > item.timestamp + item.ttl) {
      cacheStore.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    logDebug(`Cache: Cleaned up ${expiredCount} expired items`);
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export function getCacheStats() {
  const stats = {
    totalItems: cacheStore.size,
    expiredItems: 0,
    averageAge: 0,
    oldestItem: 0,
    newestItem: 0
  };
  
  if (cacheStore.size === 0) {
    return stats;
  }
  
  const now = Date.now();
  let totalAge = 0;
  let oldest = now;
  let newest = 0;
  
  for (const item of cacheStore.values()) {
    const age = now - item.timestamp;
    totalAge += age;
    
    if (item.timestamp < oldest) {
      oldest = item.timestamp;
    }
    
    if (item.timestamp > newest) {
      newest = item.timestamp;
    }
    
    if (item.isExpired()) {
      stats.expiredItems++;
    }
  }
  
  stats.averageAge = totalAge / cacheStore.size;
  stats.oldestItem = now - oldest;
  stats.newestItem = now - newest;
  
  return stats;
}

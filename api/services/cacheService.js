/**
 * cacheService.js - Server-side Caching Service
 * Provides caching functionality to reduce unnecessary API calls
 * and improve performance
 */

const env = require('../../js/utils/envHandler');
const config = require('../../js/config');

// Cache storage with TTL (Time To Live)
class CacheStore {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0
    };
    
    // Run cleanup periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }
  
  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    if (!key) return null;
    
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if item is expired
    if (Date.now() > item.expiry) {
      this.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }
  
  /**
   * Set an item in the cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl) {
    if (!key) return;
    
    // Use default TTL from config if not specified
    const timeToLive = ttl || config.googleSheets.cacheTTL || 300000; // 5 minutes default
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + timeToLive
    });
    
    this.stats.sets++;
  }
  
  /**
   * Delete an item from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (!key) return;
    
    if (this.cache.delete(key)) {
      this.stats.deletes++;
    }
  }
  
  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    console.log('Cache cleared');
  }
  
  /**
   * Clean up expired items
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.stats.expirations += expiredCount;
      console.log(`Cache cleanup: removed ${expiredCount} expired items`);
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

// Create a singleton cache instance
const cacheStore = new CacheStore();

/**
 * Generate a cache key from request parameters
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @returns {string} - Cache key
 */
function generateCacheKey(endpoint, params = {}) {
  // Create a key from endpoint and sorted params
  let key = endpoint;
  
  if (Object.keys(params).length > 0) {
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
 * Cache middleware for API endpoints
 * @param {Object} options - Cache options
 * @returns {Function} - Express middleware function
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = null,
    keyGenerator = generateCacheKey,
    condition = () => true
  } = options;
  
  return (req, res, next) => {
    // Skip caching if disabled in config or condition is not met
    if (!config.googleSheets.cacheEnabled || !condition(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator(req.originalUrl || req.url, req.query);
    
    // Try to get from cache
    const cachedData = cacheStore.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cachedData);
    }
    
    console.log(`Cache miss for ${cacheKey}`);
    
    // Store original res.json function
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response data
      cacheStore.set(cacheKey, data, ttl);
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  cacheStore,
  generateCacheKey,
  cacheMiddleware
};

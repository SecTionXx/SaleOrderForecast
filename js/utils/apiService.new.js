/**
 * apiService.js - Standardized API Service
 * Provides a consistent interface for making API calls with proper error handling,
 * request/response interceptors, and security features
 */

import { getAuthToken, refreshAuthToken } from '../auth/clientAuthService.js';
import { logDebug, logError } from './logger.js';
import { sanitizeObject, sanitizeString, sanitizeUrl } from './sanitizer.js';
import { handleApiError, ApiError, parseErrorResponse } from './apiErrorHandler.js';
import { generateCacheKey, getCacheItem, setCacheItem, removeCacheItem, clearCache } from './apiCache.js';
import config from '../config.js';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

// Request interceptors
const requestInterceptors = [];

// Response interceptors
const responseInterceptors = [];

/**
 * Add a request interceptor
 * @param {Function} interceptor - Function that receives and modifies request config
 * @returns {number} - Index of the interceptor for later removal
 */
function addRequestInterceptor(interceptor) {
  return requestInterceptors.push(interceptor) - 1;
}

/**
 * Add a response interceptor
 * @param {Function} interceptor - Function that receives and processes response
 * @returns {number} - Index of the interceptor for later removal
 */
function addResponseInterceptor(interceptor) {
  return responseInterceptors.push(interceptor) - 1;
}

/**
 * Remove a request interceptor
 * @param {number} index - Index of the interceptor to remove
 */
function removeRequestInterceptor(index) {
  if (index >= 0 && index < requestInterceptors.length) {
    requestInterceptors.splice(index, 1);
  }
}

/**
 * Remove a response interceptor
 * @param {number} index - Index of the interceptor to remove
 */
function removeResponseInterceptor(index) {
  if (index >= 0 && index < responseInterceptors.length) {
    responseInterceptors.splice(index, 1);
  }
}

/**
 * Apply request interceptors to config
 * @param {Object} config - Request configuration
 * @returns {Object} - Modified request configuration
 */
function applyRequestInterceptors(config) {
  let modifiedConfig = { ...config };
  
  for (const interceptor of requestInterceptors) {
    try {
      modifiedConfig = interceptor(modifiedConfig) || modifiedConfig;
    } catch (error) {
      logError('Error in request interceptor:', error);
    }
  }
  
  return modifiedConfig;
}

/**
 * Apply response interceptors to response
 * @param {Object} response - Response object
 * @returns {Object} - Modified response
 */
function applyResponseInterceptors(response) {
  let modifiedResponse = { ...response };
  
  for (const interceptor of responseInterceptors) {
    try {
      modifiedResponse = interceptor(modifiedResponse) || modifiedResponse;
    } catch (error) {
      logError('Error in response interceptor:', error);
    }
  }
  
  return modifiedResponse;
}

/**
 * Create default headers with authentication
 * @returns {Object} - Headers object
 */
function createDefaultHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Handle token refresh when authentication fails
 * @returns {Promise<boolean>} - Whether token was successfully refreshed
 */
async function handleTokenRefresh() {
  try {
    const success = await refreshAuthToken();
    return success;
  } catch (error) {
    logError('Token refresh failed:', error);
    return false;
  }
}

/**
 * Validate and sanitize request URL and options
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Object} - Sanitized URL and options
 */
function sanitizeRequest(url, options = {}) {
  // Sanitize URL to prevent injection attacks
  const sanitizedUrl = sanitizeUrl(url);
  
  // Create sanitized options object
  const sanitizedOptions = { ...options };
  
  // Sanitize request body if it exists
  if (options.body) {
    if (typeof options.body === 'string') {
      sanitizedOptions.body = sanitizeString(options.body);
    } else if (typeof options.body === 'object') {
      sanitizedOptions.body = sanitizeObject(options.body);
    }
  }
  
  // Sanitize URL parameters if they exist
  if (options.params) {
    sanitizedOptions.params = sanitizeObject(options.params);
  }
  
  return { url: sanitizedUrl, options: sanitizedOptions };
}

/**
 * Make an HTTP request with standardized error handling and security features
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
async function request(url, options = {}) {
  // Sanitize request inputs
  const sanitized = sanitizeRequest(url, options);
  url = sanitized.url;
  options = sanitized.options;
  
  // Apply default values from config
  const baseUrl = options.baseUrl || config.api.baseUrl || window.location.origin;
  const timeout = options.timeout || config.api.timeout || DEFAULT_TIMEOUT;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Create request config
  let requestConfig = {
    method: options.method || 'GET',
    headers: {
      ...createDefaultHeaders(),
      ...options.headers
    },
    ...options
  };
  
  // Add body if provided
  if (options.body) {
    requestConfig.body = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }
  
  // Check cache for GET requests if caching is enabled
  const useCache = options.cache !== false && config.api.cacheEnabled;
  const cacheKey = useCache ? generateCacheKey(fullUrl, requestConfig.method, options.params) : null;
  
  if (useCache && requestConfig.method === 'GET') {
    const cachedData = getCacheItem(cacheKey);
    if (cachedData) {
      logDebug(`API Cache Hit: ${requestConfig.method} ${fullUrl}`);
      return cachedData;
    }
  }
  
  // Apply request interceptors
  requestConfig = applyRequestInterceptors(requestConfig);
  
  // Log request (mask sensitive data)
  if (config.api.requestLogging) {
    const logHeaders = { ...requestConfig.headers };
    // Mask Authorization header
    if (logHeaders.Authorization) {
      logHeaders.Authorization = logHeaders.Authorization.substring(0, 15) + '...';
    }
    
    logDebug(`API Request: ${requestConfig.method} ${fullUrl}`, { 
      headers: logHeaders,
      params: options.params
    });
  }
  
  try {
    // Create fetch promise with timeout and abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Add signal to request config
    requestConfig.signal = controller.signal;
    
    // Execute fetch with abort controller
    const response = await fetch(fullUrl, requestConfig);
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Log response
    if (config.api.requestLogging) {
      logDebug(`API Response: ${response.status} ${response.statusText}`);
    }
    
    // Handle token refresh if needed
    if (response.status === 401 && options.autoRefreshToken !== false) {
      const refreshed = await handleTokenRefresh();
      if (refreshed) {
        // Retry the request with new token
        requestConfig.headers.Authorization = `Bearer ${getAuthToken()}`;
        return request(url, { ...options, autoRefreshToken: false });
      }
    }
    
    // Check if response is ok (status in the range 200-299)
    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }
    
    // Parse response based on content type
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      // Sanitize JSON data to prevent XSS
      data = typeof data === 'object' ? sanitizeObject(data) : data;
    } else {
      data = await response.text();
      // Sanitize text data
      data = sanitizeString(data);
    }
    
    // Apply response interceptors
    const processedResponse = applyResponseInterceptors({ data, response });
    
    // Store in cache if it's a GET request and caching is enabled
    if (useCache && requestConfig.method === 'GET') {
      setCacheItem(cacheKey, processedResponse.data, options.cacheTTL);
    }
    
    return processedResponse.data;
  } catch (error) {
    // Handle errors in a standardized way
    const apiError = handleApiError(error);
    
    // Special handling for specific error types
    if (apiError.code === 'NETWORK_ERROR') {
      // Implement offline handling if needed
      // ...
    }
    
    throw apiError;
  }
}

/**
 * Make a GET request
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

/**
 * Make a POST request with data validation and sanitization
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function post(url, data, options = {}) {
  // Sanitize request data
  const sanitizedData = sanitizeObject(data);
  
  return request(url, {
    ...options,
    method: 'POST',
    body: sanitizedData,
    cache: false // Don't cache POST requests
  });
}

/**
 * Make a PUT request with data validation and sanitization
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function put(url, data, options = {}) {
  // Sanitize request data
  const sanitizedData = sanitizeObject(data);
  
  return request(url, {
    ...options,
    method: 'PUT',
    body: sanitizedData,
    cache: false // Don't cache PUT requests
  });
}

/**
 * Make a DELETE request
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function del(url, options = {}) {
  return request(url, {
    ...options,
    method: 'DELETE',
    cache: false // Don't cache DELETE requests
  });
}

/**
 * Make a PATCH request with data validation and sanitization
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function patch(url, data, options = {}) {
  // Sanitize request data
  const sanitizedData = sanitizeObject(data);
  
  return request(url, {
    ...options,
    method: 'PATCH',
    body: sanitizedData,
    cache: false // Don't cache PATCH requests
  });
}

// Add default request interceptor for authentication token refresh
addRequestInterceptor((config) => {
  // Add timestamp to prevent caching by browsers
  if (config.method === 'GET' && config.preventCache) {
    const separator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_t=${Date.now()}`;
  }
  return config;
});

// Add default response interceptor for handling common response patterns
addResponseInterceptor((response) => {
  // Handle wrapped response data (e.g., { data: {...}, success: true })
  if (response.data && typeof response.data === 'object') {
    if (response.data.hasOwnProperty('data') && response.data.hasOwnProperty('success')) {
      if (response.data.success === false) {
        throw new ApiError(
          response.data.message || 'Operation failed',
          response.status,
          response.data.code || 'OPERATION_FAILED',
          response.data.details
        );
      }
      return { ...response, data: response.data.data };
    }
  }
  return response;
});

// Export the API service
export default {
  // Core methods
  request,
  get,
  post,
  put,
  delete: del,
  patch,
  
  // Interceptor management
  addRequestInterceptor,
  removeRequestInterceptor,
  addResponseInterceptor,
  removeResponseInterceptor,
  
  // Cache management
  clearCache,
  removeCacheItem,
  
  // Error handling
  handleApiError,
  ApiError
};

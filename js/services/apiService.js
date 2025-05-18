/**
 * apiService.js - Enhanced API Service Module
 * Provides a standardized interface for making API calls with robust error handling,
 * request/response interceptors, and token management
 */

import { getAuthToken, refreshToken } from '../auth/clientAuthService.js';
import { logDebug, logError, logInfo } from '../utils/logger.js';

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
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Create a timeout promise that rejects after specified time
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} - Promise that rejects after timeout
 */
function createTimeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Handle token refresh when a 401 response is received
 * @param {Object} response - The response object
 * @returns {Promise} - Promise that resolves with the new response after token refresh
 */
async function handleTokenRefresh(response, originalRequest) {
  // Only attempt refresh if the error is due to an expired token
  if (response.status === 401 && !originalRequest.isRetry) {
    try {
      logInfo('Token expired, attempting to refresh');
      const refreshResult = await refreshToken();
      
      if (refreshResult.success) {
        logInfo('Token refreshed successfully, retrying original request');
        
        // Update the authorization header with the new token
        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
        
        // Mark this request as a retry to prevent infinite loops
        originalRequest.isRetry = true;
        
        // Retry the original request with the new token
        return fetch(originalRequest.url, originalRequest);
      }
    } catch (error) {
      logError('Token refresh failed:', error);
    }
  }
  
  // If we couldn't refresh the token or it's not a 401, return the original response
  return response;
}

/**
 * Make an HTTP request with standardized error handling
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
async function request(url, options = {}) {
  // Apply default values
  const baseUrl = options.baseUrl || window.location.origin;
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Create request config
  let config = {
    method: options.method || 'GET',
    headers: {
      ...createDefaultHeaders(),
      ...options.headers
    },
    credentials: options.credentials || 'include', // Include cookies by default
    ...options
  };
  
  // Add body if provided
  if (options.body) {
    config.body = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }
  
  // Apply request interceptors
  config = applyRequestInterceptors(config);
  
  // Log request
  logDebug(`API Request: ${config.method} ${fullUrl}`, { 
    headers: { ...config.headers, Authorization: config.headers.Authorization ? '[REDACTED]' : undefined },
    body: config.body
  });
  
  try {
    // Create fetch promise with timeout
    const fetchPromise = fetch(fullUrl, config);
    const response = await Promise.race([
      fetchPromise,
      createTimeoutPromise(timeout)
    ]);
    
    // Handle token refresh if needed
    const finalResponse = await handleTokenRefresh(response, { ...config, url: fullUrl });
    
    // Create response object with additional properties
    const responseObject = {
      ok: finalResponse.ok,
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      headers: finalResponse.headers,
      url: finalResponse.url,
      originalResponse: finalResponse,
      data: null
    };
    
    // Try to parse response as JSON
    try {
      responseObject.data = await finalResponse.json();
    } catch (e) {
      // If not JSON, get text content
      try {
        responseObject.data = await finalResponse.text();
      } catch (textError) {
        // If we can't get text either, set data to empty string
        responseObject.data = '';
      }
    }
    
    // Apply response interceptors
    const processedResponse = applyResponseInterceptors(responseObject);
    
    // Log response
    logDebug(`API Response: ${config.method} ${fullUrl}`, {
      status: processedResponse.status,
      data: processedResponse.data
    });
    
    // Handle error responses
    if (!processedResponse.ok) {
      const error = new Error(processedResponse.statusText || 'Request failed');
      error.response = processedResponse;
      throw error;
    }
    
    return processedResponse.data;
  } catch (error) {
    // Log the error
    logError(`API Error: ${config.method} ${fullUrl}`, error);
    
    // Create a standardized error object
    const enhancedError = {
      message: error.message || 'Unknown error',
      status: error.response?.status || 0,
      data: error.response?.data || null,
      originalError: error
    };
    
    // Throw the enhanced error
    throw enhancedError;
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
 * Make a POST request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function post(url, data, options = {}) {
  return request(url, { ...options, method: 'POST', body: data });
}

/**
 * Make a PUT request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function put(url, data, options = {}) {
  return request(url, { ...options, method: 'PUT', body: data });
}

/**
 * Make a DELETE request
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' });
}

/**
 * Make a PATCH request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} options - Request options
 * @returns {Promise} - Promise that resolves with the response data
 */
function patch(url, data, options = {}) {
  return request(url, { ...options, method: 'PATCH', body: data });
}

// Add default request interceptor for logging
addRequestInterceptor((config) => {
  logDebug('Request interceptor:', { 
    method: config.method,
    url: config.url,
    headers: { ...config.headers, Authorization: config.headers.Authorization ? '[REDACTED]' : undefined }
  });
  return config;
});

// Add default response interceptor for token refresh
addResponseInterceptor((response) => {
  // Check for token refresh header
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    logInfo('Received new token from server');
    // Store the new token (implementation in authService.js)
    if (typeof window.updateAuthToken === 'function') {
      window.updateAuthToken(newToken);
    }
  }
  return response;
});

// Create a default export with all methods
const apiService = {
  request,
  get,
  post,
  put,
  delete: del, // 'delete' is a reserved word in JavaScript
  patch,
  addRequestInterceptor,
  addResponseInterceptor,
  removeRequestInterceptor,
  removeResponseInterceptor
};

export default apiService;

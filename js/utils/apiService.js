/**
 * apiService.js - Standardized API Service
 * Provides a consistent interface for making API calls with proper error handling
 * and request/response interceptors
 */

import { getAuthToken } from '../auth/auth.js';
import { logDebug, logError } from './logger.js';

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
    headers: config.headers,
    body: config.body
  });
  
  try {
    // Create fetch promise with timeout
    const fetchPromise = fetch(fullUrl, config);
    const response = await Promise.race([
      fetchPromise,
      createTimeoutPromise(timeout)
    ]);
    
    // Create response object with additional properties
    const responseObject = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url,
      originalResponse: response,
      data: null
    };
    
    // Try to parse response as JSON
    try {
      responseObject.data = await response.json();
    } catch (e) {
      // If not JSON, get text content
      responseObject.data = await response.text();
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
    // Log error
    logError(`API Error: ${config.method} ${fullUrl}`, error);
    
    // Enhance error object
    if (!error.response) {
      error.response = {
        status: 0,
        statusText: error.message,
        data: null
      };
    }
    
    // Throw enhanced error
    throw error;
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
  logDebug('Request interceptor:', config);
  return config;
});

// Add default response interceptor for logging
addResponseInterceptor((response) => {
  logDebug('Response interceptor:', response);
  return response;
});

// Export API service
export default {
  request,
  get,
  post,
  put,
  delete: del,
  patch,
  addRequestInterceptor,
  removeRequestInterceptor,
  addResponseInterceptor,
  removeResponseInterceptor
};

import { CONFIG } from '../config.js';
import { debounce } from '../utils/domUtils.js';

// Cache for storing API responses
const responseCache = new Map();

/**
 * Makes an API request with caching and error handling
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} [options={}] - Fetch options
 * @param {string} [method='GET'] - HTTP method
 * @param {Object} [body] - Request body for POST/PUT requests
 * @param {boolean} [useCache=true] - Whether to use response caching
 * @param {number} [cacheTTL] - Cache TTL in milliseconds (overrides default)
 * @returns {Promise<any>} The parsed JSON response
 */
export const apiRequest = async (endpoint, {
  method = 'GET',
  body,
  headers = {},
  useCache = true,
  cacheTTL
} = {}) => {
  const url = `${CONFIG.API.BASE_URL}${endpoint}`;
  const cacheKey = `${method}:${url}`;
  
  // Check cache for GET requests when caching is enabled
  if (useCache && method === 'GET') {
    const cached = responseCache.get(cacheKey);
    if (cached) {
      const { data, timestamp } = cached;
      const ttl = cacheTTL || CONFIG.API.CACHE_TTL;
      
      // Return cached response if not expired
      if (Date.now() - timestamp < ttl) {
        console.debug(`[API] Cache hit for ${cacheKey}`);
        return data;
      }
      // Remove expired cache entry
      responseCache.delete(cacheKey);
    }
  }
  
  // Set up request headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Add auth token if available
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const requestOptions = {
    method,
    headers: { ...defaultHeaders, ...headers },
    credentials: 'include',
  };
  
  // Add body for non-GET/HEAD requests
  if (body && method !== 'GET' && method !== 'HEAD') {
    requestOptions.body = JSON.stringify(body);
  }
  
  try {
    console.debug(`[API] ${method} ${url}`, { body: requestOptions.body });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
    
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await parseResponse(response);
      throw new ApiError(
        errorData?.message || 'API request failed',
        response.status,
        errorData
      );
    }
    
    const data = await parseResponse(response);
    
    // Cache successful GET responses
    if (useCache && method === 'GET') {
      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
    
    return data;
  } catch (error) {
    console.error(`[API] Request failed: ${error.message}`, { endpoint, method, error });
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    } else if (error instanceof ApiError) {
      throw error; // Re-throw our custom error
    } else if (error.name === 'SyntaxError') {
      throw new ApiError('Invalid response format', 500);
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new ApiError('Network error. Please check your connection.', 0);
    }
    
    throw new ApiError(error.message || 'An unknown error occurred', 500);
  }
};

/**
 * Parse response based on content type
 * @private
 */
async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    return response.json();
  } else if (contentType.includes('text/')) {
    return response.text();
  } else {
    // For binary data or unknown types
    return response.blob();
  }
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {Object} [data] - Additional error data
   */
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
  
  /**
   * Check if the error is due to authentication/authorization
   * @returns {boolean}
   */
  isAuthError() {
    return this.status === 401 || this.status === 403;
  }
  
  /**
   * Check if the error is a client error (4xx)
   * @returns {boolean}
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }
  
  /**
   * Check if the error is a server error (5xx)
   * @returns {boolean}
   */
  isServerError() {
    return this.status >= 500;
  }
}

// Export utility methods for common HTTP methods
export const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} [options] - Request options
   * @returns {Promise<any>}
   */
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<any>}
   */
  post: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body }),
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<any>}
   */
  put: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body }),
  
  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} [body] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<any>}
   */
  patch: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} [options] - Request options
   * @returns {Promise<any>}
   */
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
  
  /**
   * Clear the API response cache
   * @param {string} [endpoint] - Optional endpoint to clear specific cache
   */
  clearCache: (endpoint) => {
    if (endpoint) {
      // Clear specific endpoint cache for all methods
      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(method => {
        const cacheKey = `${method}:${endpoint}`;
        responseCache.delete(cacheKey);
      });
    } else {
      // Clear all cache
      responseCache.clear();
    }
  }
};

// Export the error class
export { ApiError };

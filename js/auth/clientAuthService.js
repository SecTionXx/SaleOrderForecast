/**
 * clientAuthService.js - Client-side Authentication Service
 * Provides JWT authentication, token management, and user session handling for the client
 */

import apiService from '../services/apiService.js';
import { API_PATHS } from '../services/apiEndpoints.js';
import { logDebug, logError, logInfo } from '../utils/logger.js';

// Authentication endpoints reference
const AUTH_ENDPOINTS = API_PATHS.AUTH;

// Constants
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'auth_expiry';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Event for authentication state changes
const AUTH_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  SESSION_EXPIRED: 'auth:session_expired',
  UNAUTHORIZED: 'auth:unauthorized'
};

/**
 * Dispatch authentication event
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 */
function dispatchAuthEvent(eventName, data = {}) {
  const event = new CustomEvent(eventName, { 
    detail: data,
    bubbles: true 
  });
  document.dispatchEvent(event);
  logDebug(`Auth event dispatched: ${eventName}`, data);
}

/**
 * Store authentication data in local storage
 * @param {Object} authData - Authentication data
 */
function storeAuthData(authData) {
  if (!authData || !authData.token) {
    logError('Invalid auth data provided to storeAuthData');
    return;
  }
  
  localStorage.setItem(TOKEN_KEY, authData.token);
  
  if (authData.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
  }
  
  if (authData.expiresAt) {
    localStorage.setItem(TOKEN_EXPIRY_KEY, authData.expiresAt);
  }
  
  // Store refresh token if available
  if (authData.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
  }
}

/**
 * Clear authentication data from local storage
 */
function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Get authentication token from local storage
 * @returns {string|null} - Authentication token or null if not found
 */
function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get refresh token from local storage
 * @returns {string|null} - Refresh token or null if not found
 */
function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get authenticated user from local storage
 * @returns {Object|null} - User object or null if not found
 */
function getAuthUser() {
  const userJson = localStorage.getItem(USER_KEY);
  
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    logError('Error parsing auth user:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @returns {boolean} - True if token is expired
 */
function isTokenExpired() {
  const expiryString = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!expiryString) {
    return true;
  }
  
  try {
    const expiryDate = new Date(expiryString);
    return expiryDate <= new Date();
  } catch (error) {
    logError('Error checking token expiry:', error);
    return true;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
function isAuthenticated() {
  const token = getAuthToken();
  return !!token && !isTokenExpired();
}

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} - True if user has the role
 */
function hasRole(role) {
  const user = getAuthUser();
  
  if (!user || !user.role) {
    return false;
  }
  
  // Role hierarchy
  const roleHierarchy = {
    admin: 3,
    editor: 2,
    viewer: 1
  };
  
  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredRoleLevel = roleHierarchy[role] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has the permission
 */
function hasPermission(permission) {
  const user = getAuthUser();
  
  if (!user) {
    return false;
  }
  
  // Admin role has all permissions
  if (user.role === 'admin') {
    return true;
  }
  
  // Check user permissions if available
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  
  return false;
}

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} - Login result
 */
async function login(username, password) {
  try {
    // Clear any existing auth data
    clearAuthData();
    
    const response = await apiService.post(AUTH_ENDPOINTS.LOGIN, 
      { username, password },
      { skipAuthHeader: true }
    );
    
    if (response.success) {
      // Store auth data
      storeAuthData(response);
      
      // Dispatch login event
      dispatchAuthEvent(AUTH_EVENTS.LOGIN, { user: response.user });
      
      return {
        success: true,
        user: response.user
      };
    } else {
      return {
        success: false,
        message: response.message || 'Login failed'
      };
    }
  } catch (error) {
    logError('Login error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred during login'
    };
  }
}

/**
 * Logout user
 * @returns {Promise<Object>} - Logout result
 */
async function logout() {
  try {
    const token = getAuthToken();
    
    if (token) {
      // Call logout endpoint
      await apiService.post(AUTH_ENDPOINTS.LOGOUT);
    }
    
    // Clear auth data
    clearAuthData();
    
    // Dispatch logout event
    dispatchAuthEvent(AUTH_EVENTS.LOGOUT);
    
    return { success: true };
  } catch (error) {
    logError('Logout error:', error);
    
    // Still clear auth data and dispatch logout event
    clearAuthData();
    dispatchAuthEvent(AUTH_EVENTS.LOGOUT);
    
    return {
      success: true,
      message: 'Logged out with errors'
    };
  }
}

/**
 * Refresh authentication token
 * @returns {Promise<Object>} - Refresh result
 */
async function refreshToken() {
  try {
    const token = getAuthToken();
    const refreshToken = getRefreshToken();
    
    if (!token || !refreshToken) {
      return {
        success: false,
        message: 'No token to refresh'
      };
    }
    
    const response = await apiService.post(
      AUTH_ENDPOINTS.REFRESH,
      { refreshToken },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        skipAuthHeader: true
      }
    );
    
    if (response.success) {
      // Store new auth data
      storeAuthData(response);
      
      // Dispatch token refreshed event
      dispatchAuthEvent(AUTH_EVENTS.TOKEN_REFRESHED);
      
      return {
        success: true,
        token: response.token,
        expiresAt: response.expiresAt
      };
    } else {
      // Token refresh failed, clear auth data
      clearAuthData();
      
      // Dispatch session expired event
      dispatchAuthEvent(AUTH_EVENTS.SESSION_EXPIRED);
      
      return {
        success: false,
        message: response.message || 'Token refresh failed'
      };
    }
  } catch (error) {
    logError('Token refresh error:', error);
    
    // Token refresh failed, clear auth data
    clearAuthData();
    
    // Dispatch session expired event
    dispatchAuthEvent(AUTH_EVENTS.SESSION_EXPIRED);
    
    return {
      success: false,
      message: error.message || 'An error occurred during token refresh'
    };
  }
}

/**
 * Check and refresh token if needed
 * @returns {Promise<boolean>} - True if authenticated
 */
async function checkAuthentication() {
  if (!getAuthToken()) {
    return false;
  }
  
  // If token is not expired, user is authenticated
  if (!isTokenExpired()) {
    return true;
  }
  
  // Try to refresh token
  const refreshResult = await refreshToken();
  return refreshResult.success;
}

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Registration result
 */
async function register(userData) {
  try {
    const response = await apiService.post(
      AUTH_ENDPOINTS.REGISTER,
      userData,
      { skipAuthHeader: true }
    );
    
    return response;
  } catch (error) {
    logError('Registration error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred during registration'
    };
  }
}

/**
 * Update user profile
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} - Update result
 */
async function updateProfile(userData) {
  try {
    const user = getAuthUser();
    
    if (!user) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }
    
    const response = await apiService.put(
      AUTH_ENDPOINTS.UPDATE_PROFILE,
      userData
    );
    
    if (response.success && response.user) {
      // Update stored user data
      const updatedUser = {
        ...user,
        ...response.user
      };
      
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
    
    return response;
  } catch (error) {
    logError('Update profile error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred during profile update'
    };
  }
}

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Change password result
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await apiService.post(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      {
        currentPassword,
        newPassword
      }
    );
    
    return response;
  } catch (error) {
    logError('Change password error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred during password change'
    };
  }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} - Password reset request result
 */
async function requestPasswordReset(email) {
  try {
    const response = await apiService.post(
      AUTH_ENDPOINTS.RESET_PASSWORD,
      { email },
      { skipAuthHeader: true }
    );
    
    return response;
  } catch (error) {
    logError('Password reset request error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred during password reset request'
    };
  }
}

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Password reset result
 */
async function resetPassword(token, newPassword) {
  try {
    const response = await apiService.post(
      AUTH_ENDPOINTS.RESET_PASSWORD,
      {
        token,
        newPassword
      },
      { skipAuthHeader: true }
    );
    
    return response;
  } catch (error) {
    logError('Password reset error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred during password reset'
    };
  }
}

/**
 * Get user sessions
 * @returns {Promise<Object>} - User sessions result
 */
async function getUserSessions() {
  try {
    const response = await apiService.get(AUTH_ENDPOINTS.GET_SESSIONS);
    
    return response;
  } catch (error) {
    logError('Get sessions error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred while getting sessions'
    };
  }
}

/**
 * Invalidate other sessions
 * @returns {Promise<Object>} - Invalidate sessions result
 */
async function invalidateOtherSessions() {
  try {
    const response = await apiService.post(AUTH_ENDPOINTS.INVALIDATE_OTHER_SESSIONS);
    
    return response;
  } catch (error) {
    logError('Invalidate sessions error:', error);
    
    return {
      success: false,
      message: error.message || 'An error occurred while invalidating sessions'
    };
  }
}

/**
 * Handle unauthorized response (401)
 * Called by apiService when a request returns 401
 */
function handleUnauthorized() {
  // Clear auth data
  clearAuthData();
  
  // Dispatch unauthorized event
  dispatchAuthEvent(AUTH_EVENTS.UNAUTHORIZED);
}

/**
 * Add authentication header to request
 * @param {Object} headers - Request headers
 * @returns {Object} - Headers with authentication
 */
function addAuthHeader(headers = {}) {
  const token = getAuthToken();
  
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return headers;
}

/**
 * Listen for authentication events
 * @param {string} eventName - Event name
 * @param {Function} callback - Event callback
 * @returns {Function} - Function to remove event listener
 */
function onAuthEvent(eventName, callback) {
  if (!Object.values(AUTH_EVENTS).includes(eventName)) {
    logError(`Invalid auth event: ${eventName}`);
    return () => {};
  }
  
  const handler = (event) => callback(event.detail);
  document.addEventListener(eventName, handler);
  
  return () => {
    document.removeEventListener(eventName, handler);
  };
}

// Initialize auth service
function init() {
  // Check if token is expired on page load
  if (getAuthToken() && isTokenExpired()) {
    // Try to refresh token
    refreshToken().catch(() => {
      // If refresh fails, clear auth data
      clearAuthData();
    });
  }
}

// Initialize on load
init();

// Export auth service
export {
  login,
  logout,
  register,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getUserSessions,
  invalidateOtherSessions,
  getAuthToken,
  getRefreshToken,
  getAuthUser,
  isAuthenticated,
  checkAuthentication,
  hasRole,
  hasPermission,
  addAuthHeader,
  handleUnauthorized,
  onAuthEvent,
  AUTH_EVENTS
};

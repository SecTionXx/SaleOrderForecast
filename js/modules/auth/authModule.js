/**
 * Authentication Module
 * Handles user authentication, session management, and token handling
 */

import { api } from '../services/apiService.js';
import { appState } from '../state/appState.js';
import { logDebug, logInfo, logError } from '../utils/logger.js';
import { handleError } from '../utils/errorHandler.js';
import { ERROR_CODES } from '../utils/errorHandler.js';
import { showToast } from '../components/toasts.js';
import { CONFIG } from '../config.js';

// Token management
const TOKEN_KEY = CONFIG.STORAGE_KEYS.AUTH_TOKEN;
const USER_KEY = CONFIG.STORAGE_KEYS.USER_DATA;

/**
 * Initialize the authentication module
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export async function initializeAuth() {
  logInfo('Initializing authentication module...');
  
  try {
    // Check for existing session
    const token = getToken();
    
    if (token) {
      logDebug('Existing auth token found, validating session...');
      
      try {
        // Validate the token with the server
        const userData = await validateSession(token);
        
        // Update application state
        appState.setState({
          isAuthenticated: true,
          user: userData,
          permissions: userData.permissions || []
        });
        
        logInfo(`User ${userData.email} authenticated successfully`);
        return true;
      } catch (error) {
        // Token is invalid or expired, clear it
        logWarn('Invalid or expired session', error);
        clearAuth();
      }
    }
    
    // No valid session found
    appState.setState({
      isAuthenticated: false,
      user: null,
      permissions: []
    });
    
    return false;
  } catch (error) {
    handleError(error, {
      context: 'Auth:initialize',
      showToUser: false
    });
    return false;
  }
}

/**
 * Log in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {boolean} [rememberMe] - Whether to remember the user
 * @returns {Promise<Object>} User data
 */
export async function login(email, password, rememberMe = false) {
  try {
    logDebug(`Attempting login for ${email}`);
    
    // Show loading state
    appState.setState({ isLoading: true, loadingMessage: 'Signing in...' });
    
    // Call the authentication API
    const response = await api.post('/auth/login', {
      email,
      password,
      rememberMe
    });
    
    const { token, user } = response.data;
    
    // Store the token and user data
    storeAuth(token, user, rememberMe);
    
    // Update application state
    appState.setState({
      isAuthenticated: true,
      user,
      permissions: user.permissions || [],
      isLoading: false,
      loadingMessage: ''
    });
    
    logInfo(`User ${email} logged in successfully`);
    
    // Show success message
    showToast(`Welcome back, ${user.name || user.email}!`, { type: 'success' });
    
    return user;
  } catch (error) {
    appState.setState({ isLoading: false, loadingMessage: '' });
    
    // Handle specific error cases
    if (error.code === ERROR_CODES.INVALID_CREDENTIALS) {
      showToast('Invalid email or password', { type: 'error' });
    } else if (error.code === ERROR_CODES.ACCOUNT_LOCKED) {
      showToast('Your account has been locked. Please contact support.', { type: 'error' });
    } else {
      handleError(error, {
        context: 'Auth:login',
        showToUser: true,
        defaultMessage: 'Failed to log in. Please try again.'
      });
    }
    
    throw error;
  }
}

/**
 * Log out the current user
 * @param {boolean} [notifyUser] - Whether to show a logout message
 * @returns {Promise<void>}
 */
export async function logout(notifyUser = true) {
  const { user } = appState.getState();
  const email = user?.email;
  
  try {
    // Call the logout API if we have a valid token
    const token = getToken();
    if (token) {
      await api.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    
    // Clear auth data
    clearAuth();
    
    // Update application state
    appState.setState({
      isAuthenticated: false,
      user: null,
      permissions: []
    });
    
    logInfo(`User ${email || ''} logged out`);
    
    if (notifyUser) {
      showToast('You have been logged out', { type: 'info' });
    }
  } catch (error) {
    // Even if logout API fails, we still want to clear local auth
    clearAuth();
    
    handleError(error, {
      context: 'Auth:logout',
      showToUser: false
    });
    
    // Re-throw to allow caller to handle if needed
    throw error;
  }
}

/**
 * Validate a session token with the server
 * @param {string} token - The auth token to validate
 * @returns {Promise<Object>} User data
 * @private
 */
async function validateSession(token) {
  try {
    const response = await api.get('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.user;
  } catch (error) {
    logError('Session validation failed', error);
    throw new Error('Invalid or expired session');
  }
}

/**
 * Store authentication data
 * @param {string} token - The auth token
 * @param {Object} user - User data
 * @param {boolean} [rememberMe] - Whether to persist the session
 * @private
 */
function storeAuth(token, user, rememberMe = false) {
  // Store token in memory
  window.__authToken = token;
  
  // Store in session storage (cleared when browser closes)
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  
  // If remember me is true, also store in localStorage
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  // Update API service headers
  api.setAuthToken(token);
}

/**
 * Clear authentication data
 * @private
 */
function clearAuth() {
  // Clear from memory
  window.__authToken = null;
  
  // Clear from storage
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Clear API service auth
  api.clearAuthToken();
}

/**
 * Get the current auth token
 * @returns {string|null} The auth token or null if not authenticated
 */
export function getToken() {
  // Check memory first
  if (window.__authToken) {
    return window.__authToken;
  }
  
  // Check session storage
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) {
    window.__authToken = sessionToken;
    return sessionToken;
  }
  
  // Check local storage
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) {
    window.__authToken = localToken;
    
    // Move to session storage for consistency
    sessionStorage.setItem(TOKEN_KEY, localToken);
    
    return localToken;
  }
  
  return null;
}

/**
 * Check if the current user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
export function isAuthenticated() {
  return !!getToken() && appState.getState().isAuthenticated;
}

/**
 * Check if the current user has a specific permission
 * @param {string} permission - The permission to check
 * @returns {boolean} Whether the user has the permission
 */
export function hasPermission(permission) {
  const { permissions } = appState.getState();
  return permissions && permissions.includes(permission);
}

/**
 * Check if the current user has any of the specified permissions
 * @param {string[]} requiredPermissions - Array of permissions to check
 * @returns {boolean} Whether the user has any of the permissions
 */
export function hasAnyPermission(requiredPermissions) {
  if (!requiredPermissions || !requiredPermissions.length) return true;
  
  const { permissions } = appState.getState();
  return requiredPermissions.some(permission => 
    permissions && permissions.includes(permission)
  );
}

/**
 * Get the current user
 * @returns {Object|null} The current user or null if not authenticated
 */
export function getCurrentUser() {
  return appState.getState().user;
}

// For debugging
if (typeof window !== 'undefined') {
  window.auth = {
    login,
    logout,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    getCurrentUser,
    getToken
  };
}

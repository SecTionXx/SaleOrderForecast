/**
 * auth.js - Authentication module
 * Handles user authentication, verification, and session management
 */

// Authentication constants
const AUTH_TOKEN_KEY = 'orderforecast_auth_token';
const AUTH_USER_KEY = 'orderforecast_user';
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';
const SESSION_INFO_KEY = 'orderforecast_session';

import { logDebug } from '../utils/logger.js';

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
async function checkAuthentication() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  logDebug('Checking authentication token');
  
  if (!token) {
    logDebug('No token found, redirecting to login');
    // No token, redirect to login
    sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
    return false;
  }
  
  try {
    // Get the base URL (handles both direct and proxy access)
    const baseUrl = window.location.origin;
    
    logDebug('Verifying token with server');
    // Verify token with server
    const response = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token }),
      credentials: 'include' // Include cookies for refresh token
    });
    
    // Check for token refresh header
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
      logDebug('Received refreshed token from server');
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    }
    
    const data = await response.json();
    logDebug('Token verification response', data);
    
    if (!response.ok || !data.success) {
      // Try to refresh the token
      logDebug('Token invalid, attempting to refresh');
      const refreshResult = await refreshToken(token);
      
      if (!refreshResult.success) {
        logDebug('Token refresh failed, redirecting to login');
        await logout(true);
        return false;
      } else {
        logDebug('Token refreshed successfully');
        return true;
      }
    }
    
    // Update user info if needed
    const storedUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || '{}');
    if (data.user && (storedUser.role !== data.user.role)) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    }
    
    logDebug('User authenticated successfully');
    return true;
  } catch (error) {
    logDebug('Authentication check error', error);
    // Error during verification, redirect to login
    await logout(true);
    return false;
  }
}

/**
 * Refresh an expired token
 * @param {string} token - The expired token
 * @returns {Promise<Object>} - Result with success status
 */
async function refreshToken(token) {
  const baseUrl = window.location.origin;
  
  logDebug('Attempting to refresh token');
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token }),
      credentials: 'include' // Include cookies for refresh token
    });
    
    const data = await response.json();
    
    if (response.ok && data.success && data.token) {
      // Update token in storage
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      
      // Update user info if provided
      if (data.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      }
      
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Token refresh failed' };
    }
  } catch (error) {
    logDebug('Token refresh error:', error);
    return { success: false, message: 'Token refresh error' };
  }
}

/**
 * Update user information in the UI
 * @param {Object} user - The user object from the server
 */
function updateUserInfo(user) {
  if (!user) return;
  
  // Update user display name if element exists
  const userNameElement = document.getElementById('user-display-name');
  if (userNameElement) {
    userNameElement.textContent = user.displayName || user.email || 'User';
  }
  
  // Update user avatar if element exists
  const userAvatarElement = document.getElementById('user-avatar');
  if (userAvatarElement) {
    if (user.avatarUrl) {
      userAvatarElement.src = user.avatarUrl;
      userAvatarElement.style.display = 'block';
    } else {
      // Use initials for avatar
      const initials = getInitials(user.displayName || user.email || 'U');
      userAvatarElement.style.display = 'none';
      
      // Update initials avatar if element exists
      const initialsAvatarElement = document.getElementById('user-initials-avatar');
      if (initialsAvatarElement) {
        initialsAvatarElement.textContent = initials;
        initialsAvatarElement.style.display = 'flex';
      }
    }
  }
}

/**
 * Get initials from a name
 * @param {string} name - The name to get initials from
 * @returns {string} - The initials
 */
function getInitials(name) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get the authentication token
 * @returns {string|null} - The authentication token or null if not authenticated
 */
function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get the current user information
 * @returns {Object|null} - The user object or null if not authenticated
 */
function getCurrentUser() {
  try {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Logout the current user
 * @param {boolean} redirect - Whether to redirect to login page
 * @returns {Promise<void>}
 */
async function logout(redirect = true) {
  logDebug('Logging out user');
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const baseUrl = window.location.origin;
  
  // Clear local storage
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(SESSION_INFO_KEY);
  
  // If we have a token, invalidate the session on the server
  if (token) {
    try {
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies to clear refresh token
      });
    } catch (error) {
      logDebug('Logout error:', error);
    }
  }
  
  if (redirect) {
    // Set redirect flag to prevent loops
    sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
    window.location.href = preventRedirectLoop('login.html');
  }
}

/**
 * Get user permissions
 * @returns {Promise<Array>} - Array of permissions
 */
async function getUserPermissions() {
  const token = getAuthToken();
  if (!token) return [];
  
  const baseUrl = window.location.origin;
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return data.permissions || [];
    }
    
    return [];
  } catch (error) {
    logDebug('Error fetching permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} - True if user has permission
 */
async function hasPermission(permission) {
  const permissions = await getUserPermissions();
  return permissions.includes(permission);
}

/**
 * Prevent redirect loops by adding a timestamp
 * @param {string} url - The URL to redirect to
 * @returns {string} - The URL with a timestamp parameter
 */
function preventRedirectLoop(url) {
  // Add a timestamp parameter to prevent caching and loops
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

// Export functions
export {
  checkAuthentication,
  updateUserInfo,
  getInitials,
  getAuthToken,
  getCurrentUser,
  logout,
  preventRedirectLoop,
  refreshToken,
  getUserPermissions,
  hasPermission
};

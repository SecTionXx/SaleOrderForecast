/**
 * auth.js - Authentication module
 * Handles user authentication, verification, and session management
 */

// Authentication constants
const AUTH_TOKEN_KEY = 'orderforecast_auth_token';
const AUTH_USER_KEY = 'orderforecast_user';
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';

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
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    logDebug('Token verification response', data);
    
    if (!response.ok || !data.success) {
      logDebug('Token invalid, redirecting to login');
      // Invalid token, redirect to login
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
      return false;
    }
    
    logDebug('Token valid, updating user info');
    // Valid token, update user info
    if (data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      updateUserInfo(data.user);
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return false;
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
 */
function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
  window.location.href = 'login.html';
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
  getAuthToken,
  getCurrentUser,
  logout,
  preventRedirectLoop
};

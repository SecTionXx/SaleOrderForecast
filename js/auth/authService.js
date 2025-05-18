/**
 * authService.js - Enhanced Authentication Service
 * Implements robust JWT authentication with token refresh, session management,
 * and secure storage
 */

import apiService from '../services/apiService.js';
import { 
  getAuthLoginEndpoint, 
  getAuthLogoutEndpoint, 
  getAuthVerifyEndpoint,
  getAuthRefreshEndpoint,
  getAuthChangePasswordEndpoint
} from '../services/apiEndpoints.js';
import { logDebug, logError, logInfo } from '../utils/logger.js';

// Authentication storage keys
const AUTH_TOKEN_KEY = 'orderforecast_auth_token';
const AUTH_USER_KEY = 'orderforecast_user';
const AUTH_REFRESH_TOKEN_KEY = 'orderforecast_refresh_token';
const SESSION_INFO_KEY = 'orderforecast_session';
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';

// Token refresh settings
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
let refreshPromise = null; // To prevent multiple simultaneous refresh attempts

/**
 * Login user with credentials
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} - Login result with token and user info
 */
async function login(username, password) {
  try {
    logDebug('Attempting login for user:', username);
    
    // Get client info for security tracking
    const clientInfo = {
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`
    };
    
    const response = await apiService.post(getAuthLoginEndpoint(), {
      username,
      password,
      clientInfo
    });
    
    if (response.success) {
      // Store authentication data
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      
      // Store refresh token if provided
      if (response.refreshToken) {
        localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.refreshToken);
      }
      
      // Store session info
      const sessionInfo = {
        loginTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        expiresAt: response.expiresAt
      };
      localStorage.setItem(SESSION_INFO_KEY, JSON.stringify(sessionInfo));
      
      logInfo('User logged in successfully:', response.user.username);
      return {
        success: true,
        user: response.user
      };
    } else {
      logError('Login failed:', response.message);
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
 * Logout the current user
 * @param {boolean} redirect - Whether to redirect to login page
 * @returns {Promise<Object>} - Logout result
 */
async function logout(redirect = true) {
  try {
    const token = getAuthToken();
    
    if (token) {
      // Attempt to notify the server about logout
      try {
        await apiService.post(getAuthLogoutEndpoint(), { token });
      } catch (error) {
        // Continue with local logout even if server logout fails
        logError('Server logout failed, continuing with local logout:', error);
      }
    }
    
    // Clear all authentication data from local storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_INFO_KEY);
    
    logInfo('User logged out successfully');
    
    // Redirect to login page if requested
    if (redirect) {
      sessionStorage.setItem(REDIRECT_FLAG_KEY, 'logout');
      const loginUrl = preventRedirectLoop('login.html');
      window.location.href = loginUrl;
    }
    
    return { success: true };
  } catch (error) {
    logError('Logout error:', error);
    return {
      success: false,
      message: error.message || 'An error occurred during logout'
    };
  }
}

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
async function checkAuthentication() {
  const token = getAuthToken();
  logDebug('Checking authentication token');
  
  if (!token) {
    logDebug('No token found');
    return false;
  }
  
  try {
    // Check if token is about to expire and needs refresh
    if (shouldRefreshToken()) {
      logDebug('Token is about to expire, refreshing');
      const refreshResult = await refreshToken();
      if (!refreshResult.success) {
        logDebug('Token refresh failed');
        return false;
      }
    }
    
    // Verify token with server
    logDebug('Verifying token with server');
    const response = await apiService.post(getAuthVerifyEndpoint(), { token });
    
    if (response.success) {
      // Update user info if needed
      if (response.user) {
        updateStoredUserInfo(response.user);
      }
      
      // Update session info
      updateSessionActivity();
      
      logDebug('Token verified successfully');
      return true;
    } else {
      logDebug('Token verification failed:', response.message);
      return false;
    }
  } catch (error) {
    logError('Authentication check error:', error);
    return false;
  }
}

/**
 * Refresh the authentication token
 * @returns {Promise<Object>} - Refresh result with new token
 */
async function refreshToken() {
  // If there's already a refresh in progress, return that promise
  if (refreshPromise) {
    return refreshPromise;
  }
  
  // Create a new refresh promise
  refreshPromise = (async () => {
    try {
      const token = getAuthToken();
      const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
      
      if (!token) {
        return { success: false, message: 'No token to refresh' };
      }
      
      logDebug('Attempting to refresh token');
      
      const response = await apiService.post(getAuthRefreshEndpoint(), { 
        token,
        refreshToken
      });
      
      if (response.success && response.token) {
        // Update token in storage
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        
        // Update refresh token if provided
        if (response.refreshToken) {
          localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, response.refreshToken);
        }
        
        // Update user info if provided
        if (response.user) {
          updateStoredUserInfo(response.user);
        }
        
        // Update session info
        if (response.expiresAt) {
          updateSessionExpiry(response.expiresAt);
        }
        
        logInfo('Token refreshed successfully');
        return { success: true, token: response.token };
      } else {
        logError('Token refresh failed:', response.message);
        return { success: false, message: response.message || 'Token refresh failed' };
      }
    } catch (error) {
      logError('Token refresh error:', error);
      return { success: false, message: error.message || 'Token refresh error' };
    } finally {
      // Clear the refresh promise
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

/**
 * Check if token should be refreshed based on expiry time
 * @returns {boolean} - True if token should be refreshed
 */
function shouldRefreshToken() {
  try {
    const sessionInfo = JSON.parse(localStorage.getItem(SESSION_INFO_KEY) || '{}');
    if (!sessionInfo.expiresAt) return false;
    
    const expiryTime = new Date(sessionInfo.expiresAt).getTime();
    const currentTime = new Date().getTime();
    
    // Refresh if token expires within the threshold
    return (expiryTime - currentTime) < TOKEN_REFRESH_THRESHOLD;
  } catch (error) {
    logError('Error checking token expiry:', error);
    return false;
  }
}

/**
 * Update stored user information
 * @param {Object} user - User object from server
 */
function updateStoredUserInfo(user) {
  try {
    const storedUserJson = localStorage.getItem(AUTH_USER_KEY);
    if (!storedUserJson) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return;
    }
    
    const storedUser = JSON.parse(storedUserJson);
    const updatedUser = { ...storedUser, ...user };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  } catch (error) {
    logError('Error updating stored user info:', error);
  }
}

/**
 * Update session activity timestamp
 */
function updateSessionActivity() {
  try {
    const sessionInfo = JSON.parse(localStorage.getItem(SESSION_INFO_KEY) || '{}');
    sessionInfo.lastActive = new Date().toISOString();
    localStorage.setItem(SESSION_INFO_KEY, JSON.stringify(sessionInfo));
  } catch (error) {
    logError('Error updating session activity:', error);
  }
}

/**
 * Update session expiry timestamp
 * @param {string} expiresAt - ISO timestamp when token expires
 */
function updateSessionExpiry(expiresAt) {
  try {
    const sessionInfo = JSON.parse(localStorage.getItem(SESSION_INFO_KEY) || '{}');
    sessionInfo.expiresAt = expiresAt;
    localStorage.setItem(SESSION_INFO_KEY, JSON.stringify(sessionInfo));
  } catch (error) {
    logError('Error updating session expiry:', error);
  }
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
    logError('Error parsing user data:', error);
    return null;
  }
}

/**
 * Update user information in the UI
 * @param {Object} user - The user object from the server
 */
function updateUserInfo(user = null) {
  const userToDisplay = user || getCurrentUser();
  if (!userToDisplay) return;
  
  // Update user display name if element exists
  const userNameElement = document.getElementById('user-display-name');
  if (userNameElement) {
    userNameElement.textContent = userToDisplay.displayName || userToDisplay.name || userToDisplay.email || userToDisplay.username || 'User';
  }
  
  // Update user avatar if element exists
  const userAvatarElement = document.getElementById('user-avatar');
  if (userAvatarElement) {
    if (userToDisplay.avatarUrl) {
      userAvatarElement.src = userToDisplay.avatarUrl;
      userAvatarElement.style.display = 'block';
      
      // Hide initials avatar if it exists
      const initialsAvatarElement = document.getElementById('user-initials-avatar');
      if (initialsAvatarElement) {
        initialsAvatarElement.style.display = 'none';
      }
    } else {
      // Use initials for avatar
      const initials = getInitials(userToDisplay.displayName || userToDisplay.name || userToDisplay.email || userToDisplay.username || 'U');
      userAvatarElement.style.display = 'none';
      
      // Update initials avatar if element exists
      const initialsAvatarElement = document.getElementById('user-initials-avatar');
      if (initialsAvatarElement) {
        initialsAvatarElement.textContent = initials;
        initialsAvatarElement.style.display = 'flex';
      }
    }
  }
  
  // Update role indicator if element exists
  const userRoleElement = document.getElementById('user-role');
  if (userRoleElement && userToDisplay.role) {
    userRoleElement.textContent = userToDisplay.role.charAt(0).toUpperCase() + userToDisplay.role.slice(1);
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
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Result of password change
 */
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await apiService.post(getAuthChangePasswordEndpoint(), {
      currentPassword,
      newPassword
    });
    
    if (response.success) {
      logInfo('Password changed successfully');
      return { success: true };
    } else {
      logError('Password change failed:', response.message);
      return {
        success: false,
        message: response.message || 'Password change failed'
      };
    }
  } catch (error) {
    logError('Password change error:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while changing password'
    };
  }
}

/**
 * Get user permissions
 * @returns {Promise<Array>} - Array of permissions
 */
async function getUserPermissions() {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }
  
  // If permissions are already in the user object, return them
  if (user.permissions) {
    return user.permissions;
  }
  
  try {
    // Fetch permissions from server
    const response = await apiService.get('/api/auth/permissions');
    
    if (response.success && response.permissions) {
      // Update user object with permissions
      updateStoredUserInfo({ permissions: response.permissions });
      return response.permissions;
    }
    
    return [];
  } catch (error) {
    logError('Error fetching user permissions:', error);
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

/**
 * Update the authentication token (used by token refresh interceptor)
 * @param {string} token - The new authentication token
 */
function updateAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    logDebug('Auth token updated via interceptor');
  }
}

// Make updateAuthToken available globally for the response interceptor (browser only)
if (typeof window !== 'undefined') {
  window.updateAuthToken = updateAuthToken;
}

// Export functions
export {
  login,
  logout,
  checkAuthentication,
  refreshToken,
  getAuthToken,
  getCurrentUser,
  updateUserInfo,
  changePassword,
  getUserPermissions,
  hasPermission,
  preventRedirectLoop
};

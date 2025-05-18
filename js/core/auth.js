/**
 * auth.js - Authentication Module
 * Centralizes authentication handling for the application
 */

import { logDebug, logError } from '../utils/logger.js';
import { 
  checkAuthentication as authCheck, 
  getAuthUser, 
  getAuthToken, 
  logout as authLogout, 
  hasRole, 
  hasPermission, 
  AUTH_EVENTS, 
  onAuthEvent 
} from '../auth/clientAuthService.js';

// Authentication constants
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
async function checkAuthentication() {
  try {
    logDebug("Checking authentication...");
    
    // Use the authentication service
    const isAuthenticated = await authCheck();
    
    if (!isAuthenticated) {
      logDebug("Not authenticated, redirecting to login");
      redirectToLogin();
      return false;
    }
    
    // Get user info
    const user = getAuthUser();
    
    // Update user info in UI
    updateUserInfo(user);
    
    logDebug("Authentication successful");
    return true;
  } catch (error) {
    logError("Authentication check failed:", error);
    redirectToLogin();
    return false;
  }
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  // Prevent redirect loops by adding a timestamp
  const loginUrl = preventRedirectLoop('login.html');
  
  // Set redirect flag to indicate this is a redirect
  localStorage.setItem(REDIRECT_FLAG_KEY, Date.now().toString());
  
  // Redirect to login page
  window.location.href = loginUrl;
}

/**
 * Prevent redirect loops by adding a timestamp
 * @param {string} url - URL to prevent loops for
 * @returns {string} - URL with timestamp
 */
function preventRedirectLoop(url) {
  // Add a timestamp parameter to prevent caching and loops
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Update user information in the UI
 * @param {Object} user - The user object from the server
 */
function updateUserInfo(user) {
  if (!user) return;
  
  // Update user name
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = user.name || user.username || 'User';
  }
  
  // Update user avatar
  const userAvatarElement = document.getElementById('user-avatar');
  if (userAvatarElement) {
    if (user.avatar) {
      userAvatarElement.src = user.avatar;
      userAvatarElement.alt = user.name || user.username || 'User Avatar';
    } else {
      // Set default avatar with initials
      const initials = (user.name || user.username || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
      
      userAvatarElement.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='40' height='40'%3E%3Crect width='100' height='100' fill='%234f46e5'/%3E%3Ctext x='50' y='50' font-size='40' text-anchor='middle' dominant-baseline='central' font-family='Arial' fill='white'%3E${initials}%3C/text%3E%3C/svg%3E`;
      userAvatarElement.alt = user.name || user.username || 'User';
    }
  }
  
  // Update role-based UI elements
  updateRoleBasedUI(user);
}

/**
 * Update role-based UI elements
 * @param {Object} user - The user object from the server
 */
function updateRoleBasedUI(user) {
  if (!user || !user.roles) return;
  
  // Show/hide admin section
  const adminSection = document.getElementById('admin-section');
  if (adminSection) {
    adminSection.style.display = hasRole('admin') ? 'block' : 'none';
  }
  
  // Show/hide editor features
  const editorElements = document.querySelectorAll('.editor-only');
  editorElements.forEach(element => {
    element.style.display = hasRole('editor') || hasRole('admin') ? '' : 'none';
  });
  
  // Disable edit buttons for viewers
  const editButtons = document.querySelectorAll('.edit-action');
  editButtons.forEach(button => {
    button.disabled = !hasPermission('edit');
    if (!hasPermission('edit')) {
      button.setAttribute('title', 'You do not have permission to edit');
    }
  });
}

/**
 * Set up authentication event listeners
 */
function setupAuthEventListeners() {
  // Listen for authentication events
  onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, () => {
    logDebug('Login successful');
    window.location.href = 'index.html';
  });
  
  onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    logDebug('Logged out');
    redirectToLogin();
  });
  
  onAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, () => {
    logDebug('Session expired');
    displaySessionExpiredMessage();
    redirectToLogin();
  });
  
  onAuthEvent(AUTH_EVENTS.TOKEN_REFRESHED, () => {
    logDebug('Token refreshed');
  });
}

/**
 * Display session expired message
 */
function displaySessionExpiredMessage() {
  alert('Your session has expired. Please log in again.');
}

/**
 * Logout the current user
 */
function logout() {
  logDebug('Logging out...');
  authLogout();
  redirectToLogin();
}

// Export functions
export {
  checkAuthentication,
  redirectToLogin,
  updateUserInfo,
  setupAuthEventListeners,
  logout,
  hasRole,
  hasPermission
};

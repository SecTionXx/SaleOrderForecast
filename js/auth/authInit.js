/**
 * authInit.js - Authentication Initialization
 * Initializes the authentication system and provides global authentication functions
 */

import { 
  checkAuthentication, 
  getAuthUser, 
  isAuthenticated, 
  logout, 
  hasRole, 
  hasPermission,
  AUTH_EVENTS, 
  onAuthEvent 
} from './clientAuthService.js';
import { showToast } from '../components/toast.js';
import { logDebug, logError } from '../utils/logger.js';
import Navigation from '../components/navigation.js';

// Constants
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';

/**
 * Initialize the authentication system
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
async function initializeAuth() {
  try {
    logDebug('Initializing authentication system');
    
    // Set up authentication event listeners
    setupAuthEventListeners();
    
    // Check if user is authenticated
    const isUserAuthenticated = await checkAuthentication();
    
    if (!isUserAuthenticated) {
      logDebug('User is not authenticated');
      return false;
    }
    
    // Get user info
    const user = getAuthUser();
    
    // Update UI based on user role and permissions
    updateUIBasedOnAuth(user);
    
    // Initialize navigation component
    initializeNavigation();
    
    logDebug('Authentication system initialized successfully');
    return true;
  } catch (error) {
    logError('Error initializing authentication system:', error);
    return false;
  }
}

/**
 * Set up authentication event listeners
 */
function setupAuthEventListeners() {
  // Listen for logout events
  onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    logDebug('Logout event received');
    showToast({
      type: 'info',
      message: 'You have been logged out',
      duration: 3000
    });
    redirectToLogin();
  });
  
  // Listen for session expiry events
  onAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, () => {
    logDebug('Session expired event received');
    showToast({
      type: 'warning',
      message: 'Your session has expired. Please log in again.',
      duration: 5000
    });
    redirectToLogin('?expired=true');
  });
  
  // Listen for unauthorized events
  onAuthEvent(AUTH_EVENTS.UNAUTHORIZED, () => {
    logDebug('Unauthorized event received');
    showToast({
      type: 'error',
      message: 'You are not authorized to access this resource',
      duration: 5000
    });
    redirectToLogin('?unauthorized=true');
  });
  
  // Listen for token refresh events
  onAuthEvent(AUTH_EVENTS.TOKEN_REFRESHED, () => {
    logDebug('Token refreshed event received');
  });
}

/**
 * Update UI based on user role and permissions
 * @param {Object} user - User object
 */
function updateUIBasedOnAuth(user) {
  if (!user) return;
  
  // Show/hide elements based on user role
  const adminElements = document.querySelectorAll('.admin-only');
  const editorElements = document.querySelectorAll('.editor-only');
  
  if (hasRole('admin')) {
    adminElements.forEach(el => el.style.display = '');
    editorElements.forEach(el => el.style.display = '');
  } else if (hasRole('editor')) {
    adminElements.forEach(el => el.style.display = 'none');
    editorElements.forEach(el => el.style.display = '');
  } else {
    adminElements.forEach(el => el.style.display = 'none');
    editorElements.forEach(el => el.style.display = 'none');
  }
  
  // Show/hide elements based on permissions
  document.querySelectorAll('[data-permission]').forEach(el => {
    const permission = el.getAttribute('data-permission');
    if (permission && !hasPermission(permission)) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  });
}

/**
 * Initialize navigation component
 */
function initializeNavigation() {
  const navContainer = document.getElementById('nav-container');
  
  if (navContainer) {
    // Initialize the navigation component
    new Navigation({
      containerId: 'nav-container'
    });
    
    logDebug('Navigation component initialized');
  }
}

/**
 * Redirect to login page
 * @param {string} queryParams - Query parameters to add to the login URL
 */
function redirectToLogin(queryParams = '') {
  // Set redirect flag to prevent redirect loops
  sessionStorage.setItem(REDIRECT_FLAG_KEY, Date.now().toString());
  
  // Redirect to login page
  window.location.href = `/login.html${queryParams}`;
}

/**
 * Handle logout
 * @returns {Promise<void>}
 */
async function handleLogout() {
  try {
    await logout();
    // Redirect will be handled by the auth event listener
  } catch (error) {
    logError('Logout error:', error);
    redirectToLogin();
  }
}

/**
 * Check if user has permission to access a feature
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
function checkPermission(permission) {
  if (!isAuthenticated()) {
    return false;
  }
  
  return hasPermission(permission);
}

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} - True if user has role
 */
function checkRole(role) {
  if (!isAuthenticated()) {
    return false;
  }
  
  return hasRole(role);
}

// Export authentication functions
export {
  initializeAuth,
  handleLogout,
  checkPermission,
  checkRole,
  redirectToLogin,
  updateUIBasedOnAuth
};

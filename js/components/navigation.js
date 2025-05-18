/**
 * navigation.js - Navigation Component
 * Provides navigation functionality with authentication integration
 */

import { getAuthUser, isAuthenticated, logout, hasRole } from '../auth/clientAuthService.js';
import { showToast } from './toast.js';
import { logDebug, logError } from '../utils/logger.js';

class Navigation {
  constructor(options = {}) {
    this.options = {
      containerId: 'nav-container',
      ...options
    };
    
    this.container = null;
    this.user = null;
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the navigation component
   */
  init() {
    // Find container
    this.container = document.getElementById(this.options.containerId);
    
    if (!this.container) {
      logError(`Navigation container with ID "${this.options.containerId}" not found`);
      return;
    }
    
    // Get authenticated user
    this.user = getAuthUser();
    
    // Render navigation
    this.renderNavigation();
    
    // Add event listeners
    this.addEventListeners();
    
    logDebug('Navigation component initialized');
  }
  
  /**
   * Render navigation content
   */
  renderNavigation() {
    const isUserAuthenticated = isAuthenticated();
    
    this.container.innerHTML = `
      <nav class="main-nav">
        <div class="nav-brand">
          <a href="/">
            <img src="assets/logo.svg" alt="Order Forecast" class="logo" />
            <span>Order Forecast</span>
          </a>
        </div>
        
        <div class="nav-links">
          <a href="/" class="nav-link">Dashboard</a>
          <a href="/reports.html" class="nav-link">Reports</a>
          <a href="/analytics.html" class="nav-link">Analytics</a>
          ${hasRole('editor') ? `<a href="/manage.html" class="nav-link">Manage</a>` : ''}
          ${hasRole('admin') ? `<a href="/admin.html" class="nav-link">Admin</a>` : ''}
        </div>
        
        <div class="nav-actions">
          ${isUserAuthenticated ? `
            <div class="user-dropdown">
              <button class="user-dropdown-toggle">
                <div class="user-avatar">
                  ${this.getInitials(this.user?.name || this.user?.username || '?')}
                </div>
                <span class="user-name">${this.user?.name || this.user?.username || 'User'}</span>
                <i data-feather="chevron-down"></i>
              </button>
              
              <div class="user-dropdown-menu">
                <div class="dropdown-header">
                  <div class="user-info">
                    <div class="user-avatar large">
                      ${this.getInitials(this.user?.name || this.user?.username || '?')}
                    </div>
                    <div class="user-details">
                      <div class="user-name">${this.user?.name || 'User'}</div>
                      <div class="user-email">${this.user?.email || this.user?.username || ''}</div>
                      <div class="user-role">${this.formatRole(this.user?.role || 'user')}</div>
                    </div>
                  </div>
                </div>
                
                <div class="dropdown-body">
                  <a href="/profile.html" class="dropdown-item">
                    <i data-feather="user"></i>
                    <span>Profile</span>
                  </a>
                  <a href="/settings.html" class="dropdown-item">
                    <i data-feather="settings"></i>
                    <span>Settings</span>
                  </a>
                </div>
                
                <div class="dropdown-footer">
                  <button class="btn btn-outline-danger btn-sm logout-btn">
                    <i data-feather="log-out"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <a href="/login.html" class="btn btn-primary login-btn">
              <i data-feather="log-in"></i>
              <span>Login</span>
            </a>
          `}
        </div>
      </nav>
    `;
    
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // User dropdown toggle
    const userDropdownToggle = this.container.querySelector('.user-dropdown-toggle');
    if (userDropdownToggle) {
      userDropdownToggle.addEventListener('click', this.toggleUserDropdown.bind(this));
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const userDropdown = this.container.querySelector('.user-dropdown');
      if (userDropdown && !userDropdown.contains(event.target)) {
        userDropdown.classList.remove('active');
      }
    });
    
    // Logout button
    const logoutBtn = this.container.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }
  }
  
  /**
   * Toggle user dropdown
   * @param {Event} event - Click event
   */
  toggleUserDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const userDropdown = this.container.querySelector('.user-dropdown');
    if (userDropdown) {
      userDropdown.classList.toggle('active');
    }
  }
  
  /**
   * Handle logout
   * @param {Event} event - Click event
   */
  async handleLogout(event) {
    event.preventDefault();
    
    try {
      // Call logout function
      const result = await logout();
      
      if (result.success) {
        // Show success message
        showToast({
          type: 'success',
          message: 'Logged out successfully',
          duration: 3000
        });
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 500);
      } else {
        logError('Logout failed:', result.message);
        
        showToast({
          type: 'error',
          message: result.message || 'Logout failed',
          duration: 5000
        });
      }
    } catch (error) {
      logError('Logout error:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred during logout',
        duration: 5000
      });
    }
  }
  
  /**
   * Get user initials
   * @param {string} name - User name
   * @returns {string} - User initials
   */
  getInitials(name) {
    if (!name) return '?';
    
    const parts = name.split(' ');
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  /**
   * Format role name
   * @param {string} role - Role name
   * @returns {string} - Formatted role name
   */
  formatRole(role) {
    if (!role) return 'User';
    
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    const userDropdownToggle = this.container.querySelector('.user-dropdown-toggle');
    if (userDropdownToggle) {
      userDropdownToggle.removeEventListener('click', this.toggleUserDropdown);
    }
    
    const logoutBtn = this.container.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.removeEventListener('click', this.handleLogout);
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    logDebug('Navigation component destroyed');
  }
}

// Export the Navigation class
export default Navigation;

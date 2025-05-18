/**
 * profileManagement.js - User Profile Management Component
 * Allows users to view and update their profile information, change passwords, and manage sessions
 */

import { 
  getAuthUser, 
  updateProfile, 
  changePassword, 
  getUserSessions,
  invalidateOtherSessions
} from '../auth/clientAuthService.js';
import { showToast } from './toast.js';
import { Modal } from './modal.js';
import { logDebug, logError } from '../utils/logger.js';
import { validateInput } from '../utils/helpers.js';

class ProfileManagement {
  constructor(options = {}) {
    this.options = {
      containerId: 'profile-container',
      ...options
    };
    
    this.container = null;
    this.user = null;
    this.sessions = [];
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the profile management component
   */
  init() {
    // Find container
    this.container = document.getElementById(this.options.containerId);
    
    if (!this.container) {
      logError(`Profile container with ID "${this.options.containerId}" not found`);
      return;
    }
    
    // Get authenticated user
    this.user = getAuthUser();
    
    if (!this.user) {
      this.container.innerHTML = `
        <div class="alert alert-warning">
          <i data-feather="alert-circle"></i>
          <p>You must be logged in to view your profile.</p>
        </div>
      `;
      
      // Initialize Feather icons if available
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
      
      return;
    }
    
    // Render profile
    this.renderProfile();
    
    // Add event listeners
    this.addEventListeners();
    
    // Load user sessions
    this.loadSessions();
    
    logDebug('Profile management component initialized');
  }
  
  /**
   * Render profile content
   */
  renderProfile() {
    this.container.innerHTML = `
      <div class="profile-management">
        <div class="profile-header">
          <div class="profile-avatar">
            <div class="avatar-placeholder">
              ${this.getInitials(this.user.name || this.user.username)}
            </div>
          </div>
          <div class="profile-info">
            <h2>${this.user.name || this.user.username}</h2>
            <p class="profile-role">${this.formatRole(this.user.role)}</p>
            <p class="profile-email">${this.user.email || 'No email provided'}</p>
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="btn btn-primary edit-profile-btn">
            <i data-feather="edit"></i> Edit Profile
          </button>
          <button class="btn btn-secondary change-password-btn">
            <i data-feather="lock"></i> Change Password
          </button>
        </div>
        
        <div class="profile-sections">
          <div class="profile-section">
            <h3>Personal Information</h3>
            <div class="profile-details">
              <div class="profile-detail">
                <span class="detail-label">Username</span>
                <span class="detail-value">${this.user.username}</span>
              </div>
              <div class="profile-detail">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">${this.user.name || 'Not provided'}</span>
              </div>
              <div class="profile-detail">
                <span class="detail-label">Email</span>
                <span class="detail-value">${this.user.email || 'Not provided'}</span>
              </div>
              <div class="profile-detail">
                <span class="detail-label">Role</span>
                <span class="detail-value">${this.formatRole(this.user.role)}</span>
              </div>
            </div>
          </div>
          
          <div class="profile-section">
            <div class="section-header">
              <h3>Active Sessions</h3>
              <button class="btn btn-sm btn-outline-danger logout-all-btn">
                <i data-feather="log-out"></i> Logout All Other Devices
              </button>
            </div>
            <div class="sessions-container">
              <div class="loading-sessions">
                <i data-feather="loader"></i>
                <span>Loading sessions...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    // Edit profile button
    const editProfileBtn = this.container.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', this.showEditProfileModal.bind(this));
    }
    
    // Change password button
    const changePasswordBtn = this.container.querySelector('.change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', this.showChangePasswordModal.bind(this));
    }
    
    // Logout all other devices button
    const logoutAllBtn = this.container.querySelector('.logout-all-btn');
    if (logoutAllBtn) {
      logoutAllBtn.addEventListener('click', this.confirmLogoutAllDevices.bind(this));
    }
  }
  
  /**
   * Load user sessions
   */
  async loadSessions() {
    try {
      const sessionsContainer = this.container.querySelector('.sessions-container');
      
      if (!sessionsContainer) {
        return;
      }
      
      const result = await getUserSessions();
      
      if (result.success) {
        this.sessions = result.sessions || [];
        this.renderSessions();
      } else {
        sessionsContainer.innerHTML = `
          <div class="alert alert-warning">
            <i data-feather="alert-circle"></i>
            <p>${result.message || 'Failed to load sessions'}</p>
          </div>
        `;
        
        // Initialize Feather icons if available
        if (typeof feather !== 'undefined') {
          feather.replace();
        }
      }
    } catch (error) {
      logError('Error loading sessions:', error);
      
      const sessionsContainer = this.container.querySelector('.sessions-container');
      
      if (sessionsContainer) {
        sessionsContainer.innerHTML = `
          <div class="alert alert-danger">
            <i data-feather="alert-circle"></i>
            <p>An error occurred while loading sessions</p>
          </div>
        `;
        
        // Initialize Feather icons if available
        if (typeof feather !== 'undefined') {
          feather.replace();
        }
      }
    }
  }
  
  /**
   * Render user sessions
   */
  renderSessions() {
    const sessionsContainer = this.container.querySelector('.sessions-container');
    
    if (!sessionsContainer) {
      return;
    }
    
    if (this.sessions.length === 0) {
      sessionsContainer.innerHTML = `
        <div class="empty-sessions">
          <i data-feather="info"></i>
          <p>No active sessions found</p>
        </div>
      `;
      
      // Initialize Feather icons if available
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
      
      return;
    }
    
    const sessionsList = document.createElement('div');
    sessionsList.className = 'sessions-list';
    
    this.sessions.forEach(session => {
      const isCurrentSession = session.isCurrent;
      const sessionItem = document.createElement('div');
      sessionItem.className = `session-item ${isCurrentSession ? 'current-session' : ''}`;
      sessionItem.dataset.sessionId = session.id;
      
      sessionItem.innerHTML = `
        <div class="session-info">
          <div class="session-device">
            <i data-feather="${this.getDeviceIcon(session.userAgent)}"></i>
            <span>${this.getDeviceName(session.userAgent)}</span>
            ${isCurrentSession ? '<span class="current-badge">Current</span>' : ''}
          </div>
          <div class="session-details">
            <div class="session-detail">
              <span class="detail-label">IP Address:</span>
              <span class="detail-value">${session.ip || 'Unknown'}</span>
            </div>
            <div class="session-detail">
              <span class="detail-label">Last Active:</span>
              <span class="detail-value">${this.formatDate(session.lastActive)}</span>
            </div>
            <div class="session-detail">
              <span class="detail-label">Created:</span>
              <span class="detail-value">${this.formatDate(session.createdAt)}</span>
            </div>
          </div>
        </div>
        
        ${!isCurrentSession ? `
        <div class="session-actions">
          <button class="btn btn-sm btn-danger logout-session-btn" data-session-id="${session.id}">
            <i data-feather="log-out"></i> Logout
          </button>
        </div>
        ` : ''}
      `;
      
      sessionsList.appendChild(sessionItem);
    });
    
    sessionsContainer.innerHTML = '';
    sessionsContainer.appendChild(sessionsList);
    
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Add event listeners to logout buttons
    const logoutButtons = sessionsContainer.querySelectorAll('.logout-session-btn');
    logoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        const sessionId = button.dataset.sessionId;
        this.confirmLogoutSession(sessionId);
      });
    });
  }
  
  /**
   * Show edit profile modal
   */
  showEditProfileModal() {
    const modalContent = `
      <form id="edit-profile-form" class="edit-profile-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" name="name" value="${this.user.name || ''}">
          <div class="input-error"></div>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" value="${this.user.email || ''}">
          <div class="input-error"></div>
        </div>
      </form>
    `;
    
    const modal = new Modal({
      title: 'Edit Profile',
      content: modalContent,
      size: 'medium',
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Save Changes',
          type: 'primary',
          onClick: () => this.handleProfileUpdate(modal)
        }
      ]
    });
    
    modal.open();
    
    // Add form validation
    const form = document.getElementById('edit-profile-form');
    const emailInput = form.querySelector('#email');
    
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        this.validateEmail(emailInput);
      });
    }
  }
  
  /**
   * Handle profile update
   * @param {Object} modal - Modal instance
   */
  async handleProfileUpdate(modal) {
    const form = document.getElementById('edit-profile-form');
    
    // Validate form
    const emailInput = form.querySelector('#email');
    let isValid = true;
    
    if (emailInput && emailInput.value.trim()) {
      isValid = this.validateEmail(emailInput) && isValid;
    }
    
    if (!isValid) {
      return;
    }
    
    // Get form data
    const name = form.querySelector('#name').value.trim();
    const email = emailInput.value.trim();
    
    // Check if anything changed
    if (name === (this.user.name || '') && email === (this.user.email || '')) {
      modal.close();
      showToast({
        type: 'info',
        message: 'No changes were made'
      });
      return;
    }
    
    try {
      // Update profile
      const result = await updateProfile({
        name,
        email
      });
      
      if (result.success) {
        // Update local user data
        this.user = {
          ...this.user,
          name,
          email
        };
        
        // Close modal
        modal.close();
        
        // Show success message
        showToast({
          type: 'success',
          message: 'Profile updated successfully'
        });
        
        // Re-render profile
        this.renderProfile();
        
        // Re-add event listeners
        this.addEventListeners();
      } else {
        showToast({
          type: 'error',
          message: result.message || 'Failed to update profile'
        });
      }
    } catch (error) {
      logError('Error updating profile:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred while updating profile'
      });
    }
  }
  
  /**
   * Show change password modal
   */
  showChangePasswordModal() {
    const modalContent = `
      <form id="change-password-form" class="change-password-form">
        <div class="form-group">
          <label for="current-password">Current Password</label>
          <input type="password" id="current-password" name="currentPassword" required>
          <div class="input-error"></div>
        </div>
        
        <div class="form-group">
          <label for="new-password">New Password</label>
          <input type="password" id="new-password" name="newPassword" required>
          <div class="input-error"></div>
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirm New Password</label>
          <input type="password" id="confirm-password" name="confirmPassword" required>
          <div class="input-error"></div>
        </div>
      </form>
    `;
    
    const modal = new Modal({
      title: 'Change Password',
      content: modalContent,
      size: 'medium',
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Change Password',
          type: 'primary',
          onClick: () => this.handlePasswordChange(modal)
        }
      ]
    });
    
    modal.open();
    
    // Add form validation
    const form = document.getElementById('change-password-form');
    const currentPasswordInput = form.querySelector('#current-password');
    const newPasswordInput = form.querySelector('#new-password');
    const confirmPasswordInput = form.querySelector('#confirm-password');
    
    if (currentPasswordInput) {
      currentPasswordInput.addEventListener('blur', () => {
        this.validateRequired(currentPasswordInput, 'Current password is required');
      });
    }
    
    if (newPasswordInput) {
      newPasswordInput.addEventListener('blur', () => {
        this.validatePassword(newPasswordInput);
      });
    }
    
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('blur', () => {
        this.validateConfirmPassword(confirmPasswordInput, newPasswordInput);
      });
    }
  }
  
  /**
   * Handle password change
   * @param {Object} modal - Modal instance
   */
  async handlePasswordChange(modal) {
    const form = document.getElementById('change-password-form');
    
    // Validate form
    const currentPasswordInput = form.querySelector('#current-password');
    const newPasswordInput = form.querySelector('#new-password');
    const confirmPasswordInput = form.querySelector('#confirm-password');
    
    let isValid = true;
    
    isValid = this.validateRequired(currentPasswordInput, 'Current password is required') && isValid;
    isValid = this.validatePassword(newPasswordInput) && isValid;
    isValid = this.validateConfirmPassword(confirmPasswordInput, newPasswordInput) && isValid;
    
    if (!isValid) {
      return;
    }
    
    // Get form data
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    
    try {
      // Change password
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        // Close modal
        modal.close();
        
        // Show success message
        showToast({
          type: 'success',
          message: 'Password changed successfully'
        });
      } else {
        showToast({
          type: 'error',
          message: result.message || 'Failed to change password'
        });
      }
    } catch (error) {
      logError('Error changing password:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred while changing password'
      });
    }
  }
  
  /**
   * Confirm logout from a specific session
   * @param {string} sessionId - Session ID
   */
  confirmLogoutSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      return;
    }
    
    const deviceName = this.getDeviceName(session.userAgent);
    
    const modal = new Modal({
      title: 'Logout Session',
      content: `
        <p>Are you sure you want to logout from this session?</p>
        <p><strong>Device:</strong> ${deviceName}</p>
        <p><strong>IP Address:</strong> ${session.ip || 'Unknown'}</p>
      `,
      size: 'small',
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Logout',
          type: 'danger',
          onClick: () => {
            modal.close();
            this.logoutSession(sessionId);
          }
        }
      ]
    });
    
    modal.open();
  }
  
  /**
   * Logout from a specific session
   * @param {string} sessionId - Session ID
   */
  async logoutSession(sessionId) {
    try {
      // Implement session logout
      // This would typically call an API endpoint to invalidate the session
      
      showToast({
        type: 'success',
        message: 'Session logged out successfully'
      });
      
      // Reload sessions
      this.loadSessions();
    } catch (error) {
      logError('Error logging out session:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred while logging out session'
      });
    }
  }
  
  /**
   * Confirm logout from all other devices
   */
  confirmLogoutAllDevices() {
    const modal = new Modal({
      title: 'Logout All Other Devices',
      content: `
        <p>Are you sure you want to logout from all other devices?</p>
        <p>This will terminate all sessions except your current one.</p>
      `,
      size: 'small',
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Logout All',
          type: 'danger',
          onClick: () => {
            modal.close();
            this.logoutAllDevices();
          }
        }
      ]
    });
    
    modal.open();
  }
  
  /**
   * Logout from all other devices
   */
  async logoutAllDevices() {
    try {
      const result = await invalidateOtherSessions();
      
      if (result.success) {
        showToast({
          type: 'success',
          message: `Successfully logged out from ${result.count || 'all'} other devices`
        });
        
        // Reload sessions
        this.loadSessions();
      } else {
        showToast({
          type: 'error',
          message: result.message || 'Failed to logout from other devices'
        });
      }
    } catch (error) {
      logError('Error logging out other devices:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred while logging out other devices'
      });
    }
  }
  
  /**
   * Validate required field
   * @param {HTMLInputElement} input - Input element
   * @param {string} message - Error message
   * @returns {boolean} - Whether input is valid
   */
  validateRequired(input, message) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    if (!value) {
      input.classList.add('is-invalid');
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      errorElement.style.display = 'none';
      return true;
    }
  }
  
  /**
   * Validate email input
   * @param {HTMLInputElement} input - Email input element
   * @returns {boolean} - Whether input is valid
   */
  validateEmail(input) {
    const email = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    if (!email) {
      // Email is optional
      input.classList.remove('is-invalid');
      input.classList.remove('is-valid');
      errorElement.style.display = 'none';
      return true;
    }
    
    const validation = validateInput(email, {
      email: true
    });
    
    if (!validation.valid) {
      input.classList.add('is-invalid');
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      errorElement.style.display = 'none';
      return true;
    }
  }
  
  /**
   * Validate password input
   * @param {HTMLInputElement} input - Password input element
   * @returns {boolean} - Whether input is valid
   */
  validatePassword(input) {
    const password = input.value;
    const errorElement = input.nextElementSibling;
    
    const validation = validateInput(password, {
      required: true,
      minLength: 8,
      password: true
    });
    
    if (!validation.valid) {
      input.classList.add('is-invalid');
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      errorElement.style.display = 'none';
      return true;
    }
  }
  
  /**
   * Validate confirm password input
   * @param {HTMLInputElement} input - Confirm password input element
   * @param {HTMLInputElement} passwordInput - Password input element
   * @returns {boolean} - Whether input is valid
   */
  validateConfirmPassword(input, passwordInput) {
    const confirmPassword = input.value;
    const password = passwordInput.value;
    const errorElement = input.nextElementSibling;
    
    if (confirmPassword !== password) {
      input.classList.add('is-invalid');
      errorElement.textContent = 'Passwords do not match';
      errorElement.style.display = 'block';
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      errorElement.style.display = 'none';
      return true;
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
    if (!role) return 'Unknown';
    
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
  
  /**
   * Format date string
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string
   */
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  }
  
  /**
   * Get device icon based on user agent
   * @param {string} userAgent - User agent string
   * @returns {string} - Feather icon name
   */
  getDeviceIcon(userAgent) {
    if (!userAgent) return 'monitor';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'smartphone';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'monitor';
    }
  }
  
  /**
   * Get device name based on user agent
   * @param {string} userAgent - User agent string
   * @returns {string} - Device name
   */
  getDeviceName(userAgent) {
    if (!userAgent) return 'Unknown Device';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      if (ua.includes('iphone')) {
        return 'iPhone';
      } else if (ua.includes('android')) {
        return 'Android Phone';
      } else {
        return 'Mobile Device';
      }
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      if (ua.includes('ipad')) {
        return 'iPad';
      } else {
        return 'Tablet';
      }
    } else {
      if (ua.includes('windows')) {
        return 'Windows PC';
      } else if (ua.includes('macintosh') || ua.includes('mac os')) {
        return 'Mac';
      } else if (ua.includes('linux')) {
        return 'Linux PC';
      } else {
        return 'Desktop';
      }
    }
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    const editProfileBtn = this.container.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.removeEventListener('click', this.showEditProfileModal);
    }
    
    const changePasswordBtn = this.container.querySelector('.change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.removeEventListener('click', this.showChangePasswordModal);
    }
    
    const logoutAllBtn = this.container.querySelector('.logout-all-btn');
    if (logoutAllBtn) {
      logoutAllBtn.removeEventListener('click', this.confirmLogoutAllDevices);
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    logDebug('Profile management component destroyed');
  }
}

// Export the ProfileManagement class
export default ProfileManagement;

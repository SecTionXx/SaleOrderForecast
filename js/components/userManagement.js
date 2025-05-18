/**
 * userManagement.js - User Management Component
 * Provides functionality for managing users, roles, and permissions
 */

import { apiRequest } from '../services/apiService.js';
import { AUTH_ENDPOINTS } from '../services/apiEndpoints.js';
import { hasPermission } from '../auth/clientAuthService.js';
import { showToast } from './toast.js';
import { Modal } from './modal.js';
import { logDebug, logError } from '../utils/logger.js';
import { validateInput, debounce } from '../utils/helpers.js';

class UserManagementComponent {
  constructor(options = {}) {
    this.options = {
      containerId: 'user-management-container',
      pageSize: 10,
      ...options
    };
    
    this.container = null;
    this.userTable = null;
    this.paginationContainer = null;
    this.searchInput = null;
    this.roleFilter = null;
    this.statusFilter = null;
    this.addUserButton = null;
    
    this.users = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.searchTerm = '';
    this.roleFilterValue = '';
    this.statusFilterValue = '';
    this.isLoading = false;
    
    // User edit modal
    this.userModal = null;
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the user management component
   */
  init() {
    // Check if user has permission to manage users
    if (!hasPermission('manage:users')) {
      logError('User does not have permission to manage users');
      return;
    }
    
    // Find container
    this.container = document.getElementById(this.options.containerId);
    
    if (!this.container) {
      logError(`User management container with ID "${this.options.containerId}" not found`);
      return;
    }
    
    // Create user management UI
    this.createUserManagementUI();
    
    // Add event listeners
    this.addEventListeners();
    
    // Load users
    this.loadUsers();
    
    logDebug('User management component initialized');
  }
  
  /**
   * Create user management UI
   */
  createUserManagementUI() {
    this.container.innerHTML = `
      <div class="user-management">
        <div class="user-management-header">
          <h2>User Management</h2>
          <button class="btn btn-primary add-user-btn">
            <i data-feather="user-plus"></i> Add User
          </button>
        </div>
        
        <div class="user-management-filters">
          <div class="search-container">
            <input type="text" class="search-input" placeholder="Search users...">
            <i data-feather="search"></i>
          </div>
          
          <div class="filter-container">
            <select class="role-filter">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            
            <select class="status-filter">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>
        
        <div class="user-table-container">
          <table class="user-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="loading-row">
                <td colspan="7">
                  <div class="loading-spinner">
                    <i data-feather="loader"></i>
                    <span>Loading users...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination-container"></div>
      </div>
    `;
    
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Get UI elements
    this.userTable = this.container.querySelector('.user-table tbody');
    this.paginationContainer = this.container.querySelector('.pagination-container');
    this.searchInput = this.container.querySelector('.search-input');
    this.roleFilter = this.container.querySelector('.role-filter');
    this.statusFilter = this.container.querySelector('.status-filter');
    this.addUserButton = this.container.querySelector('.add-user-btn');
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Search input
    this.searchInput.addEventListener('input', debounce(() => {
      this.searchTerm = this.searchInput.value.trim();
      this.currentPage = 1;
      this.loadUsers();
    }, 300));
    
    // Role filter
    this.roleFilter.addEventListener('change', () => {
      this.roleFilterValue = this.roleFilter.value;
      this.currentPage = 1;
      this.loadUsers();
    });
    
    // Status filter
    this.statusFilter.addEventListener('change', () => {
      this.statusFilterValue = this.statusFilter.value;
      this.currentPage = 1;
      this.loadUsers();
    });
    
    // Add user button
    this.addUserButton.addEventListener('click', () => {
      this.showUserModal();
    });
  }
  
  /**
   * Load users from API
   */
  async loadUsers() {
    try {
      this.setLoading(true);
      
      const params = {
        page: this.currentPage,
        limit: this.options.pageSize,
        search: this.searchTerm,
        role: this.roleFilterValue,
        status: this.statusFilterValue
      };
      
      const response = await apiRequest({
        url: AUTH_ENDPOINTS.USERS,
        method: 'GET',
        params
      });
      
      if (response.success) {
        this.users = response.users;
        this.totalPages = response.pagination.totalPages;
        
        this.renderUsers();
        this.renderPagination();
      } else {
        showToast({
          type: 'error',
          message: response.message || 'Failed to load users'
        });
      }
    } catch (error) {
      logError('Error loading users:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred while loading users'
      });
    } finally {
      this.setLoading(false);
    }
  }
  
  /**
   * Render users in table
   */
  renderUsers() {
    if (this.users.length === 0) {
      this.userTable.innerHTML = `
        <tr class="empty-row">
          <td colspan="7">
            <div class="empty-state">
              <i data-feather="users"></i>
              <p>No users found</p>
            </div>
          </td>
        </tr>
      `;
      
      // Initialize Feather icons if available
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
      
      return;
    }
    
    const rows = this.users.map(user => `
      <tr data-user-id="${user.id}">
        <td>${user.username}</td>
        <td>${user.name || '-'}</td>
        <td>${user.email || '-'}</td>
        <td>
          <span class="badge badge-${this.getRoleBadgeClass(user.role)}">
            ${user.role}
          </span>
        </td>
        <td>
          <span class="badge badge-${this.getStatusBadgeClass(user.status)}">
            ${user.status}
          </span>
        </td>
        <td>${this.formatDate(user.created)}</td>
        <td class="actions">
          <button class="btn btn-icon btn-edit" data-user-id="${user.id}" title="Edit user">
            <i data-feather="edit"></i>
          </button>
          <button class="btn btn-icon btn-delete" data-user-id="${user.id}" title="Delete user">
            <i data-feather="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    this.userTable.innerHTML = rows;
    
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Add event listeners to action buttons
    const editButtons = this.userTable.querySelectorAll('.btn-edit');
    const deleteButtons = this.userTable.querySelectorAll('.btn-delete');
    
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-user-id');
        const user = this.users.find(u => u.id === userId);
        
        if (user) {
          this.showUserModal(user);
        }
      });
    });
    
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-user-id');
        const user = this.users.find(u => u.id === userId);
        
        if (user) {
          this.confirmDeleteUser(user);
        }
      });
    });
  }
  
  /**
   * Render pagination controls
   */
  renderPagination() {
    if (this.totalPages <= 1) {
      this.paginationContainer.innerHTML = '';
      return;
    }
    
    const pages = [];
    const maxVisiblePages = 5;
    
    // Calculate range of pages to show
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Previous button
    pages.push(`
      <button class="pagination-btn prev-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
        ${this.currentPage === 1 ? 'disabled' : ''}>
        <i data-feather="chevron-left"></i>
      </button>
    `);
    
    // First page
    if (startPage > 1) {
      pages.push(`
        <button class="pagination-btn" data-page="1">1</button>
      `);
      
      if (startPage > 2) {
        pages.push('<span class="pagination-ellipsis">...</span>');
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
          data-page="${i}">${i}</button>
      `);
    }
    
    // Last page
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        pages.push('<span class="pagination-ellipsis">...</span>');
      }
      
      pages.push(`
        <button class="pagination-btn" data-page="${this.totalPages}">${this.totalPages}</button>
      `);
    }
    
    // Next button
    pages.push(`
      <button class="pagination-btn next-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
        ${this.currentPage === this.totalPages ? 'disabled' : ''}>
        <i data-feather="chevron-right"></i>
      </button>
    `);
    
    this.paginationContainer.innerHTML = pages.join('');
    
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Add event listeners to pagination buttons
    const pageButtons = this.paginationContainer.querySelectorAll('.pagination-btn[data-page]');
    const prevButton = this.paginationContainer.querySelector('.prev-btn');
    const nextButton = this.paginationContainer.querySelector('.next-btn');
    
    pageButtons.forEach(button => {
      button.addEventListener('click', () => {
        const page = parseInt(button.getAttribute('data-page'));
        this.goToPage(page);
      });
    });
    
    if (prevButton && !prevButton.disabled) {
      prevButton.addEventListener('click', () => {
        this.goToPage(this.currentPage - 1);
      });
    }
    
    if (nextButton && !nextButton.disabled) {
      nextButton.addEventListener('click', () => {
        this.goToPage(this.currentPage + 1);
      });
    }
  }
  
  /**
   * Go to specified page
   * @param {number} page - Page number
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.loadUsers();
  }
  
  /**
   * Show user modal for adding or editing a user
   * @param {Object} user - User object for editing, null for adding
   */
  showUserModal(user = null) {
    const isEditing = !!user;
    const modalTitle = isEditing ? 'Edit User' : 'Add User';
    
    const modalContent = `
      <form id="user-form" class="user-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required 
            value="${isEditing ? user.username : ''}" 
            ${isEditing ? 'readonly' : ''}>
          <div class="input-error"></div>
        </div>
        
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" name="name" 
            value="${isEditing && user.name ? user.name : ''}">
          <div class="input-error"></div>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required 
            value="${isEditing && user.email ? user.email : ''}">
          <div class="input-error"></div>
        </div>
        
        ${!isEditing ? `
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
          <div class="input-error"></div>
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input type="password" id="confirm-password" name="confirmPassword" required>
          <div class="input-error"></div>
        </div>
        ` : ''}
        
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" name="role" required>
            <option value="admin" ${isEditing && user.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="editor" ${isEditing && user.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="viewer" ${isEditing && user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
          </select>
          <div class="input-error"></div>
        </div>
        
        ${isEditing ? `
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" name="status" required>
            <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="locked" ${user.status === 'locked' ? 'selected' : ''}>Locked</option>
          </select>
          <div class="input-error"></div>
        </div>
        ` : ''}
      </form>
    `;
    
    // Create modal
    this.userModal = new Modal({
      title: modalTitle,
      content: modalContent,
      size: 'medium',
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          onClick: () => this.userModal.close()
        },
        {
          text: isEditing ? 'Save Changes' : 'Add User',
          type: 'primary',
          onClick: () => this.handleUserFormSubmit(isEditing, user ? user.id : null)
        }
      ]
    });
    
    // Show modal
    this.userModal.open();
    
    // Add form validation
    const form = document.getElementById('user-form');
    const usernameInput = form.querySelector('#username');
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    const confirmPasswordInput = form.querySelector('#confirm-password');
    
    if (usernameInput) {
      usernameInput.addEventListener('blur', () => {
        this.validateUsername(usernameInput);
      });
    }
    
    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        this.validateEmail(emailInput);
      });
    }
    
    if (passwordInput) {
      passwordInput.addEventListener('blur', () => {
        this.validatePassword(passwordInput);
      });
    }
    
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('blur', () => {
        this.validateConfirmPassword(confirmPasswordInput, passwordInput);
      });
    }
  }
  
  /**
   * Handle user form submission
   * @param {boolean} isEditing - Whether we're editing an existing user
   * @param {string} userId - User ID if editing
   */
  async handleUserFormSubmit(isEditing, userId) {
    const form = document.getElementById('user-form');
    
    // Validate form
    const usernameInput = form.querySelector('#username');
    const emailInput = form.querySelector('#email');
    const nameInput = form.querySelector('#name');
    const roleInput = form.querySelector('#role');
    const statusInput = form.querySelector('#status');
    const passwordInput = form.querySelector('#password');
    const confirmPasswordInput = form.querySelector('#confirm-password');
    
    let isValid = true;
    
    if (usernameInput) {
      isValid = this.validateUsername(usernameInput) && isValid;
    }
    
    if (emailInput) {
      isValid = this.validateEmail(emailInput) && isValid;
    }
    
    if (passwordInput) {
      isValid = this.validatePassword(passwordInput) && isValid;
    }
    
    if (confirmPasswordInput) {
      isValid = this.validateConfirmPassword(confirmPasswordInput, passwordInput) && isValid;
    }
    
    if (!isValid) {
      return;
    }
    
    // Prepare user data
    const userData = {
      username: usernameInput.value.trim(),
      email: emailInput.value.trim(),
      name: nameInput.value.trim(),
      role: roleInput.value
    };
    
    if (statusInput) {
      userData.status = statusInput.value;
    }
    
    if (passwordInput) {
      userData.password = passwordInput.value;
    }
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing user
        response = await apiRequest({
          url: `${AUTH_ENDPOINTS.USERS}/${userId}`,
          method: 'PUT',
          data: userData
        });
      } else {
        // Create new user
        response = await apiRequest({
          url: AUTH_ENDPOINTS.USERS,
          method: 'POST',
          data: userData
        });
      }
      
      if (response.success) {
        showToast({
          type: 'success',
          message: isEditing ? 'User updated successfully' : 'User created successfully'
        });
        
        // Close modal
        this.userModal.close();
        
        // Reload users
        this.loadUsers();
      } else {
        showToast({
          type: 'error',
          message: response.message || (isEditing ? 'Failed to update user' : 'Failed to create user')
        });
      }
    } catch (error) {
      logError(isEditing ? 'Error updating user:' : 'Error creating user:', error);
      
      showToast({
        type: 'error',
        message: isEditing ? 'An error occurred while updating the user' : 'An error occurred while creating the user'
      });
    }
  }
  
  /**
   * Confirm user deletion
   * @param {Object} user - User to delete
   */
  confirmDeleteUser(user) {
    const modal = new Modal({
      title: 'Delete User',
      content: `
        <p>Are you sure you want to delete the user "${user.username}"?</p>
        <p>This action cannot be undone.</p>
      `,
      size: 'small',
      buttons: [
        {
          text: 'Cancel',
          type: 'secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Delete',
          type: 'danger',
          onClick: () => {
            modal.close();
            this.deleteUser(user.id);
          }
        }
      ]
    });
    
    modal.open();
  }
  
  /**
   * Delete a user
   * @param {string} userId - User ID to delete
   */
  async deleteUser(userId) {
    try {
      const response = await apiRequest({
        url: `${AUTH_ENDPOINTS.USERS}/${userId}`,
        method: 'DELETE'
      });
      
      if (response.success) {
        showToast({
          type: 'success',
          message: 'User deleted successfully'
        });
        
        // Reload users
        this.loadUsers();
      } else {
        showToast({
          type: 'error',
          message: response.message || 'Failed to delete user'
        });
      }
    } catch (error) {
      logError('Error deleting user:', error);
      
      showToast({
        type: 'error',
        message: 'An error occurred while deleting the user'
      });
    }
  }
  
  /**
   * Validate username input
   * @param {HTMLInputElement} input - Username input element
   * @returns {boolean} - Whether input is valid
   */
  validateUsername(input) {
    const username = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    const validation = validateInput(username, {
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
      patternMessage: 'Username can only contain letters, numbers, and underscores'
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
   * Validate email input
   * @param {HTMLInputElement} input - Email input element
   * @returns {boolean} - Whether input is valid
   */
  validateEmail(input) {
    const email = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    const validation = validateInput(email, {
      required: true,
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
   * Set loading state
   * @param {boolean} isLoading - Whether component is loading
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    
    const loadingRow = this.userTable.querySelector('.loading-row');
    
    if (loadingRow) {
      loadingRow.style.display = isLoading ? 'table-row' : 'none';
    }
  }
  
  /**
   * Format date string
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  }
  
  /**
   * Get role badge class
   * @param {string} role - User role
   * @returns {string} - Badge class
   */
  getRoleBadgeClass(role) {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'editor':
        return 'success';
      case 'viewer':
        return 'info';
      default:
        return 'secondary';
    }
  }
  
  /**
   * Get status badge class
   * @param {string} status - User status
   * @returns {string} - Badge class
   */
  getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'locked':
        return 'danger';
      default:
        return 'secondary';
    }
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleSearch);
    }
    
    if (this.roleFilter) {
      this.roleFilter.removeEventListener('change', this.handleRoleFilter);
    }
    
    if (this.statusFilter) {
      this.statusFilter.removeEventListener('change', this.handleStatusFilter);
    }
    
    if (this.addUserButton) {
      this.addUserButton.removeEventListener('click', this.handleAddUser);
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    logDebug('User management component destroyed');
  }
}

// Export the UserManagementComponent class
export default UserManagementComponent;

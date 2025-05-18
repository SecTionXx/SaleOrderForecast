/**
 * login.js - Login Component
 * Provides a reusable login form with authentication functionality
 */

import { login, AUTH_EVENTS, onAuthEvent } from '../auth/clientAuthService.js';
import { showToast } from './toast.js';
import { logDebug, logError } from '../utils/logger.js';
import { validateInput, debounce } from '../utils/helpers.js';

class LoginComponent {
  constructor(options = {}) {
    this.options = {
      containerId: 'login-container',
      onLoginSuccess: null,
      onLoginFailure: null,
      redirectUrl: '/dashboard.html',
      rememberMe: true,
      showForgotPassword: true,
      showRegister: false,
      ...options
    };
    
    this.container = null;
    this.form = null;
    this.usernameInput = null;
    this.passwordInput = null;
    this.rememberMeCheckbox = null;
    this.submitButton = null;
    this.forgotPasswordLink = null;
    this.registerLink = null;
    this.errorMessage = null;
    
    this.isLoading = false;
    
    // Initialize component
    this.init();
  }
  
  /**
   * Initialize the login component
   */
  init() {
    // Find container
    this.container = document.getElementById(this.options.containerId);
    
    if (!this.container) {
      logError(`Login container with ID "${this.options.containerId}" not found`);
      return;
    }
    
    // Create login form
    this.createLoginForm();
    
    // Add event listeners
    this.addEventListeners();
    
    // Set up auth event listeners
    this.setupAuthEvents();
    
    logDebug('Login component initialized');
  }
  
  /**
   * Create login form HTML
   */
  createLoginForm() {
    // Create form element
    this.form = document.createElement('form');
    this.form.className = 'login-form';
    this.form.setAttribute('novalidate', '');
    
    // Create form content
    this.form.innerHTML = `
      <div class="form-header">
        <h2>Sign In</h2>
        <p>Enter your credentials to access your account</p>
      </div>
      
      <div class="form-error-message" style="display: none;"></div>
      
      <div class="form-group">
        <label for="username">Username</label>
        <div class="input-wrapper">
          <input type="text" id="username" name="username" placeholder="Enter your username" required autocomplete="username">
          <i data-feather="user"></i>
        </div>
        <div class="input-error"></div>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <input type="password" id="password" name="password" placeholder="Enter your password" required autocomplete="current-password">
          <i data-feather="lock"></i>
          <button type="button" class="toggle-password" aria-label="Toggle password visibility">
            <i data-feather="eye"></i>
          </button>
        </div>
        <div class="input-error"></div>
      </div>
      
      ${this.options.rememberMe ? `
      <div class="form-group form-checkbox">
        <input type="checkbox" id="remember-me" name="remember-me">
        <label for="remember-me">Remember me</label>
      </div>
      ` : ''}
      
      <div class="form-group">
        <button type="submit" class="btn btn-primary btn-block">
          <span class="btn-text">Sign In</span>
          <span class="btn-loader" style="display: none;">
            <i data-feather="loader"></i>
          </span>
        </button>
      </div>
      
      <div class="form-footer">
        ${this.options.showForgotPassword ? `
        <a href="#" class="forgot-password">Forgot password?</a>
        ` : ''}
        
        ${this.options.showRegister ? `
        <p>Don't have an account? <a href="#" class="register-link">Register</a></p>
        ` : ''}
      </div>
    `;
    
    // Append form to container
    this.container.innerHTML = '';
    this.container.appendChild(this.form);
    
    // Initialize Feather icons if available
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
    
    // Get form elements
    this.usernameInput = this.form.querySelector('#username');
    this.passwordInput = this.form.querySelector('#password');
    this.rememberMeCheckbox = this.form.querySelector('#remember-me');
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.forgotPasswordLink = this.form.querySelector('.forgot-password');
    this.registerLink = this.form.querySelector('.register-link');
    this.errorMessage = this.form.querySelector('.form-error-message');
    this.togglePasswordButton = this.form.querySelector('.toggle-password');
  }
  
  /**
   * Add event listeners to form elements
   */
  addEventListeners() {
    // Form submission
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Input validation
    this.usernameInput.addEventListener('input', debounce(this.validateUsername.bind(this), 300));
    this.usernameInput.addEventListener('blur', this.validateUsername.bind(this));
    
    this.passwordInput.addEventListener('input', debounce(this.validatePassword.bind(this), 300));
    this.passwordInput.addEventListener('blur', this.validatePassword.bind(this));
    
    // Toggle password visibility
    if (this.togglePasswordButton) {
      this.togglePasswordButton.addEventListener('click', this.togglePasswordVisibility.bind(this));
    }
    
    // Forgot password link
    if (this.forgotPasswordLink) {
      this.forgotPasswordLink.addEventListener('click', this.handleForgotPassword.bind(this));
    }
    
    // Register link
    if (this.registerLink) {
      this.registerLink.addEventListener('click', this.handleRegister.bind(this));
    }
  }
  
  /**
   * Set up authentication event listeners
   */
  setupAuthEvents() {
    // Listen for login event
    this.loginEventRemover = onAuthEvent(AUTH_EVENTS.LOGIN, (data) => {
      logDebug('Login event received', data);
      
      // Handle successful login
      this.handleLoginSuccess(data);
    });
  }
  
  /**
   * Validate username input
   */
  validateUsername() {
    const username = this.usernameInput.value.trim();
    const errorElement = this.usernameInput.closest('.form-group').querySelector('.input-error');
    
    const validation = validateInput(username, {
      required: true,
      minLength: 3,
      maxLength: 50
    });
    
    if (!validation.valid) {
      this.usernameInput.classList.add('is-invalid');
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
      return false;
    } else {
      this.usernameInput.classList.remove('is-invalid');
      this.usernameInput.classList.add('is-valid');
      errorElement.style.display = 'none';
      return true;
    }
  }
  
  /**
   * Validate password input
   */
  validatePassword() {
    const password = this.passwordInput.value;
    const errorElement = this.passwordInput.closest('.form-group').querySelector('.input-error');
    
    const validation = validateInput(password, {
      required: true,
      minLength: 6
    });
    
    if (!validation.valid) {
      this.passwordInput.classList.add('is-invalid');
      errorElement.textContent = validation.message;
      errorElement.style.display = 'block';
      return false;
    } else {
      this.passwordInput.classList.remove('is-invalid');
      this.passwordInput.classList.add('is-valid');
      errorElement.style.display = 'none';
      return true;
    }
  }
  
  /**
   * Toggle password visibility
   * @param {Event} event - Click event
   */
  togglePasswordVisibility(event) {
    event.preventDefault();
    
    const isPassword = this.passwordInput.type === 'password';
    this.passwordInput.type = isPassword ? 'text' : 'password';
    
    // Update icon
    const icon = this.togglePasswordButton.querySelector('i');
    if (icon) {
      if (isPassword) {
        icon.setAttribute('data-feather', 'eye-off');
      } else {
        icon.setAttribute('data-feather', 'eye');
      }
      
      // Re-render icon if Feather is available
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }
  }
  
  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    // Validate form
    const isUsernameValid = this.validateUsername();
    const isPasswordValid = this.validatePassword();
    
    if (!isUsernameValid || !isPasswordValid) {
      return;
    }
    
    // Get form data
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;
    const rememberMe = this.rememberMeCheckbox ? this.rememberMeCheckbox.checked : false;
    
    // Show loading state
    this.setLoading(true);
    
    try {
      // Attempt login
      const result = await login(username, password);
      
      if (result.success) {
        // Store remember me preference if needed
        if (rememberMe) {
          localStorage.setItem('remember_username', username);
        } else {
          localStorage.removeItem('remember_username');
        }
        
        // Handle successful login
        this.handleLoginSuccess(result);
      } else {
        // Handle login failure
        this.handleLoginFailure(result);
      }
    } catch (error) {
      logError('Login error:', error);
      
      // Handle login error
      this.handleLoginFailure({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      // Hide loading state
      this.setLoading(false);
    }
  }
  
  /**
   * Handle successful login
   * @param {Object} result - Login result
   */
  handleLoginSuccess(result) {
    logDebug('Login successful', result);
    
    // Clear any error messages
    this.hideErrorMessage();
    
    // Show success message
    showToast({
      type: 'success',
      message: `Welcome back, ${result.user.name || result.user.username}!`,
      duration: 3000
    });
    
    // Call success callback if provided
    if (typeof this.options.onLoginSuccess === 'function') {
      this.options.onLoginSuccess(result);
    }
    
    // Redirect to specified URL if provided
    if (this.options.redirectUrl) {
      setTimeout(() => {
        window.location.href = this.options.redirectUrl;
      }, 500);
    }
  }
  
  /**
   * Handle login failure
   * @param {Object} result - Login result
   */
  handleLoginFailure(result) {
    logDebug('Login failed', result);
    
    // Show error message
    this.showErrorMessage(result.message || 'Invalid username or password');
    
    // Shake form for visual feedback
    this.form.classList.add('shake');
    setTimeout(() => {
      this.form.classList.remove('shake');
    }, 500);
    
    // Call failure callback if provided
    if (typeof this.options.onLoginFailure === 'function') {
      this.options.onLoginFailure(result);
    }
  }
  
  /**
   * Handle forgot password link click
   * @param {Event} event - Click event
   */
  handleForgotPassword(event) {
    event.preventDefault();
    
    // Implement forgot password functionality
    // This could open a modal or navigate to a forgot password page
    const username = this.usernameInput.value.trim();
    
    // Dispatch custom event
    const forgotPasswordEvent = new CustomEvent('login:forgotPassword', {
      detail: { username },
      bubbles: true
    });
    
    this.container.dispatchEvent(forgotPasswordEvent);
  }
  
  /**
   * Handle register link click
   * @param {Event} event - Click event
   */
  handleRegister(event) {
    event.preventDefault();
    
    // Dispatch custom event
    const registerEvent = new CustomEvent('login:register', {
      bubbles: true
    });
    
    this.container.dispatchEvent(registerEvent);
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    }
  }
  
  /**
   * Hide error message
   */
  hideErrorMessage() {
    if (this.errorMessage) {
      this.errorMessage.textContent = '';
      this.errorMessage.style.display = 'none';
    }
  }
  
  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    
    if (this.submitButton) {
      const buttonText = this.submitButton.querySelector('.btn-text');
      const buttonLoader = this.submitButton.querySelector('.btn-loader');
      
      if (isLoading) {
        this.submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'inline-block';
      } else {
        this.submitButton.disabled = false;
        buttonText.style.display = 'inline-block';
        buttonLoader.style.display = 'none';
      }
    }
  }
  
  /**
   * Fill form with remembered username
   */
  fillRememberedCredentials() {
    if (this.options.rememberMe && this.usernameInput && this.rememberMeCheckbox) {
      const rememberedUsername = localStorage.getItem('remember_username');
      
      if (rememberedUsername) {
        this.usernameInput.value = rememberedUsername;
        this.rememberMeCheckbox.checked = true;
      }
    }
  }
  
  /**
   * Destroy the login component
   */
  destroy() {
    // Remove event listeners
    if (this.form) {
      this.form.removeEventListener('submit', this.handleSubmit);
    }
    
    if (this.usernameInput) {
      this.usernameInput.removeEventListener('input', this.validateUsername);
      this.usernameInput.removeEventListener('blur', this.validateUsername);
    }
    
    if (this.passwordInput) {
      this.passwordInput.removeEventListener('input', this.validatePassword);
      this.passwordInput.removeEventListener('blur', this.validatePassword);
    }
    
    if (this.togglePasswordButton) {
      this.togglePasswordButton.removeEventListener('click', this.togglePasswordVisibility);
    }
    
    if (this.forgotPasswordLink) {
      this.forgotPasswordLink.removeEventListener('click', this.handleForgotPassword);
    }
    
    if (this.registerLink) {
      this.registerLink.removeEventListener('click', this.handleRegister);
    }
    
    // Remove auth event listeners
    if (this.loginEventRemover) {
      this.loginEventRemover();
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    logDebug('Login component destroyed');
  }
}

// Export the LoginComponent class
export default LoginComponent;

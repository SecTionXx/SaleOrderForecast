/**
 * loadingStateManager.js - Loading State Manager
 * Provides a centralized way to manage loading states and transitions
 * for various components throughout the application
 */

import { createLoadingManager, createTransitionManager, createSectionTransition } from './transitionManager.js';
import { logDebug, logError } from './logger.js';

// Create global loading manager instance
const globalLoadingManager = createLoadingManager({
  defaultLoadingMessage: 'Loading data...',
  defaultErrorMessage: 'An error occurred. Please try again.',
  defaultSuccessMessage: 'Operation completed successfully.',
  animationDuration: 300,
  autoHideDelay: 3000
});

// Create global transition manager instance
let globalTransitionManager = null;

// Initialize transition manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.querySelector('#app');
  
  if (appContainer) {
    globalTransitionManager = createTransitionManager({
      containerSelector: '#app',
      pageClass: 'page',
      activePageClass: 'active',
      transitionDuration: 300,
      defaultTransition: 'fade'
    });
  }
});

/**
 * Manages loading states for API requests
 * @param {Object} options - Configuration options
 * @returns {Object} - API loading state manager methods
 */
export function createApiLoadingManager(options = {}) {
  const {
    containerSelector = null,
    loadingMessage = 'Loading data...',
    errorMessage = 'Failed to load data. Please try again.',
    successMessage = 'Data loaded successfully.',
    showSuccessMessage = false,
    autoHideDelay = 3000
  } = options;
  
  // Track pending requests
  let pendingRequests = 0;
  let containerElement = null;
  
  // Get container element if selector provided
  if (containerSelector) {
    containerElement = document.querySelector(containerSelector);
    
    if (!containerElement) {
      logError('Container element not found:', containerSelector);
    }
  }
  
  /**
   * Start loading state
   * @param {string} message - Custom loading message
   */
  function startLoading(message = loadingMessage) {
    pendingRequests++;
    
    if (containerElement) {
      globalLoadingManager.setLoading(containerElement, true, message);
    }
    
    // Add loading class to body for global loading indicator
    document.body.classList.add('api-loading');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('api-loading-start', {
      detail: { message }
    }));
  }
  
  /**
   * End loading state
   * @param {Object} result - API result (success or error)
   */
  function endLoading(result = {}) {
    pendingRequests = Math.max(0, pendingRequests - 1);
    
    if (pendingRequests === 0) {
      if (containerElement) {
        if (result.error) {
          // Show error message
          const message = result.error.message || errorMessage;
          globalLoadingManager.showError(containerElement, message, true);
        } else if (showSuccessMessage) {
          // Show success message
          const message = result.successMessage || successMessage;
          globalLoadingManager.showSuccess(containerElement, message, true);
        } else {
          // Just hide loading
          globalLoadingManager.setLoading(containerElement, false);
        }
      }
      
      // Remove loading class from body
      document.body.classList.remove('api-loading');
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('api-loading-end', {
        detail: { result }
      }));
    }
  }
  
  /**
   * Wrap API call with loading state
   * @param {Function} apiCall - API call function that returns a Promise
   * @param {Object} options - Options for this specific API call
   * @returns {Promise} - API call result
   */
  async function withLoading(apiCall, options = {}) {
    const {
      loadingMessage: customLoadingMessage = loadingMessage,
      errorMessage: customErrorMessage = errorMessage,
      successMessage: customSuccessMessage = successMessage,
      showSuccessMessage: customShowSuccessMessage = showSuccessMessage,
      skipLoadingState = false
    } = options;
    
    if (!skipLoadingState) {
      startLoading(customLoadingMessage);
    }
    
    try {
      const result = await apiCall();
      
      if (!skipLoadingState) {
        endLoading({
          successMessage: customSuccessMessage,
          showSuccessMessage: customShowSuccessMessage
        });
      }
      
      return result;
    } catch (error) {
      if (!skipLoadingState) {
        endLoading({
          error: {
            message: error.message || customErrorMessage
          }
        });
      }
      
      throw error;
    }
  }
  
  // Return public API
  return {
    startLoading,
    endLoading,
    withLoading,
    
    isPending: () => pendingRequests > 0,
    
    showError: (message) => {
      if (containerElement) {
        globalLoadingManager.showError(containerElement, message, true);
      }
    },
    
    showSuccess: (message) => {
      if (containerElement) {
        globalLoadingManager.showSuccess(containerElement, message, true);
      }
    }
  };
}

/**
 * Creates a button loading state manager
 * @param {HTMLElement} button - Button element
 * @param {Object} options - Configuration options
 * @returns {Object} - Button loading state manager methods
 */
export function createButtonLoadingState(button, options = {}) {
  const {
    loadingText = '',
    resetText = null,
    disableWhileLoading = true
  } = options;
  
  // Store original text
  const originalText = button.textContent;
  let isLoading = false;
  
  /**
   * Set button loading state
   * @param {boolean} loading - Whether button is loading
   */
  function setLoading(loading) {
    isLoading = loading;
    
    if (loading) {
      // Store original text if not already stored
      button.dataset.originalText = button.textContent;
      
      // Set loading state
      button.classList.add('is-loading');
      
      if (loadingText) {
        button.textContent = loadingText;
      }
      
      if (disableWhileLoading) {
        button.disabled = true;
      }
    } else {
      // Remove loading state
      button.classList.remove('is-loading');
      
      // Restore text
      if (resetText !== null) {
        button.textContent = resetText;
      } else if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
      
      if (disableWhileLoading) {
        button.disabled = false;
      }
    }
  }
  
  /**
   * Wrap callback with loading state
   * @param {Function} callback - Callback function
   * @returns {Function} - Wrapped callback
   */
  function withLoading(callback) {
    return async (...args) => {
      if (isLoading) return;
      
      setLoading(true);
      
      try {
        const result = await callback(...args);
        setLoading(false);
        return result;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    };
  }
  
  // Return public API
  return {
    setLoading,
    withLoading,
    
    isLoading: () => isLoading,
    
    reset: () => {
      setLoading(false);
      button.textContent = originalText;
    }
  };
}

/**
 * Creates a form loading state manager
 * @param {HTMLElement} form - Form element
 * @param {Object} options - Configuration options
 * @returns {Object} - Form loading state manager methods
 */
export function createFormLoadingState(form, options = {}) {
  const {
    submitButtonSelector = 'button[type="submit"]',
    disableFieldsWhileLoading = true,
    loadingMessage = 'Submitting...',
    errorMessage = 'Form submission failed. Please try again.',
    successMessage = 'Form submitted successfully.',
    showSuccessMessage = true,
    resetFormOnSuccess = false
  } = options;
  
  // Get submit button
  const submitButton = form.querySelector(submitButtonSelector);
  let buttonLoadingState = null;
  
  if (submitButton) {
    buttonLoadingState = createButtonLoadingState(submitButton, {
      loadingText: 'Submitting...',
      disableWhileLoading: true
    });
  }
  
  // Get form fields
  const formFields = Array.from(form.querySelectorAll('input, select, textarea, button'));
  let isLoading = false;
  
  /**
   * Set form loading state
   * @param {boolean} loading - Whether form is loading
   */
  function setLoading(loading) {
    isLoading = loading;
    
    // Update submit button
    if (buttonLoadingState) {
      buttonLoadingState.setLoading(loading);
    }
    
    // Update form fields
    if (disableFieldsWhileLoading) {
      formFields.forEach(field => {
        if (field !== submitButton) {
          field.disabled = loading;
        }
      });
    }
    
    // Update form class
    if (loading) {
      form.classList.add('is-loading');
    } else {
      form.classList.remove('is-loading');
    }
  }
  
  /**
   * Show form error message
   * @param {string} message - Error message
   */
  function showError(message = errorMessage) {
    // Remove any existing error/success messages
    const existingMessages = form.querySelectorAll('.form-message');
    existingMessages.forEach(el => el.remove());
    
    // Create error message element
    const errorEl = document.createElement('div');
    errorEl.className = 'form-message error-message';
    errorEl.textContent = message;
    
    // Add to form
    form.appendChild(errorEl);
    
    // Add error class to form
    form.classList.add('has-error');
    form.classList.remove('is-success');
    
    // Auto-hide after delay
    setTimeout(() => {
      if (errorEl.parentNode === form) {
        form.removeChild(errorEl);
        form.classList.remove('has-error');
      }
    }, 5000);
  }
  
  /**
   * Show form success message
   * @param {string} message - Success message
   */
  function showSuccess(message = successMessage) {
    // Remove any existing error/success messages
    const existingMessages = form.querySelectorAll('.form-message');
    existingMessages.forEach(el => el.remove());
    
    // Create success message element
    const successEl = document.createElement('div');
    successEl.className = 'form-message success-message';
    successEl.textContent = message;
    
    // Add to form
    form.appendChild(successEl);
    
    // Add success class to form
    form.classList.add('is-success');
    form.classList.remove('has-error');
    
    // Reset form if configured
    if (resetFormOnSuccess) {
      form.reset();
    }
    
    // Auto-hide after delay
    setTimeout(() => {
      if (successEl.parentNode === form) {
        form.removeChild(successEl);
        form.classList.remove('is-success');
      }
    }, 5000);
  }
  
  /**
   * Wrap form submission with loading state
   * @param {Function} submitFn - Form submission function
   * @returns {Function} - Wrapped submission function
   */
  function withLoading(submitFn) {
    return async (event) => {
      if (isLoading) return;
      
      // Prevent default form submission
      if (event) {
        event.preventDefault();
      }
      
      setLoading(true);
      
      try {
        const result = await submitFn(event);
        setLoading(false);
        
        // Show success message
        if (showSuccessMessage) {
          showSuccess();
        }
        
        return result;
      } catch (error) {
        setLoading(false);
        
        // Show error message
        showError(error.message || errorMessage);
        
        throw error;
      }
    };
  }
  
  // Return public API
  return {
    setLoading,
    showError,
    showSuccess,
    withLoading,
    
    isLoading: () => isLoading,
    
    reset: () => {
      setLoading(false);
      form.reset();
      
      // Remove any existing messages
      const existingMessages = form.querySelectorAll('.form-message');
      existingMessages.forEach(el => el.remove());
      
      // Remove status classes
      form.classList.remove('has-error', 'is-success');
    }
  };
}

// Export global instances and factory functions
export {
  globalLoadingManager,
  globalTransitionManager,
  createLoadingManager,
  createTransitionManager,
  createSectionTransition
};

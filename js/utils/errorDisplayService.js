/**
 * errorDisplayService.js - Centralized Error Display Service
 * Provides standardized error display functionality for the application
 */

import { ERROR_TYPES, ERROR_SEVERITY } from './errorHandler.js';
import { logError } from './logger.js';

// Default display duration in milliseconds
const DEFAULT_DISPLAY_DURATION = 10000;

/**
 * Display an error message to the user
 * @param {Object|Error|string} error - The error to display
 * @param {number} duration - How long to display the error (ms)
 */
export function showUserFriendlyError(error, duration = DEFAULT_DISPLAY_DURATION) {
  const errorContainer = document.getElementById('error-message-area');
  if (!errorContainer) {
    logError('Error container not found in DOM');
    console.error('Error:', error);
    return;
  }
  
  let message = '';
  let type = ERROR_TYPES.UNKNOWN;
  let severity = ERROR_SEVERITY.ERROR;
  
  // Extract error information based on error type
  if (error.type && error.message) {
    // AppError or similar structured error
    message = error.message;
    type = error.type;
    severity = error.severity || ERROR_SEVERITY.ERROR;
  } else if (error instanceof Error) {
    // Standard Error object
    message = error.message;
  } else if (typeof error === 'string') {
    // String error message
    message = error;
  } else if (error && typeof error === 'object') {
    // Object with error details
    message = error.message || 'An unknown error occurred';
    type = error.type || ERROR_TYPES.UNKNOWN;
    severity = error.severity || ERROR_SEVERITY.ERROR;
  } else {
    // Fallback for other error types
    message = 'An unknown error occurred';
  }
  
  // Create error element
  const errorElement = document.createElement('div');
  errorElement.className = `error-message ${type} ${severity}`;
  errorElement.innerHTML = `
    <div class="error-icon">
      <i data-feather="${getSeverityIcon(severity)}"></i>
    </div>
    <div class="error-content">
      <div class="error-title">${getErrorTitle(type, severity)}</div>
      <div class="error-message-text">${message}</div>
    </div>
    <button class="error-close">&times;</button>
  `;
  
  // Add to container
  errorContainer.appendChild(errorElement);
  
  // Initialize feather icons for the new element
  if (window.feather && typeof window.feather.replace === "function") {
    window.feather.replace();
  }
  
  // Auto-dismiss after specified duration
  const dismissTimeout = setTimeout(() => {
    fadeOutAndRemove(errorElement, errorContainer);
  }, duration);
  
  // Close button functionality
  const closeButton = errorElement.querySelector('.error-close');
  closeButton.addEventListener('click', () => {
    clearTimeout(dismissTimeout);
    fadeOutAndRemove(errorElement, errorContainer);
  });
  
  // Log the error
  logError('User-facing error displayed:', { message, type, severity });
}

/**
 * Fade out and remove an element
 * @param {HTMLElement} element - Element to remove
 * @param {HTMLElement} container - Parent container
 */
function fadeOutAndRemove(element, container) {
  element.classList.add('fade-out');
  setTimeout(() => {
    if (container.contains(element)) {
      container.removeChild(element);
    }
  }, 500); // Match this to the CSS transition duration
}

/**
 * Get appropriate icon for error severity
 * @param {string} severity - Error severity
 * @returns {string} - Feather icon name
 */
function getSeverityIcon(severity) {
  switch (severity) {
    case ERROR_SEVERITY.INFO:
      return 'info';
    case ERROR_SEVERITY.WARNING:
      return 'alert-triangle';
    case ERROR_SEVERITY.CRITICAL:
      return 'alert-octagon';
    case ERROR_SEVERITY.ERROR:
    default:
      return 'alert-circle';
  }
}

/**
 * Get user-friendly error title based on type and severity
 * @param {string} type - Error type
 * @param {string} severity - Error severity
 * @returns {string} - User-friendly error title
 */
function getErrorTitle(type, severity) {
  // First check severity
  switch (severity) {
    case ERROR_SEVERITY.INFO:
      return 'Information';
    case ERROR_SEVERITY.WARNING:
      return 'Warning';
    case ERROR_SEVERITY.CRITICAL:
      return 'Critical Error';
    case ERROR_SEVERITY.ERROR:
    default:
      // If severity is ERROR, use type for more specific title
      switch (type) {
        case ERROR_TYPES.NETWORK:
          return 'Network Error';
        case ERROR_TYPES.API:
          return 'API Error';
        case ERROR_TYPES.AUTHENTICATION:
          return 'Authentication Error';
        case ERROR_TYPES.VALIDATION:
          return 'Validation Error';
        case ERROR_TYPES.PERMISSION:
          return 'Permission Error';
        case ERROR_TYPES.NOT_FOUND:
          return 'Not Found Error';
        case ERROR_TYPES.TIMEOUT:
          return 'Timeout Error';
        default:
          return 'Error';
      }
  }
}

/**
 * Show a success message to the user
 * @param {string} message - Success message
 * @param {number} duration - How long to display the message (ms)
 */
export function showSuccessMessage(message, duration = 5000) {
  const errorContainer = document.getElementById('error-message-area');
  if (!errorContainer) return;
  
  const successElement = document.createElement('div');
  successElement.className = 'error-message success';
  successElement.innerHTML = `
    <div class="error-icon">
      <i data-feather="check-circle"></i>
    </div>
    <div class="error-content">
      <div class="error-title">Success</div>
      <div class="error-message-text">${message}</div>
    </div>
    <button class="error-close">&times;</button>
  `;
  
  // Add to container
  errorContainer.appendChild(successElement);
  
  // Initialize feather icons for the new element
  if (window.feather && typeof window.feather.replace === "function") {
    window.feather.replace();
  }
  
  // Auto-dismiss after specified duration
  const dismissTimeout = setTimeout(() => {
    fadeOutAndRemove(successElement, errorContainer);
  }, duration);
  
  // Close button functionality
  const closeButton = successElement.querySelector('.error-close');
  closeButton.addEventListener('click', () => {
    clearTimeout(dismissTimeout);
    fadeOutAndRemove(successElement, errorContainer);
  });
}

/**
 * Clear all displayed error messages
 */
export function clearErrorMessages() {
  const errorContainer = document.getElementById('error-message-area');
  if (!errorContainer) return;
  
  // Remove all child elements
  while (errorContainer.firstChild) {
    errorContainer.removeChild(errorContainer.firstChild);
  }
}

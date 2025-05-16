/**
 * uiHelpers.js - UI Helper Functions
 * Common UI utilities used throughout the application
 */

import { logError } from './logger.js';

/**
 * Show or hide the loading indicator
 * @param {boolean} show - Whether to show or hide the indicator
 */
function showLoadingIndicator(show) {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Display an error message to the user
 * @param {string} message - The error message to display
 * @param {number} duration - How long to show the message in milliseconds
 */
function displayErrorMessage(message, duration = 5000) {
  logError(message);
  
  const errorArea = document.getElementById('error-message-area');
  if (!errorArea) return;
  
  // Create error element
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.innerHTML = `
    <div class="error-content">
      <div class="error-icon">
        <i data-feather="alert-circle"></i>
      </div>
      <div class="error-text">${message}</div>
      <button class="error-close">&times;</button>
    </div>
  `;
  
  // Add to error area
  errorArea.appendChild(errorElement);
  
  // Replace feather icons
  if (window.feather) {
    feather.replace();
  }
  
  // Add close button functionality
  const closeButton = errorElement.querySelector('.error-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      errorElement.classList.add('fade-out');
      setTimeout(() => {
        errorArea.removeChild(errorElement);
      }, 300);
    });
  }
  
  // Auto-remove after duration
  setTimeout(() => {
    if (errorElement.parentNode === errorArea) {
      errorElement.classList.add('fade-out');
      setTimeout(() => {
        if (errorElement.parentNode === errorArea) {
          errorArea.removeChild(errorElement);
        }
      }, 300);
    }
  }, duration);
}

/**
 * Update the last refresh time indicator
 */
function updateLastRefreshTime() {
  const lastRefreshElement = document.getElementById('last-refresh-time');
  if (lastRefreshElement) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    lastRefreshElement.textContent = timeString;
  }
}

/**
 * Format a date for display
 * @param {string|Date} dateValue - The date to format
 * @param {string} format - The format to use (short, medium, long)
 * @returns {string} - The formatted date string
 */
function formatDate(dateValue, format = 'medium') {
  if (!dateValue) return '-';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'time':
        return date.toLocaleTimeString();
      case 'datetime':
        return date.toLocaleString();
      case 'medium':
      default:
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format a currency value for display
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (USD, EUR, etc.)
 * @returns {string} - The formatted currency string
 */
function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${value.toLocaleString()}`;
  }
}

/**
 * Format a percentage value for display
 * @param {number} value - The value to format (0-1)
 * @returns {string} - The formatted percentage string
 */
function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  try {
    // Convert to percentage if value is between 0-1
    const percentValue = value > 0 && value < 1 ? value * 100 : value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 1
    }).format(percentValue / 100);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${value}%`;
  }
}

// Export functions
export {
  showLoadingIndicator,
  displayErrorMessage,
  updateLastRefreshTime,
  formatDate,
  formatCurrency,
  formatPercentage
};

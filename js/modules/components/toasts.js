/**
 * Toast Notifications Component
 * Provides a simple toast notification system for user feedback
 */

import { createElement, toggleClass } from '../utils/domUtils.js';
import { logDebug } from '../utils/logger.js';

// Toast container element
let toastContainer = null;

// Default toast options
const DEFAULT_OPTIONS = {
  type: 'info',     // 'info', 'success', 'warning', 'error'
  duration: 5000,  // Auto-dismiss after (ms), 0 = persistent
  position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  closeable: true,
  action: null,    // { text: string, handler: Function }
  className: ''   // Additional CSS classes
};

// Toast type icons (using Material Icons)
const TYPE_ICONS = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error'
};

// Toast type classes
const TYPE_CLASSES = {
  info: 'toast-info',
  success: 'toast-success',
  warning: 'toast-warning',
  error: 'toast-error'
};

/**
 * Initialize the toast container
 * @private
 */
function initContainer() {
  if (toastContainer) return;
  
  toastContainer = createElement('div', {
    id: 'toast-container',
    class: 'toast-container',
    'aria-live': 'polite',
    'aria-atomic': 'true'
  });
  
  document.body.appendChild(toastContainer);
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {Object} [options] - Toast options
 * @returns {Function} Function to dismiss the toast
 */
export function showToast(message, options = {}) {
  // Initialize container if needed
  initContainer();
  
  // Merge options with defaults
  const toastOptions = { ...DEFAULT_OPTIONS, ...options };
  const { type, duration, closeable, action, className, position } = toastOptions;
  
  logDebug(`Showing ${type} toast: ${message}`);
  
  // Create toast element
  const toast = createElement('div', {
    class: `toast ${TYPE_CLASSES[type] || ''} ${className}`.trim(),
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true'
  });
  
  // Create toast content
  const toastContent = createElement('div', { class: 'toast-content' });
  
  // Add icon if available
  if (TYPE_ICONS[type]) {
    const icon = createElement('span', { 
      class: 'toast-icon material-icons',
      'aria-hidden': 'true'
    }, TYPE_ICONS[type]);
    
    toastContent.appendChild(icon);
  }
  
  // Add message
  const messageEl = createElement('div', { class: 'toast-message' }, message);
  toastContent.appendChild(messageEl);
  
  // Add action button if provided
  if (action && action.text) {
    const actionButton = createElement('button', {
      type: 'button',
      class: 'toast-action',
      'aria-label': action.ariaLabel || action.text,
      onclick: (e) => {
        e.stopPropagation();
        if (typeof action.handler === 'function') {
          action.handler();
        }
        dismissToast(toast);
      }
    }, action.text);
    
    toastContent.appendChild(actionButton);
  }
  
  // Add close button if closeable
  if (closeable) {
    const closeButton = createElement('button', {
      type: 'button',
      class: 'toast-close',
      'aria-label': 'Dismiss notification',
      onclick: () => dismissToast(toast)
    }, '×');
    
    toastContent.appendChild(closeButton);
  }
  
  toast.appendChild(toastContent);
  
  // Add to container with position class
  toastContainer.classList.add(`toast-${position}`);
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto-dismiss if duration is set
  let dismissTimeout;
  if (duration > 0) {
    dismissTimeout = setTimeout(() => {
      dismissToast(toast);
    }, duration);
  }
  
  // Return dismiss function
  return () => {
    if (dismissTimeout) clearTimeout(dismissTimeout);
    dismissToast(toast);
  };
}

/**
 * Dismiss a toast
 * @param {HTMLElement} toast - The toast element to dismiss
 * @private
 */
function dismissToast(toast) {
  if (!toast) return;
  
  // Start exit animation
  toast.classList.remove('show');
  toast.classList.add('hiding');
  
  // Remove after animation completes
  const onAnimationEnd = () => {
    if (toast && toast.parentNode) {
      toast.removeEventListener('animationend', onAnimationEnd);
      toast.parentNode.removeChild(toast);
    }
  };
  
  toast.addEventListener('animationend', onAnimationEnd);
  
  // Fallback in case animation events don't fire
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.removeEventListener('animationend', onAnimationEnd);
      toast.parentNode.removeChild(toast);
    }
  }, 500);
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
  if (!toastContainer) return;
  
  const toasts = toastContainer.querySelectorAll('.toast');
  toasts.forEach(toast => {
    dismissToast(toast);
  });
}

// Convenience methods for different toast types
export const toast = {
  info: (message, options) => showToast(message, { ...options, type: 'info' }),
  success: (message, options) => showToast(message, { ...options, type: 'success' }),
  warning: (message, options) => showToast(message, { ...options, type: 'warning' }),
  error: (message, options) => showToast(message, { ...options, type: 'error' }),
  dismissAll: clearAllToasts
};

// For debugging
if (typeof window !== 'undefined') {
  window.toast = toast;
}

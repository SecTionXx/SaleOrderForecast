/**
 * toast.js - Toast Notification Component
 * Provides a standardized toast notification system for displaying messages
 */

import { logDebug } from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

class Toast {
  /**
   * Create a toast notification system
   * @param {Object} options - Toast configuration options
   */
  constructor(options = {}) {
    this.options = {
      position: options.position || 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
      maxToasts: options.maxToasts || 5,
      duration: options.duration || 5000, // milliseconds
      pauseOnHover: options.pauseOnHover !== false,
      dismissible: options.dismissible !== false,
      animation: options.animation || 'fade', // fade, slide, none
      containerClassName: options.containerClassName || '',
      toastClassName: options.toastClassName || '',
      zIndex: options.zIndex || 9999,
      offset: options.offset || 16, // pixels
      gap: options.gap || 8, // pixels between toasts
      escapeHTML: options.escapeHTML !== false,
      closeIcon: options.closeIcon || '×',
      showIcon: options.showIcon !== false,
      rtl: options.rtl || false,
      newestOnTop: options.newestOnTop !== false
    };
    
    this.container = null;
    this.toasts = [];
    this.pausedToasts = new Set();
    
    // Create container
    this._createContainer();
  }
  
  /**
   * Create the toast container
   * @private
   */
  _createContainer() {
    // Check if container already exists
    const existingContainer = document.querySelector('.toast-container');
    if (existingContainer) {
      this.container = existingContainer;
      return;
    }
    
    // Create container
    this.container = document.createElement('div');
    this.container.className = `toast-container toast-${this.options.position} ${this.options.containerClassName}`;
    this.container.setAttribute('role', 'alert');
    this.container.setAttribute('aria-live', 'polite');
    this.container.style.zIndex = this.options.zIndex;
    
    // Set position
    this.container.style.position = 'fixed';
    
    switch (this.options.position) {
      case 'top-right':
        this.container.style.top = `${this.options.offset}px`;
        this.container.style.right = `${this.options.offset}px`;
        break;
      case 'top-left':
        this.container.style.top = `${this.options.offset}px`;
        this.container.style.left = `${this.options.offset}px`;
        break;
      case 'bottom-right':
        this.container.style.bottom = `${this.options.offset}px`;
        this.container.style.right = `${this.options.offset}px`;
        break;
      case 'bottom-left':
        this.container.style.bottom = `${this.options.offset}px`;
        this.container.style.left = `${this.options.offset}px`;
        break;
      case 'top-center':
        this.container.style.top = `${this.options.offset}px`;
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-center':
        this.container.style.bottom = `${this.options.offset}px`;
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
    }
    
    // Set RTL
    if (this.options.rtl) {
      this.container.style.direction = 'rtl';
    }
    
    // Append to body
    document.body.appendChild(this.container);
  }
  
  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @returns {Object} - Toast object with ID
   */
  show(options = {}) {
    // Merge options
    const toastOptions = {
      ...this.options,
      ...options,
      id: options.id || `toast-${generateId()}`,
      type: options.type || 'default', // default, success, error, warning, info
      title: options.title || '',
      message: options.message || '',
      duration: options.duration !== undefined ? options.duration : this.options.duration,
      dismissible: options.dismissible !== undefined ? options.dismissible : this.options.dismissible,
      onClose: options.onClose || null,
      onClick: options.onClick || null,
      data: options.data || null
    };
    
    logDebug('Toast', `Showing toast: ${toastOptions.id}`, toastOptions);
    
    // Check if we need to remove old toasts
    if (this.toasts.length >= this.options.maxToasts) {
      const oldestToast = this.options.newestOnTop ? this.toasts[this.toasts.length - 1] : this.toasts[0];
      this._removeToast(oldestToast.id);
    }
    
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.id = toastOptions.id;
    toastElement.className = `toast toast-${toastOptions.type} ${toastOptions.toastClassName}`;
    toastElement.setAttribute('role', 'status');
    toastElement.style.marginBottom = `${this.options.gap}px`;
    
    // Add animation class
    if (toastOptions.animation !== 'none') {
      toastElement.classList.add(`toast-${toastOptions.animation}`);
    }
    
    // Create toast content
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    // Add icon if needed
    if (toastOptions.showIcon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'toast-icon';
      
      // Set icon based on type
      switch (toastOptions.type) {
        case 'success':
          iconElement.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          break;
        case 'error':
          iconElement.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
          break;
        case 'warning':
          iconElement.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
          break;
        case 'info':
          iconElement.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
          break;
        default:
          iconElement.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      }
      
      toastContent.appendChild(iconElement);
    }
    
    // Create text container
    const textContainer = document.createElement('div');
    textContainer.className = 'toast-text';
    
    // Add title if provided
    if (toastOptions.title) {
      const titleElement = document.createElement('div');
      titleElement.className = 'toast-title';
      
      if (toastOptions.escapeHTML) {
        titleElement.textContent = toastOptions.title;
      } else {
        titleElement.innerHTML = toastOptions.title;
      }
      
      textContainer.appendChild(titleElement);
    }
    
    // Add message
    const messageElement = document.createElement('div');
    messageElement.className = 'toast-message';
    
    if (toastOptions.escapeHTML) {
      messageElement.textContent = toastOptions.message;
    } else {
      messageElement.innerHTML = toastOptions.message;
    }
    
    textContainer.appendChild(messageElement);
    toastContent.appendChild(textContainer);
    
    // Add close button if dismissible
    if (toastOptions.dismissible) {
      const closeButton = document.createElement('button');
      closeButton.className = 'toast-close';
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.innerHTML = toastOptions.closeIcon;
      
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._removeToast(toastOptions.id);
      });
      
      toastElement.appendChild(closeButton);
    }
    
    // Add content to toast
    toastElement.appendChild(toastContent);
    
    // Add progress bar if duration > 0
    if (toastOptions.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'toast-progress';
      progressBar.style.animationDuration = `${toastOptions.duration}ms`;
      
      toastElement.appendChild(progressBar);
    }
    
    // Add click handler
    if (typeof toastOptions.onClick === 'function') {
      toastElement.addEventListener('click', (e) => {
        if (e.target.closest('.toast-close')) return;
        toastOptions.onClick(e, toastOptions);
      });
      
      toastElement.style.cursor = 'pointer';
    }
    
    // Add hover handlers if pauseOnHover
    if (toastOptions.pauseOnHover && toastOptions.duration > 0) {
      toastElement.addEventListener('mouseenter', () => {
        this._pauseToast(toastOptions.id);
      });
      
      toastElement.addEventListener('mouseleave', () => {
        this._resumeToast(toastOptions.id);
      });
    }
    
    // Add to container
    if (this.options.newestOnTop) {
      this.container.insertBefore(toastElement, this.container.firstChild);
    } else {
      this.container.appendChild(toastElement);
    }
    
    // Store toast
    const toast = {
      id: toastOptions.id,
      element: toastElement,
      options: toastOptions,
      timeoutId: null
    };
    
    this.toasts.push(toast);
    
    // Set timeout to remove toast
    if (toastOptions.duration > 0) {
      toast.timeoutId = setTimeout(() => {
        this._removeToast(toastOptions.id);
      }, toastOptions.duration);
    }
    
    return {
      id: toastOptions.id,
      close: () => this._removeToast(toastOptions.id)
    };
  }
  
  /**
   * Show a success toast
   * @param {string|Object} message - Toast message or options
   * @param {string} title - Toast title
   * @param {Object} options - Toast options
   * @returns {Object} - Toast object with ID
   */
  success(message, title = '', options = {}) {
    if (typeof message === 'object') {
      return this.show({
        ...message,
        type: 'success'
      });
    }
    
    return this.show({
      ...options,
      type: 'success',
      message,
      title
    });
  }
  
  /**
   * Show an error toast
   * @param {string|Object} message - Toast message or options
   * @param {string} title - Toast title
   * @param {Object} options - Toast options
   * @returns {Object} - Toast object with ID
   */
  error(message, title = '', options = {}) {
    if (typeof message === 'object') {
      return this.show({
        ...message,
        type: 'error'
      });
    }
    
    return this.show({
      ...options,
      type: 'error',
      message,
      title
    });
  }
  
  /**
   * Show a warning toast
   * @param {string|Object} message - Toast message or options
   * @param {string} title - Toast title
   * @param {Object} options - Toast options
   * @returns {Object} - Toast object with ID
   */
  warning(message, title = '', options = {}) {
    if (typeof message === 'object') {
      return this.show({
        ...message,
        type: 'warning'
      });
    }
    
    return this.show({
      ...options,
      type: 'warning',
      message,
      title
    });
  }
  
  /**
   * Show an info toast
   * @param {string|Object} message - Toast message or options
   * @param {string} title - Toast title
   * @param {Object} options - Toast options
   * @returns {Object} - Toast object with ID
   */
  info(message, title = '', options = {}) {
    if (typeof message === 'object') {
      return this.show({
        ...message,
        type: 'info'
      });
    }
    
    return this.show({
      ...options,
      type: 'info',
      message,
      title
    });
  }
  
  /**
   * Remove a toast
   * @param {string} id - Toast ID
   * @private
   */
  _removeToast(id) {
    const toastIndex = this.toasts.findIndex(toast => toast.id === id);
    
    if (toastIndex === -1) return;
    
    const toast = this.toasts[toastIndex];
    
    // Clear timeout
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
    
    // Remove from paused set
    this.pausedToasts.delete(id);
    
    // Add removing class
    toast.element.classList.add('toast-removing');
    
    // Remove after animation
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      
      // Call onClose callback
      if (typeof toast.options.onClose === 'function') {
        toast.options.onClose(toast.options);
      }
      
      // Remove from array
      this.toasts.splice(toastIndex, 1);
    }, 300); // Animation duration
  }
  
  /**
   * Pause a toast's timeout
   * @param {string} id - Toast ID
   * @private
   */
  _pauseToast(id) {
    const toast = this.toasts.find(t => t.id === id);
    
    if (!toast || !toast.timeoutId) return;
    
    // Clear timeout
    clearTimeout(toast.timeoutId);
    toast.timeoutId = null;
    
    // Add to paused set
    this.pausedToasts.add(id);
    
    // Pause progress bar animation
    const progressBar = toast.element.querySelector('.toast-progress');
    if (progressBar) {
      progressBar.style.animationPlayState = 'paused';
    }
  }
  
  /**
   * Resume a toast's timeout
   * @param {string} id - Toast ID
   * @private
   */
  _resumeToast(id) {
    const toast = this.toasts.find(t => t.id === id);
    
    if (!toast || !this.pausedToasts.has(id)) return;
    
    // Remove from paused set
    this.pausedToasts.delete(id);
    
    // Calculate remaining time
    const progressBar = toast.element.querySelector('.toast-progress');
    let remainingTime = toast.options.duration;
    
    if (progressBar) {
      const computedStyle = window.getComputedStyle(progressBar);
      const animationPlayState = computedStyle.getPropertyValue('animation-play-state');
      
      if (animationPlayState === 'paused') {
        // Resume progress bar animation
        progressBar.style.animationPlayState = 'running';
        
        // Calculate remaining time based on progress
        const width = parseFloat(computedStyle.getPropertyValue('width'));
        const totalWidth = parseFloat(computedStyle.getPropertyValue('width'));
        remainingTime = toast.options.duration * (1 - (width / totalWidth));
      }
    }
    
    // Set new timeout
    toast.timeoutId = setTimeout(() => {
      this._removeToast(id);
    }, remainingTime);
  }
  
  /**
   * Close a specific toast
   * @param {string} id - Toast ID
   */
  close(id) {
    this._removeToast(id);
  }
  
  /**
   * Close all toasts
   */
  closeAll() {
    this.toasts.slice().forEach(toast => {
      this._removeToast(toast.id);
    });
  }
  
  /**
   * Update toast container position
   * @param {string} position - New position
   */
  updatePosition(position) {
    if (!this.container) return;
    
    // Remove old position class
    this.container.classList.remove(`toast-${this.options.position}`);
    
    // Add new position class
    this.container.classList.add(`toast-${position}`);
    
    // Update position styles
    this.container.style.top = null;
    this.container.style.right = null;
    this.container.style.bottom = null;
    this.container.style.left = null;
    this.container.style.transform = null;
    
    switch (position) {
      case 'top-right':
        this.container.style.top = `${this.options.offset}px`;
        this.container.style.right = `${this.options.offset}px`;
        break;
      case 'top-left':
        this.container.style.top = `${this.options.offset}px`;
        this.container.style.left = `${this.options.offset}px`;
        break;
      case 'bottom-right':
        this.container.style.bottom = `${this.options.offset}px`;
        this.container.style.right = `${this.options.offset}px`;
        break;
      case 'bottom-left':
        this.container.style.bottom = `${this.options.offset}px`;
        this.container.style.left = `${this.options.offset}px`;
        break;
      case 'top-center':
        this.container.style.top = `${this.options.offset}px`;
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-center':
        this.container.style.bottom = `${this.options.offset}px`;
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        break;
    }
    
    // Update options
    this.options.position = position;
  }
}

// Create singleton instance
const toast = new Toast();

export default toast;

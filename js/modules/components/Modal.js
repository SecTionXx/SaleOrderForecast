/**
 * Modal Component
 * A reusable modal dialog component
 */

import { BaseComponent } from './base/BaseComponent.js';
import { logDebug } from '../utils/logger.js';

/**
 * Modal component that extends BaseComponent
 */
export class Modal extends BaseComponent {
  /**
   * Create a new Modal
   * @param {Object} options - Modal options
   * @param {string} [options.title] - Modal title
   * @param {HTMLElement|string} [options.content] - Modal content (can be HTML string or element)
   * @param {string} [options.size] - Modal size (sm, md, lg, xl, fullscreen)
   * @param {boolean} [options.backdrop] - Whether to show a backdrop
   * @param {boolean} [options.keyboard] - Whether to close on ESC key
   * @param {boolean} [options.showCloseButton] - Whether to show the close button
   * @param {Function} [options.onClose] - Callback when modal is closed
   * @param {Function} [options.onShow] - Callback when modal is shown
   * @param {string} [options.className] - Additional CSS classes
   * @param {Object} [options.buttons] - Buttons to add to the footer
   */
  constructor({
    title = '',
    content = '',
    size = 'md',
    backdrop = true,
    keyboard = true,
    showCloseButton = true,
    onClose = null,
    onShow = null,
    className = '',
    buttons = [],
    ...rest
  } = {}) {
    super({
      className: `modal ${className}`.trim(),
      attributes: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-hidden': 'true',
        'aria-labelledby': 'modal-title',
        tabindex: '-1',
        ...rest.attributes
      },
      ...rest
    });
    
    this.title = title;
    this.content = content;
    this.size = size;
    this.backdrop = backdrop;
    this.keyboard = keyboard;
    this.showCloseButton = showCloseButton;
    this.onClose = onClose;
    this.onShow = onShow;
    this.buttons = buttons;
    this.isOpen = false;
    this.focusableElements = [];
    this.lastFocusedElement = null;
    
    // Create modal elements
    this.createModal();
    
    // Initialize the modal
    this.initialize();
  }
  
  /**
   * Create the modal structure
   */
  createModal() {
    // Create modal dialog
    this.dialog = document.createElement('div');
    this.dialog.className = `modal-dialog modal-${this.size}`;
    this.dialog.setAttribute('role', 'document');
    
    // Create modal content
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'modal-content';
    
    // Create modal header
    this.header = document.createElement('div');
    this.header.className = 'modal-header';
    
    // Create title
    this.titleElement = document.createElement('h5');
    this.titleElement.id = 'modal-title';
    this.titleElement.className = 'modal-title';
    this.titleElement.textContent = this.title;
    
    // Create close button
    if (this.showCloseButton) {
      this.closeButton = document.createElement('button');
      this.closeButton.type = 'button';
      this.closeButton.className = 'btn-close';
      this.closeButton.setAttribute('aria-label', 'Close');
      this.closeButton.setAttribute('data-dismiss', 'modal');
      
      // Add close icon (using text as fallback for Material Icons)
      const closeIcon = document.createElement('span');
      closeIcon.className = 'material-icons';
      closeIcon.textContent = 'close';
      closeIcon.setAttribute('aria-hidden', 'true');
      this.closeButton.appendChild(closeIcon);
    }
    
    // Create body
    this.body = document.createElement('div');
    this.body.className = 'modal-body';
    
    // Set content
    if (typeof this.content === 'string') {
      this.body.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      this.body.appendChild(this.content);
    }
    
    // Create footer if there are buttons
    if (this.buttons && this.buttons.length > 0) {
      this.footer = document.createElement('div');
      this.footer.className = 'modal-footer';
      
      this.buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-${button.variant || 'secondary'}`;
        btn.textContent = button.text;
        
        if (button.onClick) {
          btn.addEventListener('click', (e) => {
            button.onClick(e, this);
          });
        }
        
        if (button.closeOnClick !== false) {
          btn.addEventListener('click', () => this.hide());
        }
        
        this.footer.appendChild(btn);
      });
    }
    
    // Assemble the modal
    this.header.appendChild(this.titleElement);
    if (this.showCloseButton) {
      this.header.appendChild(this.closeButton);
    }
    
    this.contentElement.appendChild(this.header);
    this.contentElement.appendChild(this.body);
    
    if (this.footer) {
      this.contentElement.appendChild(this.footer);
    }
    
    this.dialog.appendChild(this.contentElement);
    this.element.appendChild(this.dialog);
    
    // Create backdrop if needed
    if (this.backdrop) {
      this.backdropElement = document.createElement('div');
      this.backdropElement.className = 'modal-backdrop';
      this.backdropElement.setAttribute('aria-hidden', 'true');
    }
  }
  
  /**
   * Initialize the modal
   */
  initialize() {
    // Add event listeners
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.hide());
    }
    
    // Close modal when clicking on backdrop
    if (this.backdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
      
      // Also close when clicking on backdrop element
      if (this.backdropElement) {
        this.backdropElement.addEventListener('click', () => this.hide());
      }
    }
    
    // Handle keyboard events
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape' && this.keyboard) {
        e.preventDefault();
        this.hide();
      } else if (e.key === 'Tab') {
        this.handleTabKey(e);
      }
    };
    
    // Add to body
    document.body.appendChild(this.element);
    if (this.backdrop) {
      document.body.appendChild(this.backdropElement);
    }
    
    // Set initial state
    this.element.style.display = 'none';
    if (this.backdropElement) {
      this.backdropElement.style.display = 'none';
    }
  }
  
  /**
   * Handle tab key for keyboard navigation
   * @param {KeyboardEvent} e - The keydown event
   */
  handleTabKey(e) {
    // Get all focusable elements in the modal
    this.focusableElements = Array.from(
      this.element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    
    // If only one focusable element, keep focus there
    if (e.target === firstElement && e.shiftKey) {
      e.preventDefault();
      lastElement.focus();
    } else if (e.target === lastElement && !e.shiftKey) {
      e.preventDefault();
      firstElement.focus();
    }
  }
  
  /**
   * Show the modal
   */
  show() {
    if (this.isOpen) return;
    
    // Store the currently focused element
    this.lastFocusedElement = document.activeElement;
    
    // Show the modal and backdrop
    this.element.style.display = 'block';
    this.element.setAttribute('aria-hidden', 'false');
    
    if (this.backdropElement) {
      this.backdropElement.style.display = 'block';
    }
    
    // Add classes for animation
    setTimeout(() => {
      this.element.classList.add('show');
      if (this.backdropElement) {
        this.backdropElement.classList.add('show');
      }
    }, 10);
    
    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Set focus to the modal
    this.element.focus();
    
    // Update state
    this.isOpen = true;
    
    // Call onShow callback
    if (typeof this.onShow === 'function') {
      this.onShow(this);
    }
    
    logDebug('Modal shown');
  }
  
  /**
   * Hide the modal
   */
  hide() {
    if (!this.isOpen) return;
    
    // Remove show class for animation
    this.element.classList.remove('show');
    if (this.backdropElement) {
      this.backdropElement.classList.remove('show');
    }
    
    // Wait for animation to complete before hiding
    const transitionEnd = () => {
      this.element.style.display = 'none';
      this.element.setAttribute('aria-hidden', 'true');
      
      if (this.backdropElement) {
        this.backdropElement.style.display = 'none';
      }
      
      // Remove event listeners
      document.removeEventListener('keydown', this.handleKeyDown);
      
      // Restore focus to the last focused element
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
      }
      
      // Call onClose callback
      if (typeof this.onClose === 'function') {
        this.onClose(this);
      }
      
      logDebug('Modal hidden');
      
      // Remove the transition end listener
      this.element.removeEventListener('transitionend', transitionEnd);
    };
    
    this.element.addEventListener('transitionend', transitionEnd, { once: true });
    
    // Update state
    this.isOpen = false;
  }
  
  /**
   * Toggle the modal
   * @param {boolean} [force] - Force show or hide
   */
  toggle(force) {
    if (typeof force === 'boolean') {
      force ? this.show() : this.hide();
    } else {
      this.isOpen ? this.hide() : this.show();
    }
  }
  
  /**
   * Set the modal title
   * @param {string} title - New title
   */
  setTitle(title) {
    this.title = title;
    this.titleElement.textContent = title;
  }
  
  /**
   * Set the modal content
   * @param {HTMLElement|string} content - New content
   */
  setContent(content) {
    this.content = content;
    this.body.innerHTML = '';
    
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.body.appendChild(content);
    }
  }
  
  /**
   * Add a button to the modal footer
   * @param {Object} button - Button configuration
   * @param {string} button.text - Button text
   * @param {string} [button.variant] - Button variant (primary, secondary, etc.)
   * @param {Function} [button.onClick] - Click handler
   * @param {boolean} [button.closeOnClick] - Whether to close the modal when clicked
   */
  addButton(button) {
    if (!this.footer) {
      this.footer = document.createElement('div');
      this.footer.className = 'modal-footer';
      this.contentElement.appendChild(this.footer);
    }
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-${button.variant || 'secondary'}`;
    btn.textContent = button.text;
    
    if (button.onClick) {
      btn.addEventListener('click', (e) => {
        button.onClick(e, this);
      });
    }
    
    if (button.closeOnClick !== false) {
      btn.addEventListener('click', () => this.hide());
    }
    
    this.footer.appendChild(btn);
    return btn;
  }
  
  /**
   * Clean up the modal
   */
  destroy() {
    // Hide the modal if it's open
    if (this.isOpen) {
      this.hide();
    }
    
    // Remove event listeners
    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.hide);
    }
    
    // Remove elements from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    if (this.backdropElement && this.backdropElement.parentNode) {
      this.backdropElement.parentNode.removeChild(this.backdropElement);
    }
    
    // Call parent destroy
    super.destroy();
  }
}

// Export a convenience function to create modals
export function createModal(options) {
  return new Modal(options);
}

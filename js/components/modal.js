/**
 * modal.js - Reusable Modal Component
 * Provides a standardized modal dialog implementation with various options
 */

import { logDebug } from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';

class Modal {
  /**
   * Create a new modal instance
   * @param {Object} options - Modal configuration options
   */
  constructor(options = {}) {
    this.options = {
      id: options.id || `modal-${generateId()}`,
      title: options.title || '',
      content: options.content || '',
      size: options.size || 'medium', // small, medium, large, fullscreen
      closable: options.closable !== false,
      backdrop: options.backdrop !== false,
      backdropClose: options.backdropClose !== false,
      escClose: options.escClose !== false,
      animation: options.animation || 'fade', // fade, slide, none
      position: options.position || 'center', // center, top, bottom
      fullWidth: options.fullWidth || false,
      maxWidth: options.maxWidth || null,
      maxHeight: options.maxHeight || null,
      onOpen: options.onOpen || null,
      onClose: options.onClose || null,
      buttons: options.buttons || [],
      className: options.className || '',
      contentClassName: options.contentClassName || '',
      headerClassName: options.headerClassName || '',
      footerClassName: options.footerClassName || '',
      showHeader: options.showHeader !== false,
      showFooter: options.showFooter !== false,
      closeButtonText: options.closeButtonText || 'Close'
    };
    
    this.element = null;
    this.backdrop = null;
    this.isOpen = false;
    this.eventHandlers = {};
    
    // Create the modal element if not using an existing one
    if (!document.getElementById(this.options.id)) {
      this._createModalElement();
    } else {
      this.element = document.getElementById(this.options.id);
      this._setupExistingModal();
    }
    
    // Bind methods
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this._handleEscKey = this._handleEscKey.bind(this);
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
  }
  
  /**
   * Create the modal DOM element
   * @private
   */
  _createModalElement() {
    // Create modal container
    this.element = document.createElement('div');
    this.element.id = this.options.id;
    this.element.className = `modal ${this.options.className}`;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-labelledby', `${this.options.id}-title`);
    this.element.setAttribute('aria-hidden', 'true');
    
    // Set modal size
    this.element.classList.add(`modal-${this.options.size}`);
    
    // Set position
    if (this.options.position !== 'center') {
      this.element.classList.add(`modal-${this.options.position}`);
    }
    
    // Set full width if needed
    if (this.options.fullWidth) {
      this.element.classList.add('modal-full-width');
    }
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = `modal-content ${this.options.contentClassName}`;
    
    // Set max width/height if provided
    if (this.options.maxWidth) {
      modalContent.style.maxWidth = typeof this.options.maxWidth === 'number' 
        ? `${this.options.maxWidth}px` 
        : this.options.maxWidth;
    }
    
    if (this.options.maxHeight) {
      modalContent.style.maxHeight = typeof this.options.maxHeight === 'number' 
        ? `${this.options.maxHeight}px` 
        : this.options.maxHeight;
    }
    
    // Create header if needed
    if (this.options.showHeader) {
      const modalHeader = document.createElement('div');
      modalHeader.className = `modal-header ${this.options.headerClassName}`;
      
      const modalTitle = document.createElement('h5');
      modalTitle.className = 'modal-title';
      modalTitle.id = `${this.options.id}-title`;
      modalTitle.textContent = this.options.title;
      
      modalHeader.appendChild(modalTitle);
      
      // Add close button if modal is closable
      if (this.options.closable) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'modal-close';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
        closeButton.addEventListener('click', this.close);
        
        modalHeader.appendChild(closeButton);
      }
      
      modalContent.appendChild(modalHeader);
    }
    
    // Create body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Set content (string or DOM element)
    if (typeof this.options.content === 'string') {
      modalBody.innerHTML = this.options.content;
    } else if (this.options.content instanceof HTMLElement) {
      modalBody.appendChild(this.options.content);
    }
    
    modalContent.appendChild(modalBody);
    
    // Create footer if needed
    if (this.options.showFooter) {
      const modalFooter = document.createElement('div');
      modalFooter.className = `modal-footer ${this.options.footerClassName}`;
      
      // Add custom buttons
      this.options.buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.type = 'button';
        buttonElement.className = button.className || 'btn';
        buttonElement.textContent = button.text || '';
        
        if (button.id) {
          buttonElement.id = button.id;
        }
        
        if (button.attributes) {
          Object.entries(button.attributes).forEach(([key, value]) => {
            buttonElement.setAttribute(key, value);
          });
        }
        
        if (typeof button.onClick === 'function') {
          buttonElement.addEventListener('click', (e) => button.onClick(e, this));
        }
        
        modalFooter.appendChild(buttonElement);
      });
      
      // Add default close button if no buttons specified
      if (this.options.buttons.length === 0 && this.options.closable) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn btn-secondary';
        closeButton.textContent = this.options.closeButtonText;
        closeButton.addEventListener('click', this.close);
        
        modalFooter.appendChild(closeButton);
      }
      
      modalContent.appendChild(modalFooter);
    }
    
    this.element.appendChild(modalContent);
    
    // Create backdrop if needed
    if (this.options.backdrop) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'modal-backdrop';
      
      if (this.options.backdropClose) {
        this.backdrop.addEventListener('click', this._handleBackdropClick);
      }
    }
    
    // Append to document
    document.body.appendChild(this.element);
    
    if (this.backdrop) {
      document.body.appendChild(this.backdrop);
    }
  }
  
  /**
   * Set up an existing modal element
   * @private
   */
  _setupExistingModal() {
    // Find close buttons
    const closeButtons = this.element.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', this.close);
    });
    
    // Create backdrop if needed and not already present
    if (this.options.backdrop && !document.querySelector(`#${this.options.id}-backdrop`)) {
      this.backdrop = document.createElement('div');
      this.backdrop.id = `${this.options.id}-backdrop`;
      this.backdrop.className = 'modal-backdrop';
      
      if (this.options.backdropClose) {
        this.backdrop.addEventListener('click', this._handleBackdropClick);
      }
      
      document.body.appendChild(this.backdrop);
    } else if (this.options.backdrop) {
      this.backdrop = document.querySelector(`#${this.options.id}-backdrop`);
      
      if (this.options.backdropClose) {
        this.backdrop.addEventListener('click', this._handleBackdropClick);
      }
    }
  }
  
  /**
   * Handle ESC key press
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  _handleEscKey(event) {
    if (event.key === 'Escape' && this.options.escClose && this.isOpen) {
      this.close();
    }
  }
  
  /**
   * Handle backdrop click
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleBackdropClick(event) {
    if (event.target === this.backdrop && this.options.backdropClose && this.isOpen) {
      this.close();
    }
  }
  
  /**
   * Open the modal
   * @returns {Modal} - The modal instance for chaining
   */
  open() {
    if (this.isOpen) return this;
    
    logDebug('Modal', `Opening modal: ${this.options.id}`);
    
    // Show modal
    this.element.classList.add('modal-open');
    this.element.setAttribute('aria-hidden', 'false');
    
    // Show backdrop
    if (this.backdrop) {
      this.backdrop.classList.add('show');
    }
    
    // Add body class
    document.body.classList.add('modal-open');
    
    // Add ESC key handler
    if (this.options.escClose) {
      document.addEventListener('keydown', this._handleEscKey);
    }
    
    // Set open state
    this.isOpen = true;
    
    // Call onOpen callback
    if (typeof this.options.onOpen === 'function') {
      this.options.onOpen(this);
    }
    
    // Trigger open event
    this._triggerEvent('open');
    
    return this;
  }
  
  /**
   * Close the modal
   * @returns {Modal} - The modal instance for chaining
   */
  close() {
    if (!this.isOpen) return this;
    
    logDebug('Modal', `Closing modal: ${this.options.id}`);
    
    // Hide modal
    this.element.classList.remove('modal-open');
    this.element.setAttribute('aria-hidden', 'true');
    
    // Hide backdrop
    if (this.backdrop) {
      this.backdrop.classList.remove('show');
    }
    
    // Remove body class
    document.body.classList.remove('modal-open');
    
    // Remove ESC key handler
    if (this.options.escClose) {
      document.removeEventListener('keydown', this._handleEscKey);
    }
    
    // Set open state
    this.isOpen = false;
    
    // Call onClose callback
    if (typeof this.options.onClose === 'function') {
      this.options.onClose(this);
    }
    
    // Trigger close event
    this._triggerEvent('close');
    
    return this;
  }
  
  /**
   * Set modal content
   * @param {string|HTMLElement} content - Modal content
   * @returns {Modal} - The modal instance for chaining
   */
  setContent(content) {
    const modalBody = this.element.querySelector('.modal-body');
    
    if (!modalBody) return this;
    
    // Set content (string or DOM element)
    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modalBody.innerHTML = '';
      modalBody.appendChild(content);
    }
    
    return this;
  }
  
  /**
   * Set modal title
   * @param {string} title - Modal title
   * @returns {Modal} - The modal instance for chaining
   */
  setTitle(title) {
    const modalTitle = this.element.querySelector('.modal-title');
    
    if (modalTitle) {
      modalTitle.textContent = title;
    }
    
    return this;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Modal} - The modal instance for chaining
   */
  on(event, callback) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(callback);
    
    return this;
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Modal} - The modal instance for chaining
   */
  off(event, callback) {
    if (!this.eventHandlers[event]) return this;
    
    if (callback) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
    } else {
      this.eventHandlers[event] = [];
    }
    
    return this;
  }
  
  /**
   * Trigger event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @private
   */
  _triggerEvent(event, data = {}) {
    if (!this.eventHandlers[event]) return;
    
    this.eventHandlers[event].forEach(callback => {
      callback({
        type: event,
        target: this,
        data
      });
    });
  }
  
  /**
   * Destroy the modal
   */
  destroy() {
    // Remove event listeners
    if (this.options.escClose) {
      document.removeEventListener('keydown', this._handleEscKey);
    }
    
    if (this.backdrop && this.options.backdropClose) {
      this.backdrop.removeEventListener('click', this._handleBackdropClick);
    }
    
    // Remove elements
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
    
    // Clear references
    this.element = null;
    this.backdrop = null;
    this.eventHandlers = {};
    this.isOpen = false;
  }
}

export default Modal;

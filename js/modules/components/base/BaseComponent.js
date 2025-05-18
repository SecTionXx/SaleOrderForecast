/**
 * Base Component Class
 * Provides common functionality for all UI components
 */

import { createElement, addClass, removeClass, toggleClass } from '../../utils/domUtils.js';
import { logDebug, logError } from '../../utils/logger.js';

export class BaseComponent {
  /**
   * Create a new BaseComponent
   * @param {Object} options - Component options
   * @param {HTMLElement} [options.parent] - Parent element to append to
   * @param {string} [options.className] - CSS class name for the component
   * @param {Object} [options.attributes] - HTML attributes to set on the component
   * @param {Object} [options.styles] - Inline styles to apply to the component
   * @param {string} [options.id] - ID for the component
   */
  constructor({
    parent = null,
    className = '',
    attributes = {},
    styles = {},
    id = '',
  } = {}) {
    this.parent = parent;
    this.className = className;
    this.attributes = attributes;
    this.styles = styles;
    this.id = id;
    this.elements = {};
    this.eventListeners = [];
    
    // Create the main element
    this.element = this.createElement();
    
    // Initialize the component
    this.initialize();
    
    // Add to parent if provided
    if (this.parent && this.parent.appendChild) {
      this.parent.appendChild(this.element);
    }
    
    logDebug(`Component ${this.constructor.name} initialized`);
  }
  
  /**
   * Create the component's main element
   * @returns {HTMLElement}
   * @protected
   */
  createElement() {
    const element = document.createElement('div');
    
    // Add class name
    if (this.className) {
      addClass(element, this.className);
    }
    
    // Set ID if provided
    if (this.id) {
      element.id = this.id;
    }
    
    // Set attributes
    Object.entries(this.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    // Apply styles
    Object.assign(element.style, this.styles);
    
    return element;
  }
  
  /**
   * Initialize the component
   * Override this method in child classes
   * @protected
   */
  initialize() {
    // To be implemented by child classes
  }
  
  /**
   * Show the component
   */
  show() {
    this.element.style.display = '';
    this.element.setAttribute('aria-hidden', 'false');
  }
  
  /**
   * Hide the component
   */
  hide() {
    this.element.style.display = 'none';
    this.element.setAttribute('aria-hidden', 'true');
  }
  
  /**
   * Toggle the component's visibility
   * @param {boolean} [force] - Force show or hide
   */
  toggle(force) {
    if (typeof force === 'boolean') {
      force ? this.show() : this.hide();
    } else {
      const isHidden = this.element.style.display === 'none' || 
                     this.element.getAttribute('aria-hidden') === 'true';
      isHidden ? this.show() : this.hide();
    }
  }
  
  /**
   * Add a child element to the component
   * @param {HTMLElement|BaseComponent} child - Child element or component
   * @param {string} [key] - Key to store the child under
   * @returns {HTMLElement} The added child element
   */
  addChild(child, key) {
    const childElement = child instanceof BaseComponent ? child.element : child;
    this.element.appendChild(childElement);
    
    if (key) {
      this.elements[key] = child;
    }
    
    return childElement;
  }
  
  /**
   * Add an event listener to the component
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @param {Object} [options] - Event listener options
   * @returns {Function} The event listener function for removal
   */
  addListener(event, handler, options) {
    const listener = (e) => {
      try {
        handler(e);
      } catch (error) {
        logError(`Error in ${this.constructor.name} event handler:`, error);
      }
    };
    
    this.element.addEventListener(event, listener, options);
    this.eventListeners.push({ event, listener, options });
    
    // Return the original handler for removal
    return listener;
  }
  
  /**
   * Remove an event listener from the component
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   * @param {Object} [options] - Event listener options
   */
  removeListener(event, handler, options) {
    this.element.removeEventListener(event, handler, options);
    this.eventListeners = this.eventListeners.filter(
      item => !(item.event === event && item.listener === handler && 
              JSON.stringify(item.options) === JSON.stringify(options || {}))
    );
  }
  
  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.eventListeners.forEach(({ event, listener, options }) => {
      this.element.removeEventListener(event, listener, options);
    });
    this.eventListeners = [];
  }
  
  /**
   * Set or update component attributes
   * @param {Object} attributes - Attributes to set or update
   */
  setAttributes(attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      this.element.setAttribute(key, value);
    });
  }
  
  /**
   * Set or update component styles
   * @param {Object} styles - Styles to apply
   */
  setStyles(styles) {
    Object.assign(this.element.style, styles);
  }
  
  /**
   * Add CSS classes to the component
   * @param {...string} classNames - Class names to add
   */
  addClass(...classNames) {
    addClass(this.element, ...classNames);
  }
  
  /**
   * Remove CSS classes from the component
   * @param {...string} classNames - Class names to remove
   */
  removeClass(...classNames) {
    removeClass(this.element, ...classNames);
  }
  
  /**
   * Toggle CSS classes on the component
   * @param {string} className - Class name to toggle
   * @param {boolean} [force] - Force add or remove the class
   */
  toggleClass(className, force) {
    toggleClass(this.element, className, force);
  }
  
  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Remove all event listeners
    this.removeAllListeners();
    
    // Remove from parent if it's still in the DOM
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clear references
    this.element = null;
    this.parent = null;
    this.elements = {};
    
    logDebug(`Component ${this.constructor.name} destroyed`);
  }
}

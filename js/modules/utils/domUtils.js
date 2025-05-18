/**
 * DOM Utility Functions
 * Collection of helper functions for DOM manipulation and event handling
 */

/**
 * Creates a DOM element with the specified attributes and children
 * @param {string} tag - The HTML tag name
 * @param {Object} attributes - Object containing attributes to set
 * @param {Array|HTMLElement|string} children - Child elements or text content
 * @returns {HTMLElement} The created element
 */
export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else if (typeof value === 'boolean') {
        if (value) element.setAttribute(key, '');
      } else {
        element.setAttribute(key, value);
      }
    }
  });
  
  // Append children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        element.appendChild(child);
      } else if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(child));
      }
    });
  } else if (children instanceof HTMLElement) {
    element.appendChild(children);
  } else if (typeof children === 'string' || typeof children === 'number') {
    element.textContent = children;
  }
  
  return element;
};

/**
 * Safely gets an element by selector with optional parent context
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Context element to search within
 * @returns {HTMLElement|null} The found element or null
 */
export const $ = (selector, context = document) => {
  return context.querySelector(selector);
};

/**
 * Gets all elements matching a selector with optional parent context
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Context element to search within
 * @returns {NodeList} List of matching elements
 */
export const $$ = (selector, context = document) => {
  return context.querySelectorAll(selector);
};

/**
 * Toggles a class on an element
 * @param {HTMLElement} element - The target element
 * @param {string} className - The class to toggle
 * @param {boolean} [force] - Force add or remove the class
 * @returns {boolean} Whether the class is present after toggling
 */
export const toggleClass = (element, className, force) => {
  if (!element || !className) return false;
  
  if (force !== undefined) {
    element.classList.toggle(className, force);
    return force;
  }
  
  return element.classList.toggle(className);
};

/**
 * Shows or hides an element
 * @param {HTMLElement} element - The element to show or hide
 * @param {boolean} [show] - Whether to show or hide the element (optional for toggle)
 * @param {string} [display='block'] - Display value when showing the element
 */
export const toggleElement = (element, show, display = 'block') => {
  if (!element) return;
  
  if (show === undefined) {
    // Toggle based on current state
    show = element.style.display === 'none' || !element.style.display;
  }
  
  element.style.display = show ? display : 'none';
};

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @param {boolean} [immediate] - Whether to call the function immediately on first call
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
};

/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time to wait in milliseconds
 * @returns {Function} The throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

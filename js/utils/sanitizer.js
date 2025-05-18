/**
 * sanitizer.js - Input Sanitization Utility
 * Provides functions to sanitize user inputs to prevent XSS and other injection attacks
 */

import { logDebug } from './logger.js';

/**
 * Sanitize a string by removing potentially dangerous HTML/script content
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input) {
  if (input === null || input === undefined) {
    return '';
  }
  
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;');
}

/**
 * Sanitize HTML content while preserving allowed tags
 * @param {string} html - HTML content to sanitize
 * @param {Array} allowedTags - Array of allowed HTML tags
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(html, allowedTags = []) {
  if (!html) return '';
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Find all elements
  const allElements = tempElement.getElementsByTagName('*');
  
  // Process elements in reverse to avoid index changes during removal
  for (let i = allElements.length - 1; i >= 0; i--) {
    const element = allElements[i];
    
    // Remove disallowed tags
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      // Replace with text content to preserve content
      const textContent = document.createTextNode(element.textContent);
      element.parentNode.replaceChild(textContent, element);
      continue;
    }
    
    // Remove all attributes except allowed ones
    const attributes = element.attributes;
    for (let j = attributes.length - 1; j >= 0; j--) {
      const attrName = attributes[j].name;
      
      // Allow only safe attributes
      if (!['href', 'target', 'class', 'id', 'style'].includes(attrName)) {
        element.removeAttribute(attrName);
      }
      
      // Special handling for href (prevent javascript: URLs)
      if (attrName === 'href') {
        const href = element.getAttribute('href');
        if (href && href.toLowerCase().startsWith('javascript:')) {
          element.setAttribute('href', '#');
        }
      }
      
      // Special handling for style (prevent expressions)
      if (attrName === 'style') {
        const style = element.getAttribute('style');
        if (style && (style.includes('expression') || style.includes('javascript:'))) {
          element.removeAttribute('style');
        }
      }
    }
  }
  
  return tempElement.innerHTML;
}

/**
 * Sanitize an object by sanitizing all string properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Sanitize form data
 * @param {FormData|Object} formData - Form data to sanitize
 * @returns {Object} - Sanitized form data as object
 */
export function sanitizeFormData(formData) {
  const result = {};
  
  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        result[key] = sanitizeString(value);
      } else {
        result[key] = value;
      }
    }
  } else if (typeof formData === 'object' && formData !== null) {
    return sanitizeObject(formData);
  }
  
  return result;
}

/**
 * Sanitize URL parameters
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
export function sanitizeUrl(url) {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url);
    
    // Sanitize search params
    const params = new URLSearchParams(parsedUrl.search);
    const sanitizedParams = new URLSearchParams();
    
    for (const [key, value] of params.entries()) {
      sanitizedParams.append(key, sanitizeString(value));
    }
    
    parsedUrl.search = sanitizedParams.toString();
    return parsedUrl.toString();
  } catch (error) {
    logDebug('Error sanitizing URL:', error);
    return sanitizeString(url);
  }
}

/**
 * Create a sanitized version of JSON.parse
 * @param {string} jsonString - JSON string to parse
 * @returns {any} - Parsed and sanitized JSON
 */
export function safeJsonParse(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === 'object' ? sanitizeObject(parsed) : parsed;
  } catch (error) {
    logDebug('Error parsing JSON:', error);
    return null;
  }
}

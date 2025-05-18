/**
 * helpers.js - Utility Helper Functions
 * Provides common utility functions used throughout the application
 */

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}-${randomStr}`;
}

/**
 * Format a date string
 * @param {string|Date} dateStr - Date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions = {
    format: 'short', // short, medium, long, full, iso, relative
    locale: 'th-TH'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Format based on specified format
  switch (opts.format) {
    case 'short':
      return date.toLocaleDateString(opts.locale, {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      });
    
    case 'medium':
      return date.toLocaleDateString(opts.locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    
    case 'long':
      return date.toLocaleDateString(opts.locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    
    case 'full':
      return date.toLocaleDateString(opts.locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    
    case 'iso':
      return date.toISOString();
    
    case 'relative':
      return formatRelativeTime(date);
    
    default:
      return date.toLocaleDateString(opts.locale);
  }
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param {Date} date - Date to format
 * @returns {string} - Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return diffSec <= 5 ? 'just now' : `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 30) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format a number as currency
 * @param {number} value - Value to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value, options = {}) {
  if (value === null || value === undefined) return '';
  
  const defaultOptions = {
    currency: 'THB',
    locale: 'th-TH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };
  
  const opts = { ...defaultOptions, ...options };
  
  return new Intl.NumberFormat(opts.locale, {
    style: 'currency',
    currency: opts.currency,
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits
  }).format(value);
}

/**
 * Format a number as percentage
 * @param {number} value - Value to format (e.g., 0.75 for 75%)
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted percentage string
 */
export function formatPercentage(value, options = {}) {
  if (value === null || value === undefined) return '';
  
  const defaultOptions = {
    locale: 'th-TH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    multiplier: 1 // Set to 100 if value is already in decimal form (e.g., 0.75)
  };
  
  const opts = { ...defaultOptions, ...options };
  const valueToFormat = value * opts.multiplier;
  
  return new Intl.NumberFormat(opts.locale, {
    style: 'percent',
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits
  }).format(valueToFormat);
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // Handle Object
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  throw new Error(`Unable to copy obj! Its type isn't supported: ${typeof obj}`);
}

/**
 * Get a nested property from an object using a path string
 * @param {Object} obj - Object to get property from
 * @param {string} path - Path to property (e.g., 'user.address.city')
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} - Property value or default value
 */
export function getNestedProperty(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * Set a nested property in an object using a path string
 * @param {Object} obj - Object to set property in
 * @param {string} path - Path to property (e.g., 'user.address.city')
 * @param {*} value - Value to set
 * @returns {Object} - Updated object
 */
export function setNestedProperty(obj, path, value) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  
  return obj;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} - True if value is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  
  return false;
}

/**
 * Convert a string to title case
 * @param {string} str - String to convert
 * @returns {string} - Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a string to camel case
 * @param {string} str - String to convert
 * @returns {string} - Camel case string
 */
export function toCamelCase(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * Convert a string to kebab case
 * @param {string} str - String to convert
 * @returns {string} - Kebab case string
 */
export function toKebabCase(str) {
  if (!str) return '';
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Truncate a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} - Truncated string
 */
export function truncateString(str, length = 50, suffix = '...') {
  if (!str) return '';
  
  if (str.length <= length) {
    return str;
  }
  
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * Convert a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Human-readable file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get the file extension from a filename
 * @param {string} filename - Filename
 * @returns {string} - File extension
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Check if a date is valid
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is valid
 */
export function isValidDate(date) {
  if (!date) return false;
  
  const d = date instanceof Date ? date : new Date(date);
  
  return !isNaN(d.getTime());
}

/**
 * Calculate the difference between two dates in days
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} - Difference in days
 */
export function dateDiffInDays(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return 0;
  }
  
  // Convert to UTC to avoid DST issues
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  // Convert milliseconds to days
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Get URL parameters as an object
 * @param {string} url - URL to parse (defaults to current URL)
 * @returns {Object} - URL parameters
 */
export function getUrlParameters(url = window.location.href) {
  const params = {};
  const parser = document.createElement('a');
  parser.href = url;
  
  const query = parser.search.substring(1);
  const vars = query.split('&');
  
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    
    if (pair[0]) {
      params[decodeURIComponent(pair[0])] = pair[1] 
        ? decodeURIComponent(pair[1]) 
        : '';
    }
  }
  
  return params;
}

/**
 * Build a URL with query parameters
 * @param {string} url - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} - URL with query parameters
 */
export function buildUrl(url, params = {}) {
  const queryString = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => {
      const value = params[key];
      
      if (Array.isArray(value)) {
        return value
          .map(item => `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`)
          .join('&');
      }
      
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
  
  if (!queryString) {
    return url;
  }
  
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

/**
 * Detect the user's browser
 * @returns {Object} - Browser information
 */
export function detectBrowser() {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';
  
  // Detect browser
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edge') === -1) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari';
    version = userAgent.match(/Version\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
    version = userAgent.match(/Edge\/([0-9.]+)/)[1];
  } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
    browser = 'Internet Explorer';
    version = userAgent.match(/(?:MSIE |rv:)([0-9.]+)/)[1];
  }
  
  return {
    browser,
    version,
    userAgent,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent)
  };
}

/**
 * Detect the user's operating system
 * @returns {string} - Operating system name
 */
export function detectOS() {
  const userAgent = navigator.userAgent;
  
  if (/Windows/i.test(userAgent)) {
    return 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    return 'Linux';
  } else if (/Android/i.test(userAgent)) {
    return 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS';
  }
  
  return 'Unknown';
}

/**
 * Get the current viewport size
 * @returns {Object} - Viewport width and height
 */
export function getViewportSize() {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} offset - Offset in pixels
 * @returns {boolean} - True if element is in viewport
 */
export function isElementInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Scroll to an element
 * @param {HTMLElement|string} element - Element or selector to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollToElement(element, options = {}) {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    offset: 0
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Get element if selector
  const targetElement = typeof element === 'string'
    ? document.querySelector(element)
    : element;
  
  if (!targetElement) return;
  
  // Calculate position with offset
  const elementPosition = targetElement.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - opts.offset;
  
  // Scroll to element
  window.scrollTo({
    top: offsetPosition,
    behavior: opts.behavior
  });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - True if copied successfully
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * Generate a random color
 * @param {Object} options - Options for color generation
 * @returns {string} - Random color
 */
export function generateRandomColor(options = {}) {
  const defaultOptions = {
    format: 'hex', // hex, rgb, rgba
    alpha: 1, // for rgba
    saturation: [50, 90], // percentage range
    lightness: [40, 60] // percentage range
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Generate random hue (0-360)
  const hue = Math.floor(Math.random() * 360);
  
  // Generate random saturation within range
  const saturation = Math.floor(
    Math.random() * (opts.saturation[1] - opts.saturation[0]) + opts.saturation[0]
  );
  
  // Generate random lightness within range
  const lightness = Math.floor(
    Math.random() * (opts.lightness[1] - opts.lightness[0]) + opts.lightness[0]
  );
  
  // Return color in specified format
  switch (opts.format) {
    case 'rgb':
      return hslToRgb(hue, saturation, lightness);
    
    case 'rgba':
      return hslToRgba(hue, saturation, lightness, opts.alpha);
    
    case 'hex':
    default:
      return hslToHex(hue, saturation, lightness);
  }
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - RGB color
 */
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert HSL to RGBA
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @param {number} a - Alpha (0-1)
 * @returns {string} - RGBA color
 */
function hslToRgba(h, s, l, a) {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Convert HSL to HEX
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - HEX color
 */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

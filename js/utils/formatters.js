/**
 * Formatters Utility
 * Provides functions for formatting data in consistent ways across the application
 */

/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @param {string} [currency='USD'] - The currency code
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${value}`;
  }
}

/**
 * Format a number with thousand separators
 * @param {number} value - The value to format
 * @param {number} [decimals=0] - Number of decimal places
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} - Formatted number string
 */
export function formatNumber(value, decimals = 0, locale = 'en-US') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return `${value}`;
  }
}

/**
 * Format a percentage value
 * @param {number} value - The value to format (0-1)
 * @param {number} [decimals=0] - Number of decimal places
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} - Formatted percentage string
 */
export function formatPercentage(value, decimals = 0, locale = 'en-US') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  
  try {
    // Convert decimal to percentage (e.g., 0.75 to 75%)
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${value * 100}%`;
  }
}

/**
 * Format a date
 * @param {Date|string|number} date - The date to format
 * @param {string} [format='medium'] - Format style: 'short', 'medium', 'long', 'full'
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = 'medium', locale = 'en-US') {
  if (!date) {
    return '-';
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const options = { dateStyle: format };
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Format a datetime
 * @param {Date|string|number} date - The date to format
 * @param {string} [dateFormat='medium'] - Date format style: 'short', 'medium', 'long', 'full'
 * @param {string} [timeFormat='short'] - Time format style: 'short', 'medium', 'long', 'full'
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} - Formatted datetime string
 */
export function formatDateTime(date, dateFormat = 'medium', timeFormat = 'short', locale = 'en-US') {
  if (!date) {
    return '-';
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const options = {
      dateStyle: dateFormat,
      timeStyle: timeFormat
    };
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return String(date);
  }
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string|number} date - The date to format relative to now
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} - Formatted relative time string
 */
export function formatRelativeTime(date, locale = 'en-US') {
  if (!date) {
    return '-';
  }
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    } else if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    } else if (Math.abs(diffHour) < 24) {
      return rtf.format(diffHour, 'hour');
    } else if (Math.abs(diffDay) < 30) {
      return rtf.format(diffDay, 'day');
    } else if (Math.abs(diffMonth) < 12) {
      return rtf.format(diffMonth, 'month');
    } else {
      return rtf.format(diffYear, 'year');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return formatDate(date, 'medium', locale);
  }
}

/**
 * Format a file size
 * @param {number} bytes - Size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} - Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return '-';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format a phone number
 * @param {string} phone - The phone number to format
 * @param {string} [format='(###) ###-####'] - Format pattern
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(phone, format = '(###) ###-####') {
  if (!phone) return '-';
  
  // Remove all non-numeric characters
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Check if the input is of correct length
  if (cleaned.length !== 10) {
    return phone; // Return original if not valid
  }
  
  // Replace placeholders with actual digits
  let formatted = format;
  for (let i = 0; i < cleaned.length; i++) {
    formatted = formatted.replace('#', cleaned[i]);
  }
  
  return formatted;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} [length=50] - Maximum length
 * @param {string} [ellipsis='...'] - Ellipsis string
 * @returns {string} - Truncated text
 */
export function truncateText(text, length = 50, ellipsis = '...') {
  if (!text) return '';
  
  if (text.length <= length) {
    return text;
  }
  
  return text.substring(0, length - ellipsis.length) + ellipsis;
}

/**
 * Format a name (first letter capitalized)
 * @param {string} name - Name to format
 * @returns {string} - Formatted name
 */
export function formatName(name) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a list of items
 * @param {Array} items - Array of items to format
 * @param {string} [separator=', '] - Separator between items
 * @param {string} [lastSeparator=' and '] - Separator before the last item
 * @returns {string} - Formatted list
 */
export function formatList(items, separator = ', ', lastSeparator = ' and ') {
  if (!items || !Array.isArray(items)) return '';
  
  if (items.length === 0) return '';
  if (items.length === 1) return String(items[0]);
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  
  return otherItems.join(separator) + lastSeparator + lastItem;
}

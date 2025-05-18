/**
 * envHandler.js - Secure Environment Variables Handler
 * Provides secure access to environment variables and prevents accidental exposure
 */

/**
 * Get environment variable with validation
 * @param {string} name - Environment variable name
 * @param {string|null} defaultValue - Default value if not found
 * @param {boolean} isRequired - Whether the variable is required
 * @returns {string|null} - Environment variable value or default
 * @throws {Error} - If required variable is missing
 */
function getEnv(name, defaultValue = null, isRequired = false) {
  const value = process.env[name] || defaultValue;
  
  if (isRequired && (value === null || value === undefined)) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  
  return value;
}

/**
 * Get sensitive environment variable (never logs the actual value)
 * @param {string} name - Environment variable name
 * @param {string|null} defaultValue - Default value if not found
 * @param {boolean} isRequired - Whether the variable is required
 * @returns {string|null} - Environment variable value or default
 * @throws {Error} - If required variable is missing
 */
function getSensitiveEnv(name, defaultValue = null, isRequired = false) {
  const value = getEnv(name, defaultValue, isRequired);
  
  // Add to list of sensitive variables to prevent logging
  if (value !== null && value !== undefined) {
    sensitiveVariables.add(name);
  }
  
  return value;
}

/**
 * Check if environment variable is defined
 * @param {string} name - Environment variable name
 * @returns {boolean} - Whether the variable is defined
 */
function hasEnv(name) {
  return process.env[name] !== undefined;
}

/**
 * Get boolean environment variable
 * @param {string} name - Environment variable name
 * @param {boolean} defaultValue - Default value if not found
 * @returns {boolean} - Boolean value of environment variable
 */
function getBoolEnv(name, defaultValue = false) {
  const value = process.env[name];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
}

/**
 * Get numeric environment variable
 * @param {string} name - Environment variable name
 * @param {number} defaultValue - Default value if not found
 * @returns {number} - Numeric value of environment variable
 */
function getNumEnv(name, defaultValue = 0) {
  const value = process.env[name];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Set of sensitive variable names that should never be logged
 * @type {Set<string>}
 */
const sensitiveVariables = new Set([
  'JWT_SECRET',
  'REFRESH_SECRET',
  'GOOGLE_API_KEY',
  'API_KEY',
  'PASSWORD',
  'SECRET',
  'PRIVATE_KEY',
  'AUTH_TOKEN',
  'ACCESS_TOKEN',
  'REFRESH_TOKEN'
]);

/**
 * Check if a variable name is sensitive
 * @param {string} name - Variable name
 * @returns {boolean} - Whether the variable is sensitive
 */
function isSensitiveVariable(name) {
  // Check exact matches
  if (sensitiveVariables.has(name)) {
    return true;
  }
  
  // Check if name contains sensitive keywords
  const sensitiveKeywords = ['key', 'secret', 'password', 'token', 'auth', 'private'];
  return sensitiveKeywords.some(keyword => name.toLowerCase().includes(keyword));
}

/**
 * Safely log environment variables (masks sensitive values)
 * @param {string[]} names - Names of variables to log
 * @returns {Object} - Object with masked values
 */
function safeLogEnv(names) {
  const result = {};
  
  names.forEach(name => {
    const value = process.env[name];
    
    if (value === undefined) {
      result[name] = 'undefined';
    } else if (isSensitiveVariable(name)) {
      // Mask sensitive values
      if (value.length > 8) {
        result[name] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      } else {
        result[name] = '********';
      }
    } else {
      result[name] = value;
    }
  });
  
  return result;
}

/**
 * Get all environment variables with sensitive values masked
 * @returns {Object} - Object with all environment variables (masked)
 */
function getAllMaskedEnv() {
  return safeLogEnv(Object.keys(process.env));
}

/**
 * Load environment variables from .env file
 * Only used in development, as production should set env vars through the platform
 */
function loadEnvFile() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      require('dotenv').config();
      console.log('Loaded environment variables from .env file');
    } catch (error) {
      console.warn('Failed to load .env file:', error.message);
    }
  }
}

// Automatically load environment variables in development
loadEnvFile();

module.exports = {
  getEnv,
  getSensitiveEnv,
  hasEnv,
  getBoolEnv,
  getNumEnv,
  safeLogEnv,
  getAllMaskedEnv,
  isSensitiveVariable
};

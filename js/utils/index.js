/**
 * utils/index.js - Utilities Entry Point
 * Exports all utility modules from a single file for easier imports
 */

// Re-export all utilities
export * from './apiService.js';
export * from './apiEndpoints.js';
export * from './dataFetch.js';
export * from './logger.js';
export * from './errorHandler.js';
export * from './validator.js';
export * from './uiHelpers.js';

// Import and re-export constants
import { ERROR_TYPES, ERROR_SEVERITY } from './errorHandler.js';
import { VALIDATION_RULES, VALIDATION_PATTERNS } from './validator.js';

// Export constants
export {
  ERROR_TYPES,
  ERROR_SEVERITY,
  VALIDATION_RULES,
  VALIDATION_PATTERNS
};

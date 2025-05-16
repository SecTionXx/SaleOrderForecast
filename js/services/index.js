/**
 * services/index.js - Services Entry Point
 * Exports all service modules from a single file for easier imports
 */

// Re-export all services
export * from './dealService.js';
export * from './userService.js';
export * from './reportService.js';
export * from './forecastingService.js';
export * from './crmService.js';
export * from './notificationService.js';
export * from './collaborationService.js';

// Import and re-export CRM types
import { CRM_TYPES } from './crmService.js';

// Import and re-export notification constants
import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITIES 
} from './notificationService.js';

// Export constants
export {
  CRM_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
};

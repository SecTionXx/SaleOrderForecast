/**
 * main.js - Main Application Entry Point
 * Initializes the application and imports all necessary modules
 */

// Import core application module
import { init } from './core/app.js';

// Import utility modules
import { logDebug } from './utils/logger.js';
import { handleUnhandledRejection } from './utils/errorHandler.js';

// Log application startup
logDebug('Application initializing...');

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  logDebug('DOM loaded, starting application');
  init();
});

// Register global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Export any functions or variables that need to be accessible globally
export {
  init
};

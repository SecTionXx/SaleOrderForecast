/**
 * index.js - Main JavaScript entry point
 * Imports and initializes all modules for the Order Forecast application
 */

// Import core app functionality
import { init } from './core/app.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

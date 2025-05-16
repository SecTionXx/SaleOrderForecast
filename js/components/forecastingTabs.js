/**
 * forecastingTabs.js - Forecasting Tabs Module
 * Handles tab switching for the advanced forecasting section
 */

import { logDebug } from '../utils/logger.js';

/**
 * Initialize forecasting tabs
 */
function initializeForecastingTabs() {
  const tabs = document.querySelectorAll('.forecasting-tab');
  if (!tabs.length) return;
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Get the tab ID
      const tabId = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and content
      document.querySelectorAll('.forecasting-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.forecasting-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(`${tabId}-container`).classList.add('active');
      
      logDebug(`Switched to forecasting tab: ${tabId}`);
    });
  });
  
  // Set up preferences button
  const preferencesBtn = document.getElementById('forecasting-preferences-btn');
  if (preferencesBtn) {
    preferencesBtn.addEventListener('click', showForecastingPreferences);
  }
}

/**
 * Show forecasting preferences modal
 */
function showForecastingPreferences() {
  // This would be implemented to show a preferences modal
  logDebug('Showing forecasting preferences');
  
  // For now, just show an alert
  alert('Forecasting preferences will be available in a future update.');
}

// Export functions
export {
  initializeForecastingTabs,
  showForecastingPreferences
};

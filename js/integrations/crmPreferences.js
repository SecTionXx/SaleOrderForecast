/**
 * crmPreferences.js - CRM Preferences Module
 * Handles user preferences for CRM integration
 */

import { logDebug, logError } from '../utils/logger.js';
import { CRM_TYPES } from './crmConnector.js';

// Default preferences
const DEFAULT_PREFERENCES = {
  syncFrequency: 'manual', // manual, hourly, daily
  autoSync: false,
  notifyOnChanges: true,
  conflictResolution: 'ask', // ask, local, remote
  showSyncNotifications: true
};

// Current preferences
let currentPreferences = { ...DEFAULT_PREFERENCES };

/**
 * Initialize CRM preferences
 */
function initializeCrmPreferences() {
  // Load saved preferences
  loadPreferences();
  
  // Set up event listeners
  setupEventListeners();
  
  logDebug('CRM preferences initialized');
}

/**
 * Load preferences from localStorage
 */
function loadPreferences() {
  try {
    const savedPreferences = localStorage.getItem('orderforecast_crm_preferences');
    if (savedPreferences) {
      currentPreferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPreferences) };
      logDebug('Loaded CRM preferences', currentPreferences);
    }
  } catch (error) {
    logError('Error loading CRM preferences', error);
    currentPreferences = { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Save preferences to localStorage
 */
function savePreferences() {
  try {
    localStorage.setItem('orderforecast_crm_preferences', JSON.stringify(currentPreferences));
    logDebug('Saved CRM preferences', currentPreferences);
  } catch (error) {
    logError('Error saving CRM preferences', error);
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  const preferencesBtn = document.getElementById('crm-preferences-btn');
  if (preferencesBtn) {
    preferencesBtn.addEventListener('click', showPreferencesModal);
  }
}

/**
 * Show preferences modal
 */
function showPreferencesModal() {
  // Create modal HTML
  const modalHtml = `
    <div class="modal-header">
      <h3>CRM Integration Preferences</h3>
      <button class="close-modal-btn">&times;</button>
    </div>
    <div class="modal-body">
      <div class="preferences-form">
        <div class="form-group">
          <label for="sync-frequency">Sync Frequency</label>
          <select id="sync-frequency">
            <option value="manual" ${currentPreferences.syncFrequency === 'manual' ? 'selected' : ''}>Manual</option>
            <option value="hourly" ${currentPreferences.syncFrequency === 'hourly' ? 'selected' : ''}>Hourly</option>
            <option value="daily" ${currentPreferences.syncFrequency === 'daily' ? 'selected' : ''}>Daily</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="auto-sync" ${currentPreferences.autoSync ? 'checked' : ''}>
            <span>Auto-sync on startup</span>
          </label>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="notify-changes" ${currentPreferences.notifyOnChanges ? 'checked' : ''}>
            <span>Notify on CRM changes</span>
          </label>
        </div>
        
        <div class="form-group">
          <label for="conflict-resolution">Conflict Resolution</label>
          <select id="conflict-resolution">
            <option value="ask" ${currentPreferences.conflictResolution === 'ask' ? 'selected' : ''}>Ask me</option>
            <option value="local" ${currentPreferences.conflictResolution === 'local' ? 'selected' : ''}>Use local data</option>
            <option value="remote" ${currentPreferences.conflictResolution === 'remote' ? 'selected' : ''}>Use CRM data</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="show-sync-notifications" ${currentPreferences.showSyncNotifications ? 'checked' : ''}>
            <span>Show sync notifications</span>
          </label>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="reset-preferences-btn">Reset to Default</button>
      <button class="btn btn-primary" id="save-preferences-btn">Save Preferences</button>
    </div>
  `;
  
  // Create and show modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      ${modalHtml}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  const backdrop = modal.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  const saveBtn = modal.querySelector('#save-preferences-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Save preferences
      currentPreferences.syncFrequency = document.getElementById('sync-frequency').value;
      currentPreferences.autoSync = document.getElementById('auto-sync').checked;
      currentPreferences.notifyOnChanges = document.getElementById('notify-changes').checked;
      currentPreferences.conflictResolution = document.getElementById('conflict-resolution').value;
      currentPreferences.showSyncNotifications = document.getElementById('show-sync-notifications').checked;
      
      savePreferences();
      
      // Close modal
      document.body.removeChild(modal);
    });
  }
  
  const resetBtn = modal.querySelector('#reset-preferences-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all preferences to default?')) {
        currentPreferences = { ...DEFAULT_PREFERENCES };
        savePreferences();
        
        // Close modal and reopen with new values
        document.body.removeChild(modal);
        showPreferencesModal();
      }
    });
  }
}

/**
 * Get current preferences
 * @returns {Object} - Current preferences
 */
function getPreferences() {
  return { ...currentPreferences };
}

/**
 * Update preferences
 * @param {Object} newPreferences - New preferences to merge with current
 */
function updatePreferences(newPreferences) {
  currentPreferences = { ...currentPreferences, ...newPreferences };
  savePreferences();
}

// Export functions
export {
  initializeCrmPreferences,
  getPreferences,
  updatePreferences
};

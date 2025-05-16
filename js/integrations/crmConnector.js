/**
 * crmConnector.js - CRM Integration Module
 * Handles connections to various CRM systems
 */

import { getAuthToken } from '../auth/auth.js';
import { logDebug, logError } from '../utils/logger.js';

// Supported CRM types
const CRM_TYPES = {
  SALESFORCE: 'salesforce',
  HUBSPOT: 'hubspot',
  ZOHO: 'zoho',
  DYNAMICS: 'dynamics',
  CUSTOM: 'custom'
};

// CRM connection state
let currentCrm = null;
let connectionStatus = 'disconnected';
let lastSyncTime = null;
let syncInProgress = false;

/**
 * Initialize CRM connector
 */
function initializeCrmConnector() {
  // Load saved CRM settings
  loadCrmSettings();
  
  // Initialize UI
  initializeCrmUI();
  
  logDebug('CRM connector initialized');
}

/**
 * Load saved CRM settings from localStorage
 */
function loadCrmSettings() {
  try {
    const savedSettings = localStorage.getItem('orderforecast_crm_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      currentCrm = settings.crmType || null;
      lastSyncTime = settings.lastSyncTime ? new Date(settings.lastSyncTime) : null;
      
      logDebug('Loaded CRM settings', settings);
    }
  } catch (error) {
    logError('Error loading CRM settings', error);
  }
}

/**
 * Save CRM settings to localStorage
 */
function saveCrmSettings() {
  try {
    const settings = {
      crmType: currentCrm,
      lastSyncTime: lastSyncTime ? lastSyncTime.toISOString() : null
    };
    
    localStorage.setItem('orderforecast_crm_settings', JSON.stringify(settings));
    logDebug('Saved CRM settings', settings);
  } catch (error) {
    logError('Error saving CRM settings', error);
  }
}

/**
 * Initialize CRM UI elements
 */
function initializeCrmUI() {
  const crmContainer = document.getElementById('crm-integration-container');
  if (!crmContainer) return;
  
  // Create CRM selection UI
  crmContainer.innerHTML = `
    <div class="crm-selection">
      <h3>CRM Integration</h3>
      <div class="connection-status ${connectionStatus}">
        <span class="status-indicator"></span>
        <span class="status-text">${getStatusText()}</span>
      </div>
      
      <div class="crm-selector">
        <label for="crm-type">Select CRM:</label>
        <select id="crm-type">
          <option value="">-- Select CRM --</option>
          <option value="${CRM_TYPES.SALESFORCE}" ${currentCrm === CRM_TYPES.SALESFORCE ? 'selected' : ''}>Salesforce</option>
          <option value="${CRM_TYPES.HUBSPOT}" ${currentCrm === CRM_TYPES.HUBSPOT ? 'selected' : ''}>HubSpot</option>
          <option value="${CRM_TYPES.ZOHO}" ${currentCrm === CRM_TYPES.ZOHO ? 'selected' : ''}>Zoho CRM</option>
          <option value="${CRM_TYPES.DYNAMICS}" ${currentCrm === CRM_TYPES.DYNAMICS ? 'selected' : ''}>Microsoft Dynamics</option>
          <option value="${CRM_TYPES.CUSTOM}" ${currentCrm === CRM_TYPES.CUSTOM ? 'selected' : ''}>Custom API</option>
        </select>
      </div>
      
      <div class="crm-actions">
        <button id="connect-crm-btn" class="btn btn-primary" ${currentCrm ? '' : 'disabled'}>
          ${connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
        </button>
        <button id="sync-crm-btn" class="btn btn-secondary" ${connectionStatus === 'connected' ? '' : 'disabled'}>
          Sync Data
        </button>
      </div>
      
      ${lastSyncTime ? `
        <div class="last-sync-info">
          Last synchronized: ${lastSyncTime.toLocaleString()}
        </div>
      ` : ''}
    </div>
    
    <div class="crm-config-container" id="crm-config-container">
      <!-- CRM-specific configuration will be rendered here -->
    </div>
    
    <div class="field-mapping-container" id="field-mapping-container">
      <!-- Field mapping UI will be rendered here -->
    </div>
  `;
  
  // Add event listeners
  const crmTypeSelect = document.getElementById('crm-type');
  if (crmTypeSelect) {
    crmTypeSelect.addEventListener('change', () => {
      currentCrm = crmTypeSelect.value;
      saveCrmSettings();
      updateCrmUI();
    });
  }
  
  const connectBtn = document.getElementById('connect-crm-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', toggleCrmConnection);
  }
  
  const syncBtn = document.getElementById('sync-crm-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', syncCrmData);
  }
  
  // Update UI based on current settings
  updateCrmUI();
}

/**
 * Update CRM UI based on current settings
 */
function updateCrmUI() {
  // Update connect button state
  const connectBtn = document.getElementById('connect-crm-btn');
  if (connectBtn) {
    connectBtn.disabled = !currentCrm;
    connectBtn.textContent = connectionStatus === 'connected' ? 'Disconnect' : 'Connect';
  }
  
  // Update sync button state
  const syncBtn = document.getElementById('sync-crm-btn');
  if (syncBtn) {
    syncBtn.disabled = connectionStatus !== 'connected';
  }
  
  // Update connection status
  const statusElement = document.querySelector('.connection-status');
  if (statusElement) {
    statusElement.className = `connection-status ${connectionStatus}`;
    
    const statusText = statusElement.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = getStatusText();
    }
  }
  
  // Render CRM-specific configuration
  renderCrmConfig();
  
  // Render field mapping UI if connected
  if (connectionStatus === 'connected') {
    renderFieldMapping();
  }
}

/**
 * Get human-readable status text
 * @returns {string} - Status text
 */
function getStatusText() {
  switch (connectionStatus) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'disconnecting':
      return 'Disconnecting...';
    case 'error':
      return 'Connection Error';
    default:
      return 'Disconnected';
  }
}

/**
 * Toggle CRM connection (connect/disconnect)
 */
async function toggleCrmConnection() {
  if (connectionStatus === 'connected') {
    // Disconnect
    await disconnectFromCrm();
  } else {
    // Connect
    await connectToCrm();
  }
  
  // Update UI
  updateCrmUI();
}

/**
 * Connect to selected CRM
 */
async function connectToCrm() {
  if (!currentCrm) return;
  
  try {
    // Update status
    connectionStatus = 'connecting';
    updateCrmUI();
    
    // Get CRM credentials
    const credentials = getCrmCredentials();
    if (!credentials) {
      // Show credential input form
      showCredentialForm();
      return;
    }
    
    // Simulate API connection (this would be a real API call in production)
    await simulateApiCall(2000);
    
    // Update status
    connectionStatus = 'connected';
    logDebug(`Connected to ${currentCrm}`);
    
    // Save settings
    saveCrmSettings();
    
    // Update UI
    updateCrmUI();
  } catch (error) {
    logError('Error connecting to CRM', error);
    connectionStatus = 'error';
    updateCrmUI();
  }
}

/**
 * Disconnect from CRM
 */
async function disconnectFromCrm() {
  try {
    // Update status
    connectionStatus = 'disconnecting';
    updateCrmUI();
    
    // Simulate API disconnection
    await simulateApiCall(1000);
    
    // Update status
    connectionStatus = 'disconnected';
    logDebug(`Disconnected from ${currentCrm}`);
    
    // Save settings
    saveCrmSettings();
    
    // Update UI
    updateCrmUI();
  } catch (error) {
    logError('Error disconnecting from CRM', error);
    connectionStatus = 'error';
    updateCrmUI();
  }
}

/**
 * Sync data with CRM
 */
async function syncCrmData() {
  if (connectionStatus !== 'connected' || syncInProgress) return;
  
  try {
    // Update status
    syncInProgress = true;
    updateSyncButtonState(true);
    
    // Simulate API sync
    await simulateApiCall(3000);
    
    // Update last sync time
    lastSyncTime = new Date();
    saveCrmSettings();
    
    // Show success message
    showSyncSuccessMessage();
    
    logDebug(`Synced data with ${currentCrm}`);
  } catch (error) {
    logError('Error syncing data with CRM', error);
    showSyncErrorMessage(error.message);
  } finally {
    syncInProgress = false;
    updateSyncButtonState(false);
    updateCrmUI();
  }
}

/**
 * Update sync button state
 * @param {boolean} isSyncing - Whether sync is in progress
 */
function updateSyncButtonState(isSyncing) {
  const syncBtn = document.getElementById('sync-crm-btn');
  if (syncBtn) {
    syncBtn.disabled = isSyncing;
    syncBtn.innerHTML = isSyncing ? 
      '<span class="spinner"></span> Syncing...' : 
      'Sync Data';
  }
}

/**
 * Show sync success message
 */
function showSyncSuccessMessage() {
  // This would be implemented with a proper notification system
  alert('Data synchronized successfully!');
}

/**
 * Show sync error message
 * @param {string} message - Error message
 */
function showSyncErrorMessage(message) {
  // This would be implemented with a proper notification system
  alert(`Error syncing data: ${message}`);
}

/**
 * Get CRM credentials from storage
 * @returns {Object|null} - CRM credentials or null if not found
 */
function getCrmCredentials() {
  try {
    const credentialsJson = localStorage.getItem(`orderforecast_${currentCrm}_credentials`);
    return credentialsJson ? JSON.parse(credentialsJson) : null;
  } catch (error) {
    logError('Error getting CRM credentials', error);
    return null;
  }
}

/**
 * Show credential input form
 */
function showCredentialForm() {
  const configContainer = document.getElementById('crm-config-container');
  if (!configContainer) return;
  
  // Render form based on CRM type
  let formHtml = '';
  
  switch (currentCrm) {
    case CRM_TYPES.SALESFORCE:
      formHtml = `
        <div class="crm-credentials-form">
          <h4>Salesforce Credentials</h4>
          <div class="form-group">
            <label for="sf-client-id">Client ID</label>
            <input type="text" id="sf-client-id" placeholder="Enter Salesforce Client ID">
          </div>
          <div class="form-group">
            <label for="sf-client-secret">Client Secret</label>
            <input type="password" id="sf-client-secret" placeholder="Enter Salesforce Client Secret">
          </div>
          <div class="form-group">
            <label for="sf-username">Username</label>
            <input type="text" id="sf-username" placeholder="Enter Salesforce Username">
          </div>
          <div class="form-group">
            <label for="sf-password">Password</label>
            <input type="password" id="sf-password" placeholder="Enter Salesforce Password">
          </div>
          <button id="save-sf-credentials" class="btn btn-primary">Save & Connect</button>
        </div>
      `;
      break;
      
    case CRM_TYPES.HUBSPOT:
      formHtml = `
        <div class="crm-credentials-form">
          <h4>HubSpot Credentials</h4>
          <div class="form-group">
            <label for="hs-api-key">API Key</label>
            <input type="text" id="hs-api-key" placeholder="Enter HubSpot API Key">
          </div>
          <button id="save-hs-credentials" class="btn btn-primary">Save & Connect</button>
        </div>
      `;
      break;
      
    // Add other CRM types as needed
    
    default:
      formHtml = `
        <div class="crm-credentials-form">
          <h4>API Credentials</h4>
          <div class="form-group">
            <label for="api-url">API URL</label>
            <input type="text" id="api-url" placeholder="Enter API URL">
          </div>
          <div class="form-group">
            <label for="api-key">API Key</label>
            <input type="text" id="api-key" placeholder="Enter API Key">
          </div>
          <button id="save-api-credentials" class="btn btn-primary">Save & Connect</button>
        </div>
      `;
  }
  
  configContainer.innerHTML = formHtml;
  
  // Add event listeners for save buttons
  const saveButtons = configContainer.querySelectorAll('button[id^="save-"]');
  saveButtons.forEach(button => {
    button.addEventListener('click', saveCredentialsAndConnect);
  });
}

/**
 * Save credentials and connect to CRM
 */
function saveCredentialsAndConnect() {
  // Get credentials based on CRM type
  let credentials = {};
  
  switch (currentCrm) {
    case CRM_TYPES.SALESFORCE:
      credentials = {
        clientId: document.getElementById('sf-client-id').value,
        clientSecret: document.getElementById('sf-client-secret').value,
        username: document.getElementById('sf-username').value,
        password: document.getElementById('sf-password').value
      };
      break;
      
    case CRM_TYPES.HUBSPOT:
      credentials = {
        apiKey: document.getElementById('hs-api-key').value
      };
      break;
      
    // Add other CRM types as needed
    
    default:
      credentials = {
        apiUrl: document.getElementById('api-url').value,
        apiKey: document.getElementById('api-key').value
      };
  }
  
  // Save credentials
  try {
    localStorage.setItem(`orderforecast_${currentCrm}_credentials`, JSON.stringify(credentials));
    logDebug('Saved CRM credentials');
    
    // Connect to CRM
    connectToCrm();
  } catch (error) {
    logError('Error saving CRM credentials', error);
  }
}

/**
 * Render CRM-specific configuration
 */
function renderCrmConfig() {
  if (connectionStatus !== 'connected') return;
  
  const configContainer = document.getElementById('crm-config-container');
  if (!configContainer) return;
  
  // Render config based on CRM type
  let configHtml = '';
  
  switch (currentCrm) {
    case CRM_TYPES.SALESFORCE:
      configHtml = `
        <div class="crm-config">
          <h4>Salesforce Configuration</h4>
          <div class="form-group">
            <label for="sf-instance">Salesforce Instance</label>
            <input type="text" id="sf-instance" value="production" disabled>
          </div>
          <div class="form-group">
            <label for="sf-api-version">API Version</label>
            <select id="sf-api-version">
              <option value="v52.0">v52.0</option>
              <option value="v51.0">v51.0</option>
              <option value="v50.0">v50.0</option>
            </select>
          </div>
        </div>
      `;
      break;
      
    // Add other CRM types as needed
    
    default:
      configHtml = `
        <div class="crm-config">
          <h4>API Configuration</h4>
          <div class="form-group">
            <label for="api-timeout">Request Timeout (ms)</label>
            <input type="number" id="api-timeout" value="30000">
          </div>
          <div class="form-group">
            <label for="api-retry">Retry Attempts</label>
            <input type="number" id="api-retry" value="3">
          </div>
        </div>
      `;
  }
  
  configContainer.innerHTML = configHtml;
}

/**
 * Render field mapping UI
 */
function renderFieldMapping() {
  const mappingContainer = document.getElementById('field-mapping-container');
  if (!mappingContainer) return;
  
  // Get CRM fields (this would come from the API in production)
  const crmFields = getCrmFields();
  
  // Get local fields
  const localFields = getLocalFields();
  
  // Get saved mappings
  const savedMappings = getSavedMappings();
  
  // Render mapping UI
  let mappingHtml = `
    <div class="field-mapping">
      <h4>Field Mapping</h4>
      <p>Map your CRM fields to local fields</p>
      
      <table class="mapping-table">
        <thead>
          <tr>
            <th>Local Field</th>
            <th>CRM Field</th>
            <th>Direction</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add rows for each local field
  localFields.forEach(localField => {
    const mapping = savedMappings.find(m => m.localField === localField.id) || {
      localField: localField.id,
      crmField: '',
      direction: 'both'
    };
    
    mappingHtml += `
      <tr>
        <td>${localField.label}</td>
        <td>
          <select class="crm-field-select" data-local-field="${localField.id}">
            <option value="">-- Select Field --</option>
            ${crmFields.map(crmField => `
              <option value="${crmField.id}" ${mapping.crmField === crmField.id ? 'selected' : ''}>
                ${crmField.label}
              </option>
            `).join('')}
          </select>
        </td>
        <td>
          <select class="sync-direction-select" data-local-field="${localField.id}">
            <option value="both" ${mapping.direction === 'both' ? 'selected' : ''}>Both Ways</option>
            <option value="to_crm" ${mapping.direction === 'to_crm' ? 'selected' : ''}>To CRM</option>
            <option value="from_crm" ${mapping.direction === 'from_crm' ? 'selected' : ''}>From CRM</option>
          </select>
        </td>
      </tr>
    `;
  });
  
  mappingHtml += `
        </tbody>
      </table>
      
      <div class="mapping-actions">
        <button id="save-mapping-btn" class="btn btn-primary">Save Mapping</button>
        <button id="reset-mapping-btn" class="btn btn-secondary">Reset</button>
      </div>
    </div>
  `;
  
  mappingContainer.innerHTML = mappingHtml;
  
  // Add event listeners
  const saveMappingBtn = document.getElementById('save-mapping-btn');
  if (saveMappingBtn) {
    saveMappingBtn.addEventListener('click', saveFieldMapping);
  }
  
  const resetMappingBtn = document.getElementById('reset-mapping-btn');
  if (resetMappingBtn) {
    resetMappingBtn.addEventListener('click', resetFieldMapping);
  }
}

/**
 * Get CRM fields
 * @returns {Array} - CRM fields
 */
function getCrmFields() {
  // This would come from the API in production
  // For now, return mock data based on CRM type
  
  switch (currentCrm) {
    case CRM_TYPES.SALESFORCE:
      return [
        { id: 'sf_name', label: 'Name' },
        { id: 'sf_amount', label: 'Amount' },
        { id: 'sf_stage', label: 'Stage' },
        { id: 'sf_close_date', label: 'Close Date' },
        { id: 'sf_probability', label: 'Probability' },
        { id: 'sf_account', label: 'Account' },
        { id: 'sf_owner', label: 'Owner' }
      ];
      
    case CRM_TYPES.HUBSPOT:
      return [
        { id: 'hs_name', label: 'Deal Name' },
        { id: 'hs_amount', label: 'Deal Amount' },
        { id: 'hs_stage', label: 'Deal Stage' },
        { id: 'hs_close_date', label: 'Close Date' },
        { id: 'hs_probability', label: 'Probability to Close' },
        { id: 'hs_company', label: 'Company' },
        { id: 'hs_owner', label: 'Deal Owner' }
      ];
      
    // Add other CRM types as needed
    
    default:
      return [
        { id: 'api_name', label: 'Name' },
        { id: 'api_amount', label: 'Amount' },
        { id: 'api_stage', label: 'Stage' },
        { id: 'api_close_date', label: 'Close Date' },
        { id: 'api_probability', label: 'Probability' },
        { id: 'api_customer', label: 'Customer' },
        { id: 'api_owner', label: 'Owner' }
      ];
  }
}

/**
 * Get local fields
 * @returns {Array} - Local fields
 */
function getLocalFields() {
  // These are the fields in our local data model
  return [
    { id: 'dealName', label: 'Deal Name' },
    { id: 'forecastAmount', label: 'Forecast Amount' },
    { id: 'dealStage', label: 'Deal Stage' },
    { id: 'expectedCloseDate', label: 'Expected Close Date' },
    { id: 'probability', label: 'Probability' },
    { id: 'customerName', label: 'Customer Name' },
    { id: 'salesRep', label: 'Sales Rep' },
    { id: 'notes', label: 'Notes' }
  ];
}

/**
 * Get saved field mappings
 * @returns {Array} - Saved mappings
 */
function getSavedMappings() {
  try {
    const mappingsJson = localStorage.getItem(`orderforecast_${currentCrm}_mappings`);
    return mappingsJson ? JSON.parse(mappingsJson) : [];
  } catch (error) {
    logError('Error getting saved mappings', error);
    return [];
  }
}

/**
 * Save field mapping
 */
function saveFieldMapping() {
  try {
    const mappings = [];
    
    // Get all field selects
    const fieldSelects = document.querySelectorAll('.crm-field-select');
    fieldSelects.forEach(select => {
      const localField = select.getAttribute('data-local-field');
      const crmField = select.value;
      
      if (crmField) {
        // Get direction
        const directionSelect = document.querySelector(`.sync-direction-select[data-local-field="${localField}"]`);
        const direction = directionSelect ? directionSelect.value : 'both';
        
        mappings.push({
          localField,
          crmField,
          direction
        });
      }
    });
    
    // Save mappings
    localStorage.setItem(`orderforecast_${currentCrm}_mappings`, JSON.stringify(mappings));
    logDebug('Saved field mappings', mappings);
    
    // Show success message
    alert('Field mappings saved successfully!');
  } catch (error) {
    logError('Error saving field mappings', error);
    alert('Error saving field mappings');
  }
}

/**
 * Reset field mapping
 */
function resetFieldMapping() {
  if (confirm('Are you sure you want to reset all field mappings?')) {
    try {
      // Remove saved mappings
      localStorage.removeItem(`orderforecast_${currentCrm}_mappings`);
      logDebug('Reset field mappings');
      
      // Re-render mapping UI
      renderFieldMapping();
      
      // Show success message
      alert('Field mappings reset successfully!');
    } catch (error) {
      logError('Error resetting field mappings', error);
      alert('Error resetting field mappings');
    }
  }
}

/**
 * Simulate an API call with a delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} - Promise that resolves after the delay
 */
function simulateApiCall(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Export functions
export {
  initializeCrmConnector,
  connectToCrm,
  disconnectFromCrm,
  syncCrmData,
  CRM_TYPES
};

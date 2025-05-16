/**
 * crmIntegrationManager.js - CRM Integration Manager Component
 * Provides UI for managing CRM connections and field mappings
 */

import { logDebug, logError } from '../utils/logger.js';
import crmServiceManager from '../services/crm/crmServiceManager.js';

/**
 * CRM Integration Manager Component
 * Manages UI for CRM integration settings and field mappings
 */
class CrmIntegrationManager {
  constructor() {
    this.container = null;
    this.isInitialized = false;
    this.selectedObjectType = null;
    this.objectTypes = [];
    this.objectFields = {};
    this.localFields = [];
    this.fieldMappings = {};
  }

  /**
   * Initialize the component
   * @param {string|HTMLElement} container - Container element or selector
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(container) {
    try {
      if (typeof container === 'string') {
        this.container = document.querySelector(container);
      } else {
        this.container = container;
      }
      
      if (!this.container) {
        throw new Error('Container element not found');
      }

      // Initialize CRM service manager
      await crmServiceManager.initialize();
      
      // Render initial UI
      this.render();
      
      // Set up event listeners
      this._setupEventListeners();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      logError('Error initializing CRM Integration Manager:', error);
      return false;
    }
  }

  /**
   * Render the component
   */
  render() {
    if (!this.container) return;
    
    const activeCrmType = crmServiceManager.getActiveCrmType();
    const availableCrmTypes = crmServiceManager.getAvailableCrmTypes();
    
    const html = `
      <div class="crm-integration-manager">
        <div class="card">
          <div class="card-header">
            <h2>CRM Integration</h2>
          </div>
          <div class="card-body">
            <div class="crm-selection">
              <h3>Select CRM</h3>
              <div class="form-group">
                <label for="crm-type">CRM Type</label>
                <select id="crm-type" class="form-control">
                  <option value="">-- Select CRM --</option>
                  ${availableCrmTypes.map(crm => `
                    <option value="${crm.id}" ${activeCrmType === crm.id ? 'selected' : ''}>
                      ${crm.name}
                    </option>
                  `).join('')}
                </select>
              </div>
              
              <div id="crm-config-container" class="crm-config-container">
                ${this._renderCrmConfigForm(activeCrmType)}
              </div>
              
              <div class="form-group">
                <button id="save-crm-config" class="btn btn-primary">Save Configuration</button>
                <button id="test-connection" class="btn btn-secondary">Test Connection</button>
              </div>
            </div>
            
            <div class="crm-field-mapping ${!activeCrmType ? 'hidden' : ''}">
              <h3>Field Mapping</h3>
              <div class="form-group">
                <label for="object-type">Object Type</label>
                <select id="object-type" class="form-control">
                  <option value="">-- Select Object Type --</option>
                </select>
              </div>
              
              <div id="field-mapping-container" class="field-mapping-container">
                <!-- Field mapping table will be rendered here -->
              </div>
              
              <div class="form-group">
                <button id="save-field-mapping" class="btn btn-primary">Save Mapping</button>
                <button id="sync-data" class="btn btn-success">Sync Data</button>
              </div>
            </div>
          </div>
        </div>
        
        <div id="crm-status" class="alert hidden"></div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // If CRM is active, load object types
    if (activeCrmType) {
      this._loadObjectTypes();
    }
  }

  /**
   * Render CRM configuration form
   * @param {string} crmType - CRM type
   * @returns {string} - HTML for the form
   * @private
   */
  _renderCrmConfigForm(crmType) {
    if (!crmType) {
      return '<p>Select a CRM type to configure.</p>';
    }
    
    const config = crmServiceManager.getCrmConfig(crmType);
    
    if (crmType === 'salesforce') {
      return `
        <div class="salesforce-config">
          <div class="form-group">
            <label for="sf-client-id">Client ID</label>
            <input type="text" id="sf-client-id" class="form-control" value="${config.clientId || ''}">
          </div>
          <div class="form-group">
            <label for="sf-client-secret">Client Secret</label>
            <input type="password" id="sf-client-secret" class="form-control" value="${config.clientSecret ? '********' : ''}">
          </div>
          <div class="form-group">
            <label for="sf-redirect-uri">Redirect URI</label>
            <input type="text" id="sf-redirect-uri" class="form-control" value="${config.redirectUri || window.location.origin + '/oauth/callback'}">
          </div>
          <div class="form-group">
            <label for="sf-auth-method">Authentication Method</label>
            <select id="sf-auth-method" class="form-control">
              <option value="oauth" ${!config.username ? 'selected' : ''}>OAuth 2.0</option>
              <option value="password" ${config.username ? 'selected' : ''}>Username/Password</option>
            </select>
          </div>
          <div id="sf-oauth-fields" class="${config.username ? 'hidden' : ''}">
            <div class="form-group">
              <button id="sf-authorize" class="btn btn-secondary">Authorize with Salesforce</button>
            </div>
          </div>
          <div id="sf-password-fields" class="${!config.username ? 'hidden' : ''}">
            <div class="form-group">
              <label for="sf-username">Username</label>
              <input type="text" id="sf-username" class="form-control" value="${config.username || ''}">
            </div>
            <div class="form-group">
              <label for="sf-password">Password</label>
              <input type="password" id="sf-password" class="form-control">
            </div>
          </div>
        </div>
      `;
    } else if (crmType === 'hubspot') {
      return `
        <div class="hubspot-config">
          <div class="form-group">
            <label for="hs-auth-method">Authentication Method</label>
            <select id="hs-auth-method" class="form-control">
              <option value="apikey" ${config.apiKey ? 'selected' : ''}>API Key</option>
              <option value="oauth" ${!config.apiKey ? 'selected' : ''}>OAuth 2.0</option>
            </select>
          </div>
          <div id="hs-apikey-fields" class="${!config.apiKey ? 'hidden' : ''}">
            <div class="form-group">
              <label for="hs-api-key">API Key</label>
              <input type="text" id="hs-api-key" class="form-control" value="${config.apiKey || ''}">
            </div>
          </div>
          <div id="hs-oauth-fields" class="${config.apiKey ? 'hidden' : ''}">
            <div class="form-group">
              <label for="hs-client-id">Client ID</label>
              <input type="text" id="hs-client-id" class="form-control" value="${config.clientId || ''}">
            </div>
            <div class="form-group">
              <label for="hs-client-secret">Client Secret</label>
              <input type="password" id="hs-client-secret" class="form-control" value="${config.clientSecret ? '********' : ''}">
            </div>
            <div class="form-group">
              <label for="hs-redirect-uri">Redirect URI</label>
              <input type="text" id="hs-redirect-uri" class="form-control" value="${config.redirectUri || window.location.origin + '/oauth/callback'}">
            </div>
            <div class="form-group">
              <button id="hs-authorize" class="btn btn-secondary">Authorize with HubSpot</button>
            </div>
          </div>
        </div>
      `;
    } else {
      return '<p>Configuration not available for this CRM type.</p>';
    }
  }

  /**
   * Render field mapping table
   * @param {string} objectType - Object type
   * @returns {Promise<void>}
   * @private
   */
  async _renderFieldMappingTable(objectType) {
    const container = document.getElementById('field-mapping-container');
    if (!container) return;
    
    try {
      // Show loading state
      container.innerHTML = '<p>Loading fields...</p>';
      
      // Get CRM fields
      if (!this.objectFields[objectType]) {
        this.objectFields[objectType] = await crmServiceManager.getObjectFields(objectType);
      }
      
      // Get local fields if not already loaded
      if (this.localFields.length === 0) {
        this.localFields = await this._getLocalFields();
      }
      
      // Get existing field mapping
      this.fieldMappings[objectType] = await crmServiceManager.getFieldMapping(objectType) || {};
      
      // Render table
      let html = `
        <table class="table field-mapping-table">
          <thead>
            <tr>
              <th>CRM Field</th>
              <th>Local Field</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      // Sort fields by name
      const sortedCrmFields = [...this.objectFields[objectType]].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      for (const field of sortedCrmFields) {
        const mappedLocalField = this.fieldMappings[objectType][field.name] || '';
        
        html += `
          <tr>
            <td>${field.label} (${field.name})</td>
            <td>
              <select class="form-control field-mapping-select" data-crm-field="${field.name}">
                <option value="">-- Not Mapped --</option>
                ${this.localFields.map(localField => `
                  <option value="${localField.name}" ${mappedLocalField === localField.name ? 'selected' : ''}>
                    ${localField.label} (${localField.name})
                  </option>
                `).join('')}
              </select>
            </td>
          </tr>
        `;
      }
      
      html += `
          </tbody>
        </table>
      `;
      
      container.innerHTML = html;
    } catch (error) {
      logError(`Error rendering field mapping table for ${objectType}:`, error);
      container.innerHTML = `<div class="alert alert-danger">Error loading fields: ${error.message}</div>`;
    }
  }

  /**
   * Get local fields from the application
   * @returns {Promise<Array>} - List of local fields
   * @private
   */
  async _getLocalFields() {
    // This would typically come from your application's data model
    // For now, we'll return a static list of fields as an example
    return [
      { name: 'id', label: 'ID', type: 'string' },
      { name: 'name', label: 'Name', type: 'string' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'closeDate', label: 'Close Date', type: 'date' },
      { name: 'probability', label: 'Probability', type: 'number' },
      { name: 'stage', label: 'Stage', type: 'string' },
      { name: 'type', label: 'Type', type: 'string' },
      { name: 'description', label: 'Description', type: 'string' },
      { name: 'createdAt', label: 'Created At', type: 'datetime' },
      { name: 'updatedAt', label: 'Updated At', type: 'datetime' },
      { name: 'assignedTo', label: 'Assigned To', type: 'string' },
      { name: 'company', label: 'Company', type: 'string' },
      { name: 'contactName', label: 'Contact Name', type: 'string' },
      { name: 'contactEmail', label: 'Contact Email', type: 'string' },
      { name: 'contactPhone', label: 'Contact Phone', type: 'string' }
    ];
  }

  /**
   * Load object types from the active CRM
   * @private
   */
  async _loadObjectTypes() {
    try {
      const selectElement = document.getElementById('object-type');
      if (!selectElement) return;
      
      // Show loading state
      selectElement.innerHTML = '<option value="">Loading...</option>';
      
      // Get object types
      this.objectTypes = await crmServiceManager.getObjectTypes();
      
      // Render options
      let options = '<option value="">-- Select Object Type --</option>';
      
      for (const objectType of this.objectTypes) {
        options += `<option value="${objectType.name}">${objectType.label || objectType.name}</option>`;
      }
      
      selectElement.innerHTML = options;
    } catch (error) {
      logError('Error loading object types:', error);
      const selectElement = document.getElementById('object-type');
      if (selectElement) {
        selectElement.innerHTML = '<option value="">Error loading object types</option>';
      }
      
      this._showStatus('error', `Error loading object types: ${error.message}`);
    }
  }

  /**
   * Save CRM configuration
   * @private
   */
  async _saveCrmConfig() {
    try {
      const crmType = document.getElementById('crm-type').value;
      if (!crmType) {
        this._showStatus('error', 'Please select a CRM type');
        return;
      }
      
      let config = {};
      
      if (crmType === 'salesforce') {
        const authMethod = document.getElementById('sf-auth-method').value;
        
        config = {
          clientId: document.getElementById('sf-client-id').value,
          clientSecret: document.getElementById('sf-client-secret').value.includes('*') ? 
            crmServiceManager.getCrmConfig(crmType).clientSecret : 
            document.getElementById('sf-client-secret').value,
          redirectUri: document.getElementById('sf-redirect-uri').value
        };
        
        if (authMethod === 'password') {
          config.username = document.getElementById('sf-username').value;
          
          // Only include password if it's not empty (user entered a new one)
          const password = document.getElementById('sf-password').value;
          if (password) {
            config.password = password;
          }
        }
      } else if (crmType === 'hubspot') {
        const authMethod = document.getElementById('hs-auth-method').value;
        
        if (authMethod === 'apikey') {
          config = {
            apiKey: document.getElementById('hs-api-key').value
          };
        } else {
          config = {
            clientId: document.getElementById('hs-client-id').value,
            clientSecret: document.getElementById('hs-client-secret').value.includes('*') ? 
              crmServiceManager.getCrmConfig(crmType).clientSecret : 
              document.getElementById('hs-client-secret').value,
            redirectUri: document.getElementById('hs-redirect-uri').value
          };
        }
      }
      
      // Update configuration
      const success = await crmServiceManager.setActiveCrmType(crmType, config);
      
      if (success) {
        this._showStatus('success', 'CRM configuration saved successfully');
        
        // Reload the component to reflect changes
        this.render();
      } else {
        this._showStatus('error', 'Failed to save CRM configuration');
      }
    } catch (error) {
      logError('Error saving CRM configuration:', error);
      this._showStatus('error', `Error saving CRM configuration: ${error.message}`);
    }
  }

  /**
   * Test connection to the active CRM
   * @private
   */
  async _testConnection() {
    try {
      this._showStatus('info', 'Testing connection...');
      
      const result = await crmServiceManager.testConnection();
      
      if (result.success) {
        this._showStatus('success', 'Connection successful');
      } else {
        this._showStatus('error', `Connection failed: ${result.error}`);
      }
    } catch (error) {
      logError('Error testing CRM connection:', error);
      this._showStatus('error', `Error testing connection: ${error.message}`);
    }
  }

  /**
   * Save field mapping
   * @private
   */
  async _saveFieldMapping() {
    try {
      const objectType = document.getElementById('object-type').value;
      if (!objectType) {
        this._showStatus('error', 'Please select an object type');
        return;
      }
      
      // Collect field mappings
      const mapping = {};
      const mappingSelects = document.querySelectorAll('.field-mapping-select');
      
      mappingSelects.forEach(select => {
        const crmField = select.getAttribute('data-crm-field');
        const localField = select.value;
        
        if (localField) {
          mapping[crmField] = localField;
        }
      });
      
      // Save mapping
      const success = await crmServiceManager.setFieldMapping(objectType, mapping);
      
      if (success) {
        this._showStatus('success', 'Field mapping saved successfully');
        
        // Update local cache
        this.fieldMappings[objectType] = mapping;
      } else {
        this._showStatus('error', 'Failed to save field mapping');
      }
    } catch (error) {
      logError('Error saving field mapping:', error);
      this._showStatus('error', `Error saving field mapping: ${error.message}`);
    }
  }

  /**
   * Sync data with the CRM
   * @private
   */
  async _syncData() {
    try {
      const objectType = document.getElementById('object-type').value;
      if (!objectType) {
        this._showStatus('error', 'Please select an object type');
        return;
      }
      
      this._showStatus('info', 'Syncing data...');
      
      // Get local data (this would typically come from your application's data store)
      const localData = []; // Replace with actual data
      
      // Sync data
      const result = await crmServiceManager.syncData(objectType, {
        direction: 'both',
        localData,
        createMissing: true,
        updateExisting: true
      });
      
      if (result.created > 0 || result.updated > 0) {
        this._showStatus('success', `Sync completed: ${result.created} records created, ${result.updated} records updated`);
      } else if (result.errors.length > 0) {
        this._showStatus('warning', `Sync completed with errors: ${result.errors.length} errors occurred`);
      } else {
        this._showStatus('info', 'Sync completed: No changes made');
      }
    } catch (error) {
      logError('Error syncing data:', error);
      this._showStatus('error', `Error syncing data: ${error.message}`);
    }
  }

  /**
   * Show status message
   * @param {string} type - Message type (success, error, info, warning)
   * @param {string} message - Message text
   * @private
   */
  _showStatus(type, message) {
    const statusElement = document.getElementById('crm-status');
    if (!statusElement) return;
    
    statusElement.className = `alert alert-${type}`;
    statusElement.textContent = message;
    statusElement.classList.remove('hidden');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusElement.classList.add('hidden');
      }, 5000);
    }
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // CRM type change
    const crmTypeSelect = document.getElementById('crm-type');
    if (crmTypeSelect) {
      crmTypeSelect.addEventListener('change', () => {
        const configContainer = document.getElementById('crm-config-container');
        if (configContainer) {
          configContainer.innerHTML = this._renderCrmConfigForm(crmTypeSelect.value);
        }
        
        // Show/hide field mapping section
        const fieldMappingSection = document.querySelector('.crm-field-mapping');
        if (fieldMappingSection) {
          if (crmTypeSelect.value) {
            fieldMappingSection.classList.remove('hidden');
          } else {
            fieldMappingSection.classList.add('hidden');
          }
        }
        
        // Set up nested event listeners
        this._setupNestedEventListeners();
      });
    }
    
    // Save CRM config button
    const saveCrmConfigButton = document.getElementById('save-crm-config');
    if (saveCrmConfigButton) {
      saveCrmConfigButton.addEventListener('click', () => this._saveCrmConfig());
    }
    
    // Test connection button
    const testConnectionButton = document.getElementById('test-connection');
    if (testConnectionButton) {
      testConnectionButton.addEventListener('click', () => this._testConnection());
    }
    
    // Object type change
    const objectTypeSelect = document.getElementById('object-type');
    if (objectTypeSelect) {
      objectTypeSelect.addEventListener('change', () => {
        this.selectedObjectType = objectTypeSelect.value;
        if (this.selectedObjectType) {
          this._renderFieldMappingTable(this.selectedObjectType);
        } else {
          const container = document.getElementById('field-mapping-container');
          if (container) {
            container.innerHTML = '<p>Select an object type to configure field mapping.</p>';
          }
        }
      });
    }
    
    // Save field mapping button
    const saveFieldMappingButton = document.getElementById('save-field-mapping');
    if (saveFieldMappingButton) {
      saveFieldMappingButton.addEventListener('click', () => this._saveFieldMapping());
    }
    
    // Sync data button
    const syncDataButton = document.getElementById('sync-data');
    if (syncDataButton) {
      syncDataButton.addEventListener('click', () => this._syncData());
    }
    
    // Set up nested event listeners
    this._setupNestedEventListeners();
  }

  /**
   * Set up nested event listeners
   * @private
   */
  _setupNestedEventListeners() {
    // Salesforce auth method change
    const sfAuthMethodSelect = document.getElementById('sf-auth-method');
    if (sfAuthMethodSelect) {
      sfAuthMethodSelect.addEventListener('change', () => {
        const oauthFields = document.getElementById('sf-oauth-fields');
        const passwordFields = document.getElementById('sf-password-fields');
        
        if (sfAuthMethodSelect.value === 'oauth') {
          oauthFields.classList.remove('hidden');
          passwordFields.classList.add('hidden');
        } else {
          oauthFields.classList.add('hidden');
          passwordFields.classList.remove('hidden');
        }
      });
    }
    
    // HubSpot auth method change
    const hsAuthMethodSelect = document.getElementById('hs-auth-method');
    if (hsAuthMethodSelect) {
      hsAuthMethodSelect.addEventListener('change', () => {
        const apikeyFields = document.getElementById('hs-apikey-fields');
        const oauthFields = document.getElementById('hs-oauth-fields');
        
        if (hsAuthMethodSelect.value === 'apikey') {
          apikeyFields.classList.remove('hidden');
          oauthFields.classList.add('hidden');
        } else {
          apikeyFields.classList.add('hidden');
          oauthFields.classList.remove('hidden');
        }
      });
    }
    
    // Salesforce authorize button
    const sfAuthorizeButton = document.getElementById('sf-authorize');
    if (sfAuthorizeButton) {
      sfAuthorizeButton.addEventListener('click', () => this._authorizeWithSalesforce());
    }
    
    // HubSpot authorize button
    const hsAuthorizeButton = document.getElementById('hs-authorize');
    if (hsAuthorizeButton) {
      hsAuthorizeButton.addEventListener('click', () => this._authorizeWithHubspot());
    }
  }

  /**
   * Authorize with Salesforce
   * @private
   */
  _authorizeWithSalesforce() {
    try {
      const clientId = document.getElementById('sf-client-id').value;
      const redirectUri = document.getElementById('sf-redirect-uri').value;
      
      if (!clientId || !redirectUri) {
        this._showStatus('error', 'Client ID and Redirect URI are required');
        return;
      }
      
      // Construct authorization URL
      const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      
      // Open authorization window
      window.open(authUrl.toString(), 'salesforce_auth', 'width=600,height=700');
      
      // Show instructions
      this._showStatus('info', 'Please complete the authorization in the popup window. After authorization, you will be redirected back to the application.');
    } catch (error) {
      logError('Error initiating Salesforce authorization:', error);
      this._showStatus('error', `Error initiating authorization: ${error.message}`);
    }
  }

  /**
   * Authorize with HubSpot
   * @private
   */
  _authorizeWithHubspot() {
    try {
      const clientId = document.getElementById('hs-client-id').value;
      const redirectUri = document.getElementById('hs-redirect-uri').value;
      
      if (!clientId || !redirectUri) {
        this._showStatus('error', 'Client ID and Redirect URI are required');
        return;
      }
      
      // Construct authorization URL
      const authUrl = new URL('https://app.hubspot.com/oauth/authorize');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('scope', 'contacts content');
      
      // Open authorization window
      window.open(authUrl.toString(), 'hubspot_auth', 'width=600,height=700');
      
      // Show instructions
      this._showStatus('info', 'Please complete the authorization in the popup window. After authorization, you will be redirected back to the application.');
    } catch (error) {
      logError('Error initiating HubSpot authorization:', error);
      this._showStatus('error', `Error initiating authorization: ${error.message}`);
    }
  }

  /**
   * Handle OAuth callback
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @param {string} error - Error message
   * @returns {Promise<boolean>} - Success status
   */
  async handleOAuthCallback(code, state, error) {
    try {
      if (error) {
        this._showStatus('error', `Authorization failed: ${error}`);
        return false;
      }
      
      if (!code) {
        this._showStatus('error', 'No authorization code received');
        return false;
      }
      
      // Determine CRM type from state or active CRM
      const crmType = state || crmServiceManager.getActiveCrmType();
      
      if (!crmType) {
        this._showStatus('error', 'Unable to determine CRM type');
        return false;
      }
      
      // Authenticate with the CRM service
      const result = await crmServiceManager.authenticate({
        grantType: 'authorization_code',
        code
      });
      
      if (result.success) {
        this._showStatus('success', 'Authorization successful');
        
        // Reload the component to reflect changes
        this.render();
        
        return true;
      } else {
        this._showStatus('error', `Authorization failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      logError('Error handling OAuth callback:', error);
      this._showStatus('error', `Error handling authorization: ${error.message}`);
      return false;
    }
  }
}

// Export the CrmIntegrationManager class
export default CrmIntegrationManager;

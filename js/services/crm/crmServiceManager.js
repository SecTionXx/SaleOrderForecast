/**
 * crmServiceManager.js - CRM Service Manager
 * Manages different CRM service implementations and provides a unified interface
 */

import { logDebug, logError } from '../../utils/logger.js';
import salesforceCrmService from './salesforceCrmService.js';
import hubspotCrmService from './hubspotCrmService.js';

/**
 * CRM Service Manager
 * Manages different CRM service implementations and provides a unified interface
 */
class CrmServiceManager {
  constructor() {
    this.services = {
      salesforce: salesforceCrmService,
      hubspot: hubspotCrmService
    };
    this.activeService = null;
    this.activeCrmType = null;
    this.isInitialized = false;
    this.config = {};
  }

  /**
   * Initialize the CRM service manager
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(config = {}) {
    try {
      this.config = config;
      
      // Load saved configuration from local storage
      this._loadConfig();
      
      // If active CRM type is set, initialize that service
      if (this.activeCrmType && this.services[this.activeCrmType]) {
        const serviceConfig = this.config[this.activeCrmType] || {};
        const success = await this.services[this.activeCrmType].initialize(serviceConfig);
        
        if (success) {
          this.activeService = this.services[this.activeCrmType];
          this.isInitialized = true;
          return true;
        }
      }
      
      // No active service or initialization failed
      this.activeService = null;
      this.isInitialized = false;
      return false;
    } catch (error) {
      logError('Error initializing CRM service manager:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get available CRM types
   * @returns {Array} - List of available CRM types
   */
  getAvailableCrmTypes() {
    return Object.keys(this.services).map(key => ({
      id: key,
      name: this._getCrmDisplayName(key)
    }));
  }

  /**
   * Set the active CRM type
   * @param {string} crmType - CRM type to set as active
   * @param {Object} config - Configuration options for the CRM service
   * @returns {Promise<boolean>} - Success status
   */
  async setActiveCrmType(crmType, config = {}) {
    try {
      if (!this.services[crmType]) {
        throw new Error(`Unsupported CRM type: ${crmType}`);
      }
      
      // Update configuration
      this.config[crmType] = {
        ...this.config[crmType],
        ...config
      };
      
      // Initialize the service
      const success = await this.services[crmType].initialize(this.config[crmType]);
      
      if (success) {
        this.activeCrmType = crmType;
        this.activeService = this.services[crmType];
        this.isInitialized = true;
        
        // Save configuration
        this._saveConfig();
        
        return true;
      } else {
        throw new Error(`Failed to initialize ${crmType} service`);
      }
    } catch (error) {
      logError(`Error setting active CRM type to ${crmType}:`, error);
      return false;
    }
  }

  /**
   * Get the active CRM type
   * @returns {string|null} - Active CRM type
   */
  getActiveCrmType() {
    return this.activeCrmType;
  }

  /**
   * Get the active CRM service
   * @returns {Object|null} - Active CRM service
   */
  getActiveService() {
    return this.activeService;
  }

  /**
   * Get configuration for a specific CRM type
   * @param {string} crmType - CRM type
   * @returns {Object} - Configuration
   */
  getCrmConfig(crmType) {
    return this.config[crmType] || {};
  }

  /**
   * Update configuration for a specific CRM type
   * @param {string} crmType - CRM type
   * @param {Object} config - Configuration options
   * @returns {boolean} - Success status
   */
  updateCrmConfig(crmType, config) {
    try {
      if (!this.services[crmType]) {
        throw new Error(`Unsupported CRM type: ${crmType}`);
      }
      
      this.config[crmType] = {
        ...this.config[crmType],
        ...config
      };
      
      // Save configuration
      this._saveConfig();
      
      return true;
    } catch (error) {
      logError(`Error updating configuration for ${crmType}:`, error);
      return false;
    }
  }

  /**
   * Authenticate with the active CRM service
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(credentials) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.authenticate(credentials);
    } catch (error) {
      logError('Error authenticating with CRM service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test the connection to the active CRM service
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.testConnection();
    } catch (error) {
      logError('Error testing CRM connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available object types from the active CRM service
   * @returns {Promise<Array>} - List of available object types
   */
  async getObjectTypes() {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.getObjectTypes();
    } catch (error) {
      logError('Error getting CRM object types:', error);
      throw error;
    }
  }

  /**
   * Get fields for a specific object type from the active CRM service
   * @param {string} objectType - Object type name
   * @returns {Promise<Array>} - List of fields
   */
  async getObjectFields(objectType) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.getObjectFields(objectType);
    } catch (error) {
      logError(`Error getting CRM fields for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch records from the active CRM service
   * @param {string} objectType - Object type to fetch
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Records
   */
  async fetchRecords(objectType, options = {}) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.fetchRecords(objectType, options);
    } catch (error) {
      logError(`Error fetching CRM records for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single record by ID from the active CRM service
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} - Record
   */
  async fetchRecordById(objectType, recordId) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.fetchRecordById(objectType, recordId);
    } catch (error) {
      logError(`Error fetching CRM record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record in the active CRM service
   * @param {string} objectType - Object type
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async createRecord(objectType, data) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.createRecord(objectType, data);
    } catch (error) {
      logError(`Error creating CRM record for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing record in the active CRM service
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Updated record
   */
  async updateRecord(objectType, recordId, data) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.updateRecord(objectType, recordId, data);
    } catch (error) {
      logError(`Error updating CRM record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record from the active CRM service
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRecord(objectType, recordId) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.deleteRecord(objectType, recordId);
    } catch (error) {
      logError(`Error deleting CRM record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Search for records in the active CRM service
   * @param {string} objectType - Object type
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchRecords(objectType, query, options = {}) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.searchRecords(objectType, query, options);
    } catch (error) {
      logError(`Error searching CRM records for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Sync data between the active CRM service and local system
   * @param {string} objectType - Object type
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncData(objectType, options = {}) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.syncData(objectType, options);
    } catch (error) {
      logError(`Error syncing data with CRM for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Get the field mapping for a specific object type from the active CRM service
   * @param {string} objectType - Object type
   * @returns {Promise<Object>} - Field mapping
   */
  async getFieldMapping(objectType) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.getFieldMapping(objectType);
    } catch (error) {
      logError(`Error getting CRM field mapping for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Set the field mapping for a specific object type in the active CRM service
   * @param {string} objectType - Object type
   * @param {Object} mapping - Field mapping
   * @returns {Promise<boolean>} - Success status
   */
  async setFieldMapping(objectType, mapping) {
    try {
      if (!this.activeService) {
        throw new Error('No active CRM service');
      }
      
      return await this.activeService.setFieldMapping(objectType, mapping);
    } catch (error) {
      logError(`Error setting CRM field mapping for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Get a display name for a CRM type
   * @param {string} crmType - CRM type
   * @returns {string} - Display name
   * @private
   */
  _getCrmDisplayName(crmType) {
    const displayNames = {
      salesforce: 'Salesforce',
      hubspot: 'HubSpot'
    };
    
    return displayNames[crmType] || crmType;
  }

  /**
   * Load configuration from local storage
   * @private
   */
  _loadConfig() {
    try {
      const storedConfig = localStorage.getItem('crm_service_config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        this.config = parsedConfig.config || {};
        this.activeCrmType = parsedConfig.activeCrmType || null;
      }
    } catch (error) {
      logError('Error loading CRM service configuration:', error);
    }
  }

  /**
   * Save configuration to local storage
   * @private
   */
  _saveConfig() {
    try {
      // Filter out sensitive information
      const sanitizedConfig = {};
      
      for (const [crmType, config] of Object.entries(this.config)) {
        sanitizedConfig[crmType] = { ...config };
        
        // Remove sensitive data
        delete sanitizedConfig[crmType].clientSecret;
        delete sanitizedConfig[crmType].password;
      }
      
      const configToSave = {
        config: sanitizedConfig,
        activeCrmType: this.activeCrmType
      };
      
      localStorage.setItem('crm_service_config', JSON.stringify(configToSave));
    } catch (error) {
      logError('Error saving CRM service configuration:', error);
    }
  }
}

// Create and export singleton instance
const crmServiceManager = new CrmServiceManager();
export default crmServiceManager;

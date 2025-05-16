/**
 * salesforceCrmService.js - Salesforce CRM Service
 * Implements the CRM service interface for Salesforce
 */

import { logDebug, logError } from '../../utils/logger.js';
import { apiService } from '../../utils/apiService.js';
import CrmServiceInterface from './crmServiceInterface.js';

/**
 * Salesforce CRM Service
 * Provides integration with Salesforce CRM
 */
class SalesforceCrmService extends CrmServiceInterface {
  constructor() {
    super();
    this.baseUrl = null;
    this.apiVersion = 'v54.0';
    this.accessToken = null;
    this.instanceUrl = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.clientId = null;
    this.clientSecret = null;
    this.redirectUri = null;
    this.fieldMappings = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the Salesforce CRM service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(config) {
    try {
      const {
        clientId,
        clientSecret,
        redirectUri,
        apiVersion,
        accessToken,
        refreshToken,
        instanceUrl
      } = config;

      // Validate required config
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing required configuration: clientId, clientSecret, redirectUri');
      }

      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.redirectUri = redirectUri;
      
      if (apiVersion) {
        this.apiVersion = apiVersion;
      }

      // Set tokens if provided
      if (accessToken) {
        this.accessToken = accessToken;
      }
      
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
      
      if (instanceUrl) {
        this.instanceUrl = instanceUrl;
        this.baseUrl = `${instanceUrl}/services/data/${this.apiVersion}`;
      }

      // Load field mappings from local storage if available
      this._loadFieldMappings();

      this.isInitialized = true;
      return true;
    } catch (error) {
      logError('Error initializing Salesforce CRM service:', error);
      return false;
    }
  }

  /**
   * Authenticate with Salesforce
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(credentials) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const { grantType, code, username, password } = credentials;

      let authPayload;
      
      // OAuth 2.0 Authorization Code flow
      if (grantType === 'authorization_code' && code) {
        authPayload = {
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: code
        };
      } 
      // OAuth 2.0 Password flow
      else if (grantType === 'password' && username && password) {
        authPayload = {
          grant_type: 'password',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: username,
          password: password
        };
      }
      // Refresh token flow
      else if (grantType === 'refresh_token' && this.refreshToken) {
        authPayload = {
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken
        };
      } else {
        throw new Error('Invalid authentication parameters');
      }

      // Make auth request to Salesforce
      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(authPayload)
      });

      const authData = await response.json();

      if (!response.ok) {
        throw new Error(`Authentication failed: ${authData.error_description || authData.error || 'Unknown error'}`);
      }

      // Store auth data
      this.accessToken = authData.access_token;
      this.instanceUrl = authData.instance_url;
      this.baseUrl = `${authData.instance_url}/services/data/${this.apiVersion}`;
      
      if (authData.refresh_token) {
        this.refreshToken = authData.refresh_token;
      }

      // Calculate token expiry
      if (authData.expires_in) {
        this.tokenExpiry = Date.now() + (authData.expires_in * 1000);
      }

      return {
        success: true,
        accessToken: this.accessToken,
        instanceUrl: this.instanceUrl,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry
      };
    } catch (error) {
      logError('Salesforce authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test the connection to Salesforce
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Simple API call to test connection
      const response = await fetch(`${this.baseUrl}/sobjects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Connection test failed: ${errorData[0]?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      logError('Salesforce connection test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available object types from Salesforce
   * @returns {Promise<Array>} - List of available object types
   */
  async getObjectTypes() {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Get global objects description
      const response = await fetch(`${this.baseUrl}/sobjects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get object types: ${errorData[0]?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Filter to only include objects that are queryable and retrievable
      const objectTypes = data.sobjects
        .filter(obj => obj.queryable && obj.retrievable)
        .map(obj => ({
          name: obj.name,
          label: obj.label,
          keyPrefix: obj.keyPrefix,
          custom: obj.custom,
          customSetting: obj.customSetting,
          urls: obj.urls
        }));

      return objectTypes;
    } catch (error) {
      logError('Error getting Salesforce object types:', error);
      throw error;
    }
  }

  /**
   * Get fields for a specific object type
   * @param {string} objectType - Object type name
   * @returns {Promise<Array>} - List of fields
   */
  async getObjectFields(objectType) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Get object description
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/describe`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get object fields: ${errorData[0]?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Extract field information
      const fields = data.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        length: field.length,
        nillable: field.nillable,
        defaultValue: field.defaultValue,
        precision: field.precision,
        scale: field.scale,
        unique: field.unique,
        updateable: field.updateable,
        createable: field.createable,
        custom: field.custom,
        calculated: field.calculated,
        picklistValues: field.picklistValues,
        referenceTo: field.referenceTo,
        relationshipName: field.relationshipName
      }));

      return fields;
    } catch (error) {
      logError(`Error getting Salesforce fields for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch records from Salesforce
   * @param {string} objectType - Object type to fetch
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Records
   */
  async fetchRecords(objectType, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      const {
        fields = ['Id', 'Name'],
        where = '',
        limit = 100,
        offset = 0,
        orderBy = null
      } = options;

      // Build SOQL query
      let query = `SELECT ${fields.join(', ')} FROM ${objectType}`;
      
      if (where) {
        query += ` WHERE ${where}`;
      }
      
      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }
      
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      // URL encode the query
      const encodedQuery = encodeURIComponent(query);
      
      // Execute query
      const response = await fetch(`${this.baseUrl}/query?q=${encodedQuery}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch records: ${errorData[0]?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Apply field mapping if available
      const mappedRecords = this._applyFieldMapping(objectType, data.records, 'fromCrm');

      return {
        records: mappedRecords,
        totalSize: data.totalSize,
        done: data.done,
        nextRecordsUrl: data.nextRecordsUrl
      };
    } catch (error) {
      logError(`Error fetching Salesforce records for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single record by ID
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} - Record
   */
  async fetchRecordById(objectType, recordId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Get record
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/${recordId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch record: ${errorData[0]?.message || 'Unknown error'}`);
      }

      const record = await response.json();
      
      // Apply field mapping if available
      const mappedRecord = this._applyFieldMapping(objectType, [record], 'fromCrm')[0];

      return mappedRecord;
    } catch (error) {
      logError(`Error fetching Salesforce record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record in Salesforce
   * @param {string} objectType - Object type
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async createRecord(objectType, data) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Apply field mapping if available
      const mappedData = this._applyFieldMapping(objectType, [data], 'toCrm')[0];

      // Create record
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mappedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create record: ${errorData[0]?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Fetch the created record to return complete data
        return await this.fetchRecordById(objectType, result.id);
      } else {
        throw new Error('Failed to create record: Unknown error');
      }
    } catch (error) {
      logError(`Error creating Salesforce record for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing record in Salesforce
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Updated record
   */
  async updateRecord(objectType, recordId, data) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Apply field mapping if available
      const mappedData = this._applyFieldMapping(objectType, [data], 'toCrm')[0];

      // Remove ID field if present as it can't be updated
      if (mappedData.Id) {
        delete mappedData.Id;
      }

      // Update record
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mappedData)
      });

      // If successful, response will be empty with 204 status
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData[0]?.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(`Failed to update record: ${errorMessage}`);
      }

      // Fetch the updated record to return complete data
      return await this.fetchRecordById(objectType, recordId);
    } catch (error) {
      logError(`Error updating Salesforce record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record from Salesforce
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRecord(objectType, recordId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Delete record
      const response = await fetch(`${this.baseUrl}/sobjects/${objectType}/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      // If successful, response will be empty with 204 status
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData[0]?.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(`Failed to delete record: ${errorMessage}`);
      }

      return true;
    } catch (error) {
      logError(`Error deleting Salesforce record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Search for records in Salesforce
   * @param {string} objectType - Object type
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchRecords(objectType, query, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      const {
        fields = ['Id', 'Name'],
        limit = 100
      } = options;

      // Build SOSL query
      let soslQuery = `FIND {${query}} IN ALL FIELDS RETURNING ${objectType}(${fields.join(', ')}) LIMIT ${limit}`;

      // URL encode the query
      const encodedQuery = encodeURIComponent(soslQuery);
      
      // Execute search
      const response = await fetch(`${this.baseUrl}/search?q=${encodedQuery}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to search records: ${errorData[0]?.message || 'Unknown error'}`);
      }

      const searchResults = await response.json();
      
      // Extract records for the requested object type
      const records = searchResults.searchRecords || [];
      
      // Apply field mapping if available
      const mappedRecords = this._applyFieldMapping(objectType, records, 'fromCrm');

      return mappedRecords;
    } catch (error) {
      logError(`Error searching Salesforce records for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Sync data between Salesforce and local system
   * @param {string} objectType - Object type
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncData(objectType, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.accessToken || !this.baseUrl) {
        throw new Error('Not authenticated');
      }

      const {
        direction = 'both', // 'fromCrm', 'toCrm', or 'both'
        localData = [],
        fields = ['Id', 'Name'],
        modifiedSince = null,
        matchField = 'Id',
        createMissing = true,
        updateExisting = true,
        batchSize = 50
      } = options;

      // Results tracking
      const results = {
        direction,
        objectType,
        created: 0,
        updated: 0,
        errors: [],
        syncedRecords: []
      };

      // Sync from CRM to local
      if (direction === 'fromCrm' || direction === 'both') {
        let whereClause = '';
        if (modifiedSince) {
          whereClause = `LastModifiedDate >= ${modifiedSince.toISOString()}`;
        }

        // Fetch records from Salesforce
        const crmRecords = await this.fetchRecords(objectType, {
          fields,
          where: whereClause,
          limit: 1000 // Adjust as needed
        });

        // Create a map of local records by match field for quick lookup
        const localRecordsMap = new Map();
        localData.forEach(record => {
          const key = record[matchField];
          if (key) {
            localRecordsMap.set(key, record);
          }
        });

        // Process CRM records
        const syncedFromCrm = [];
        
        for (const crmRecord of crmRecords.records) {
          const matchValue = crmRecord[matchField];
          const localRecord = localRecordsMap.get(matchValue);
          
          // Record exists locally, update if needed
          if (localRecord) {
            if (updateExisting) {
              // Merge CRM data into local record
              syncedFromCrm.push({
                ...localRecord,
                ...crmRecord,
                _syncSource: 'crm',
                _syncTimestamp: new Date().toISOString()
              });
              results.updated++;
            }
          } 
          // Record doesn't exist locally, create if needed
          else if (createMissing) {
            syncedFromCrm.push({
              ...crmRecord,
              _syncSource: 'crm',
              _syncTimestamp: new Date().toISOString()
            });
            results.created++;
          }
        }
        
        results.syncedRecords = syncedFromCrm;
      }

      // Sync from local to CRM
      if (direction === 'toCrm' || direction === 'both') {
        // Process in batches to avoid hitting API limits
        for (let i = 0; i < localData.length; i += batchSize) {
          const batch = localData.slice(i, i + batchSize);
          
          for (const localRecord of batch) {
            try {
              const matchValue = localRecord[matchField];
              
              // Skip records without a match value
              if (!matchValue) continue;
              
              // Check if record exists in Salesforce
              let crmRecord = null;
              if (matchField === 'Id' && localRecord.Id) {
                try {
                  crmRecord = await this.fetchRecordById(objectType, localRecord.Id);
                } catch (error) {
                  // Record not found, will be created
                  if (error.message.includes('NOT_FOUND')) {
                    crmRecord = null;
                  } else {
                    throw error;
                  }
                }
              } else {
                // Search by custom field
                const searchResults = await this.fetchRecords(objectType, {
                  fields: ['Id'],
                  where: `${matchField} = '${matchValue}'`,
                  limit: 1
                });
                
                if (searchResults.records.length > 0) {
                  crmRecord = searchResults.records[0];
                }
              }
              
              // Record exists in CRM, update if needed
              if (crmRecord) {
                if (updateExisting) {
                  const updatedRecord = await this.updateRecord(objectType, crmRecord.Id, localRecord);
                  results.syncedRecords.push({
                    ...updatedRecord,
                    _syncSource: 'local',
                    _syncTimestamp: new Date().toISOString()
                  });
                  results.updated++;
                }
              } 
              // Record doesn't exist in CRM, create if needed
              else if (createMissing) {
                const createdRecord = await this.createRecord(objectType, localRecord);
                results.syncedRecords.push({
                  ...createdRecord,
                  _syncSource: 'local',
                  _syncTimestamp: new Date().toISOString()
                });
                results.created++;
              }
            } catch (error) {
              results.errors.push({
                record: localRecord,
                error: error.message
              });
              logError(`Error syncing record to Salesforce:`, error);
            }
          }
        }
      }

      return results;
    } catch (error) {
      logError(`Error syncing data with Salesforce for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Get the field mapping for a specific object type
   * @param {string} objectType - Object type
   * @returns {Promise<Object>} - Field mapping
   */
  async getFieldMapping(objectType) {
    try {
      return this.fieldMappings[objectType] || {};
    } catch (error) {
      logError(`Error getting field mapping for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Set the field mapping for a specific object type
   * @param {string} objectType - Object type
   * @param {Object} mapping - Field mapping
   * @returns {Promise<boolean>} - Success status
   */
  async setFieldMapping(objectType, mapping) {
    try {
      this.fieldMappings[objectType] = mapping;
      this._saveFieldMappings();
      return true;
    } catch (error) {
      logError(`Error setting field mapping for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _refreshToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const authResult = await this.authenticate({
        grantType: 'refresh_token'
      });

      return authResult.success;
    } catch (error) {
      logError('Error refreshing Salesforce token:', error);
      throw error;
    }
  }

  /**
   * Apply field mapping to records
   * @param {string} objectType - Object type
   * @param {Array} records - Records to map
   * @param {string} direction - Mapping direction ('toCrm' or 'fromCrm')
   * @returns {Array} - Mapped records
   * @private
   */
  _applyFieldMapping(objectType, records, direction) {
    const mapping = this.fieldMappings[objectType];
    
    // If no mapping exists, return records unchanged
    if (!mapping) {
      return records;
    }

    return records.map(record => {
      const mappedRecord = {};
      
      if (direction === 'toCrm') {
        // Map local fields to CRM fields
        Object.entries(record).forEach(([localField, value]) => {
          const crmField = Object.entries(mapping).find(([_, local]) => local === localField)?.[0];
          if (crmField) {
            mappedRecord[crmField] = value;
          } else {
            // Include fields that don't have a mapping
            mappedRecord[localField] = value;
          }
        });
      } else {
        // Map CRM fields to local fields
        Object.entries(record).forEach(([crmField, value]) => {
          const localField = mapping[crmField];
          if (localField) {
            mappedRecord[localField] = value;
          } else {
            // Include fields that don't have a mapping
            mappedRecord[crmField] = value;
          }
        });
      }
      
      return mappedRecord;
    });
  }

  /**
   * Load field mappings from local storage
   * @private
   */
  _loadFieldMappings() {
    try {
      const storedMappings = localStorage.getItem('salesforce_field_mappings');
      if (storedMappings) {
        this.fieldMappings = JSON.parse(storedMappings);
      }
    } catch (error) {
      logError('Error loading Salesforce field mappings:', error);
      this.fieldMappings = {};
    }
  }

  /**
   * Save field mappings to local storage
   * @private
   */
  _saveFieldMappings() {
    try {
      localStorage.setItem('salesforce_field_mappings', JSON.stringify(this.fieldMappings));
    } catch (error) {
      logError('Error saving Salesforce field mappings:', error);
    }
  }
}

// Create and export singleton instance
const salesforceCrmService = new SalesforceCrmService();
export default salesforceCrmService;

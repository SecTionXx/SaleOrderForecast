/**
 * hubspotCrmService.js - HubSpot CRM Service
 * Implements the CRM service interface for HubSpot
 */

import { logDebug, logError } from '../../utils/logger.js';
import { apiService } from '../../utils/apiService.js';
import CrmServiceInterface from './crmServiceInterface.js';

/**
 * HubSpot CRM Service
 * Provides integration with HubSpot CRM
 */
class HubspotCrmService extends CrmServiceInterface {
  constructor() {
    super();
    this.baseUrl = 'https://api.hubapi.com';
    this.apiKey = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.clientId = null;
    this.clientSecret = null;
    this.redirectUri = null;
    this.fieldMappings = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the HubSpot CRM service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(config) {
    try {
      const {
        apiKey,
        clientId,
        clientSecret,
        redirectUri,
        accessToken,
        refreshToken
      } = config;

      // Validate required config (either API key or OAuth credentials)
      if (!apiKey && (!clientId || !clientSecret || !redirectUri)) {
        throw new Error('Missing required configuration: either apiKey or OAuth credentials (clientId, clientSecret, redirectUri)');
      }

      if (apiKey) {
        this.apiKey = apiKey;
      }

      if (clientId && clientSecret && redirectUri) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
      }
      
      // Set tokens if provided
      if (accessToken) {
        this.accessToken = accessToken;
      }
      
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }

      // Load field mappings from local storage if available
      this._loadFieldMappings();

      this.isInitialized = true;
      return true;
    } catch (error) {
      logError('Error initializing HubSpot CRM service:', error);
      return false;
    }
  }

  /**
   * Authenticate with HubSpot
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(credentials) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const { grantType, code } = credentials;

      // If using API key, no need to authenticate
      if (this.apiKey) {
        return {
          success: true,
          message: 'Using API key authentication'
        };
      }

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

      // Make auth request to HubSpot
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(authPayload)
      });

      const authData = await response.json();

      if (!response.ok) {
        throw new Error(`Authentication failed: ${authData.message || 'Unknown error'}`);
      }

      // Store auth data
      this.accessToken = authData.access_token;
      
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
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry
      };
    } catch (error) {
      logError('HubSpot authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test the connection to HubSpot
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      if (!this.apiKey && !this.accessToken) {
        throw new Error('Not authenticated');
      }

      // Check if token needs refresh
      if (this.accessToken && this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Simple API call to test connection
      const endpoint = '/crm/v3/objects/contacts';
      const response = await this._makeRequest(endpoint, 'GET', null, { limit: 1 });

      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      logError('HubSpot connection test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available object types from HubSpot
   * @returns {Promise<Array>} - List of available object types
   */
  async getObjectTypes() {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // HubSpot has fixed object types in CRM
      const objectTypes = [
        { name: 'contacts', label: 'Contacts' },
        { name: 'companies', label: 'Companies' },
        { name: 'deals', label: 'Deals' },
        { name: 'tickets', label: 'Tickets' },
        { name: 'products', label: 'Products' },
        { name: 'line_items', label: 'Line Items' },
        { name: 'quotes', label: 'Quotes' }
      ];

      // Get custom objects if available
      try {
        const endpoint = '/crm/v3/schemas';
        const response = await this._makeRequest(endpoint, 'GET');
        
        if (response.results) {
          response.results.forEach(schema => {
            objectTypes.push({
              name: schema.name,
              label: schema.labels.singular,
              custom: true
            });
          });
        }
      } catch (error) {
        // Ignore errors for custom objects, as they might not be available
        logDebug('Error fetching custom objects:', error);
      }

      return objectTypes;
    } catch (error) {
      logError('Error getting HubSpot object types:', error);
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

      const endpoint = `/crm/v3/properties/${objectType}`;
      const response = await this._makeRequest(endpoint, 'GET');
      
      // Extract field information
      const fields = response.results.map(property => ({
        name: property.name,
        label: property.label,
        type: property.type,
        fieldType: property.fieldType,
        description: property.description,
        groupName: property.groupName,
        options: property.options,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
        formField: property.formField,
        readOnlyValue: property.readOnlyValue,
        hidden: property.hidden,
        calculated: property.calculated
      }));

      return fields;
    } catch (error) {
      logError(`Error getting HubSpot fields for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Fetch records from HubSpot
   * @param {string} objectType - Object type to fetch
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Records
   */
  async fetchRecords(objectType, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const {
        properties = [],
        limit = 100,
        after = null,
        filter = null,
        sorts = null,
        associations = []
      } = options;

      // Build query parameters
      const queryParams = {
        limit
      };
      
      if (properties.length > 0) {
        queryParams.properties = properties;
      }
      
      if (after) {
        queryParams.after = after;
      }
      
      if (associations.length > 0) {
        queryParams.associations = associations;
      }

      // Add filter if provided
      if (filter) {
        queryParams.filterGroups = [{ filters: [filter] }];
      }

      // Add sorts if provided
      if (sorts) {
        queryParams.sorts = sorts;
      }

      const endpoint = `/crm/v3/objects/${objectType}`;
      const response = await this._makeRequest(endpoint, 'GET', null, queryParams);
      
      // Apply field mapping if available
      const mappedRecords = this._applyFieldMapping(objectType, response.results, 'fromCrm');

      return {
        records: mappedRecords,
        total: response.total,
        paging: response.paging
      };
    } catch (error) {
      logError(`Error fetching HubSpot records for ${objectType}:`, error);
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

      const endpoint = `/crm/v3/objects/${objectType}/${recordId}`;
      const response = await this._makeRequest(endpoint, 'GET');
      
      // Apply field mapping if available
      const mappedRecord = this._applyFieldMapping(objectType, [response], 'fromCrm')[0];

      return mappedRecord;
    } catch (error) {
      logError(`Error fetching HubSpot record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new record in HubSpot
   * @param {string} objectType - Object type
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async createRecord(objectType, data) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // Apply field mapping if available
      const mappedData = this._applyFieldMapping(objectType, [data], 'toCrm')[0];

      // Prepare request body
      const requestBody = {
        properties: mappedData
      };

      const endpoint = `/crm/v3/objects/${objectType}`;
      const response = await this._makeRequest(endpoint, 'POST', requestBody);
      
      // Apply field mapping if available
      const mappedRecord = this._applyFieldMapping(objectType, [response], 'fromCrm')[0];

      return mappedRecord;
    } catch (error) {
      logError(`Error creating HubSpot record for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing record in HubSpot
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

      // Apply field mapping if available
      const mappedData = this._applyFieldMapping(objectType, [data], 'toCrm')[0];

      // Prepare request body
      const requestBody = {
        properties: mappedData
      };

      const endpoint = `/crm/v3/objects/${objectType}/${recordId}`;
      const response = await this._makeRequest(endpoint, 'PATCH', requestBody);
      
      // Apply field mapping if available
      const mappedRecord = this._applyFieldMapping(objectType, [response], 'fromCrm')[0];

      return mappedRecord;
    } catch (error) {
      logError(`Error updating HubSpot record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record from HubSpot
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRecord(objectType, recordId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const endpoint = `/crm/v3/objects/${objectType}/${recordId}`;
      await this._makeRequest(endpoint, 'DELETE');

      return true;
    } catch (error) {
      logError(`Error deleting HubSpot record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Search for records in HubSpot
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

      const {
        properties = [],
        limit = 100,
        after = null
      } = options;

      // Prepare request body
      const requestBody = {
        query,
        limit,
        properties
      };
      
      if (after) {
        requestBody.after = after;
      }

      const endpoint = `/crm/v3/objects/${objectType}/search`;
      const response = await this._makeRequest(endpoint, 'POST', requestBody);
      
      // Apply field mapping if available
      const mappedRecords = this._applyFieldMapping(objectType, response.results, 'fromCrm');

      return {
        records: mappedRecords,
        total: response.total,
        paging: response.paging
      };
    } catch (error) {
      logError(`Error searching HubSpot records for ${objectType}:`, error);
      throw error;
    }
  }

  /**
   * Sync data between HubSpot and local system
   * @param {string} objectType - Object type
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncData(objectType, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const {
        direction = 'both', // 'fromCrm', 'toCrm', or 'both'
        localData = [],
        properties = [],
        modifiedSince = null,
        matchProperty = 'id',
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
        // Fetch records from HubSpot
        const fetchOptions = {
          properties,
          limit: 100
        };
        
        if (modifiedSince) {
          fetchOptions.filter = {
            propertyName: 'lastmodifieddate',
            operator: 'GTE',
            value: modifiedSince.toISOString()
          };
        }

        let hasMore = true;
        let after = null;
        const crmRecords = [];

        // Fetch all pages of results
        while (hasMore) {
          if (after) {
            fetchOptions.after = after;
          }

          const response = await this.fetchRecords(objectType, fetchOptions);
          
          if (response.records && response.records.length > 0) {
            crmRecords.push(...response.records);
          }
          
          if (response.paging && response.paging.next && response.paging.next.after) {
            after = response.paging.next.after;
          } else {
            hasMore = false;
          }
        }

        // Create a map of local records by match property for quick lookup
        const localRecordsMap = new Map();
        localData.forEach(record => {
          const key = record[matchProperty];
          if (key) {
            localRecordsMap.set(key, record);
          }
        });

        // Process CRM records
        const syncedFromCrm = [];
        
        for (const crmRecord of crmRecords) {
          const matchValue = crmRecord[matchProperty];
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
              const matchValue = localRecord[matchProperty];
              
              // Skip records without a match value
              if (!matchValue) continue;
              
              // Check if record exists in HubSpot
              let crmRecord = null;
              if (matchProperty === 'id' && localRecord.id) {
                try {
                  crmRecord = await this.fetchRecordById(objectType, localRecord.id);
                } catch (error) {
                  // Record not found, will be created
                  if (error.message.includes('not found')) {
                    crmRecord = null;
                  } else {
                    throw error;
                  }
                }
              } else {
                // Search by custom property
                const searchOptions = {
                  filter: {
                    propertyName: matchProperty,
                    operator: 'EQ',
                    value: matchValue
                  },
                  properties: ['id'],
                  limit: 1
                };
                
                const searchResults = await this.fetchRecords(objectType, searchOptions);
                
                if (searchResults.records && searchResults.records.length > 0) {
                  crmRecord = searchResults.records[0];
                }
              }
              
              // Record exists in CRM, update if needed
              if (crmRecord) {
                if (updateExisting) {
                  const updatedRecord = await this.updateRecord(objectType, crmRecord.id, localRecord);
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
              logError(`Error syncing record to HubSpot:`, error);
            }
          }
        }
      }

      return results;
    } catch (error) {
      logError(`Error syncing data with HubSpot for ${objectType}:`, error);
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
   * Make a request to the HubSpot API
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<Object>} - Response data
   * @private
   */
  async _makeRequest(endpoint, method = 'GET', data = null, queryParams = {}) {
    try {
      // Check if token needs refresh
      if (this.accessToken && this.tokenExpiry && Date.now() > this.tokenExpiry) {
        await this._refreshToken();
      }

      // Build URL with query parameters
      let url = `${this.baseUrl}${endpoint}`;
      
      if (Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams();
        
        for (const [key, value] of Object.entries(queryParams)) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, item));
          } else {
            params.append(key, value);
          }
        }
        
        url += `?${params.toString()}`;
      }

      // Set up headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authentication
      if (this.apiKey) {
        headers['hapikey'] = this.apiKey;
      } else if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      } else {
        throw new Error('No authentication method available');
      }

      // Make request
      const requestOptions = {
        method,
        headers
      };
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);
      
      // Handle no content responses
      if (response.status === 204) {
        return { success: true };
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${responseData.message || response.statusText}`);
      }

      return responseData;
    } catch (error) {
      logError('HubSpot API request error:', error);
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
      logError('Error refreshing HubSpot token:', error);
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
      const storedMappings = localStorage.getItem('hubspot_field_mappings');
      if (storedMappings) {
        this.fieldMappings = JSON.parse(storedMappings);
      }
    } catch (error) {
      logError('Error loading HubSpot field mappings:', error);
      this.fieldMappings = {};
    }
  }

  /**
   * Save field mappings to local storage
   * @private
   */
  _saveFieldMappings() {
    try {
      localStorage.setItem('hubspot_field_mappings', JSON.stringify(this.fieldMappings));
    } catch (error) {
      logError('Error saving HubSpot field mappings:', error);
    }
  }
}

// Create and export singleton instance
const hubspotCrmService = new HubspotCrmService();
export default hubspotCrmService;

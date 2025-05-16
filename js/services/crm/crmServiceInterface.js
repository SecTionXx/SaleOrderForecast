/**
 * crmServiceInterface.js - CRM Service Interface
 * Defines the standard interface for all CRM service implementations
 */

/**
 * CRM Service Interface
 * Abstract class that defines the methods that all CRM service implementations must provide
 */
class CrmServiceInterface {
  /**
   * Initialize the CRM service
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(config) {
    throw new Error('Method not implemented: initialize');
  }

  /**
   * Authenticate with the CRM service
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticate(credentials) {
    throw new Error('Method not implemented: authenticate');
  }

  /**
   * Test the connection to the CRM service
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    throw new Error('Method not implemented: testConnection');
  }

  /**
   * Get available object types from the CRM
   * @returns {Promise<Array>} - List of available object types
   */
  async getObjectTypes() {
    throw new Error('Method not implemented: getObjectTypes');
  }

  /**
   * Get fields for a specific object type
   * @param {string} objectType - Object type name
   * @returns {Promise<Array>} - List of fields
   */
  async getObjectFields(objectType) {
    throw new Error('Method not implemented: getObjectFields');
  }

  /**
   * Fetch records from the CRM
   * @param {string} objectType - Object type to fetch
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Records
   */
  async fetchRecords(objectType, options = {}) {
    throw new Error('Method not implemented: fetchRecords');
  }

  /**
   * Fetch a single record by ID
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} - Record
   */
  async fetchRecordById(objectType, recordId) {
    throw new Error('Method not implemented: fetchRecordById');
  }

  /**
   * Create a new record in the CRM
   * @param {string} objectType - Object type
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Created record
   */
  async createRecord(objectType, data) {
    throw new Error('Method not implemented: createRecord');
  }

  /**
   * Update an existing record in the CRM
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @param {Object} data - Record data
   * @returns {Promise<Object>} - Updated record
   */
  async updateRecord(objectType, recordId, data) {
    throw new Error('Method not implemented: updateRecord');
  }

  /**
   * Delete a record from the CRM
   * @param {string} objectType - Object type
   * @param {string} recordId - Record ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRecord(objectType, recordId) {
    throw new Error('Method not implemented: deleteRecord');
  }

  /**
   * Search for records in the CRM
   * @param {string} objectType - Object type
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchRecords(objectType, query, options = {}) {
    throw new Error('Method not implemented: searchRecords');
  }

  /**
   * Sync data between the CRM and local system
   * @param {string} objectType - Object type
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncData(objectType, options = {}) {
    throw new Error('Method not implemented: syncData');
  }

  /**
   * Get the field mapping for a specific object type
   * @param {string} objectType - Object type
   * @returns {Promise<Object>} - Field mapping
   */
  async getFieldMapping(objectType) {
    throw new Error('Method not implemented: getFieldMapping');
  }

  /**
   * Set the field mapping for a specific object type
   * @param {string} objectType - Object type
   * @param {Object} mapping - Field mapping
   * @returns {Promise<boolean>} - Success status
   */
  async setFieldMapping(objectType, mapping) {
    throw new Error('Method not implemented: setFieldMapping');
  }
}

export default CrmServiceInterface;

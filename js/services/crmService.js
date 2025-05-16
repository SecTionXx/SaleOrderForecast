/**
 * crmService.js - CRM Integration API Service
 * Handles all API operations related to CRM connectivity
 */

import apiService from '../utils/apiService.js';
import {
  getCrmConnectEndpoint,
  getCrmSyncEndpoint,
  getCrmSettingsEndpoint
} from '../utils/apiEndpoints.js';
import { logDebug, logError } from '../utils/logger.js';

// Supported CRM types
export const CRM_TYPES = {
  SALESFORCE: 'salesforce',
  HUBSPOT: 'hubspot',
  ZOHO: 'zoho',
  PIPEDRIVE: 'pipedrive',
  DYNAMICS: 'dynamics365',
  CUSTOM: 'custom'
};

/**
 * Connect to a CRM
 * @param {string} crmType - Type of CRM to connect to
 * @param {Object} credentials - Connection credentials
 * @returns {Promise<Object>} - Connection result
 */
async function connectToCrm(crmType, credentials) {
  try {
    const endpoint = getCrmConnectEndpoint();
    
    const requestData = {
      crmType,
      credentials
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError(`Error connecting to ${crmType} CRM:`, error);
    throw error;
  }
}

/**
 * Disconnect from a CRM
 * @returns {Promise<Object>} - Disconnection result
 */
async function disconnectFromCrm() {
  try {
    const endpoint = `${getCrmConnectEndpoint()}/disconnect`;
    return await apiService.post(endpoint);
  } catch (error) {
    logError('Error disconnecting from CRM:', error);
    throw error;
  }
}

/**
 * Get current CRM connection status
 * @returns {Promise<Object>} - Connection status
 */
async function getCrmConnectionStatus() {
  try {
    const endpoint = `${getCrmConnectEndpoint()}/status`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error getting CRM connection status:', error);
    throw error;
  }
}

/**
 * Sync data with connected CRM
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} - Sync result
 */
async function syncWithCrm(options = {}) {
  try {
    const endpoint = getCrmSyncEndpoint();
    return await apiService.post(endpoint, options);
  } catch (error) {
    logError('Error syncing with CRM:', error);
    throw error;
  }
}

/**
 * Get CRM field mappings
 * @returns {Promise<Object>} - Field mappings
 */
async function getFieldMappings() {
  try {
    const endpoint = `${getCrmSettingsEndpoint()}/mappings`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error getting CRM field mappings:', error);
    throw error;
  }
}

/**
 * Update CRM field mappings
 * @param {Object} mappings - Updated field mappings
 * @returns {Promise<Object>} - Updated mappings
 */
async function updateFieldMappings(mappings) {
  try {
    const endpoint = `${getCrmSettingsEndpoint()}/mappings`;
    return await apiService.put(endpoint, mappings);
  } catch (error) {
    logError('Error updating CRM field mappings:', error);
    throw error;
  }
}

/**
 * Get available CRM fields
 * @returns {Promise<Object>} - Available fields
 */
async function getAvailableCrmFields() {
  try {
    const endpoint = `${getCrmSettingsEndpoint()}/available-fields`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error getting available CRM fields:', error);
    throw error;
  }
}

/**
 * Get CRM sync settings
 * @returns {Promise<Object>} - Sync settings
 */
async function getSyncSettings() {
  try {
    const endpoint = `${getCrmSettingsEndpoint()}/sync`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error getting CRM sync settings:', error);
    throw error;
  }
}

/**
 * Update CRM sync settings
 * @param {Object} settings - Updated sync settings
 * @returns {Promise<Object>} - Updated settings
 */
async function updateSyncSettings(settings) {
  try {
    const endpoint = `${getCrmSettingsEndpoint()}/sync`;
    return await apiService.put(endpoint, settings);
  } catch (error) {
    logError('Error updating CRM sync settings:', error);
    throw error;
  }
}

/**
 * Get sync history
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Sync history
 */
async function getSyncHistory(options = {}) {
  try {
    const endpoint = `${getCrmSyncEndpoint()}/history`;
    
    const queryParams = new URLSearchParams();
    
    // Add options to query params
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return await apiService.get(url);
  } catch (error) {
    logError('Error getting CRM sync history:', error);
    throw error;
  }
}

/**
 * Test CRM connection
 * @param {string} crmType - Type of CRM to test
 * @param {Object} credentials - Connection credentials
 * @returns {Promise<Object>} - Test result
 */
async function testCrmConnection(crmType, credentials) {
  try {
    const endpoint = `${getCrmConnectEndpoint()}/test`;
    
    const requestData = {
      crmType,
      credentials
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError(`Error testing ${crmType} CRM connection:`, error);
    throw error;
  }
}

// Export all CRM service functions
export {
  connectToCrm,
  disconnectFromCrm,
  getCrmConnectionStatus,
  syncWithCrm,
  getFieldMappings,
  updateFieldMappings,
  getAvailableCrmFields,
  getSyncSettings,
  updateSyncSettings,
  getSyncHistory,
  testCrmConnection
};

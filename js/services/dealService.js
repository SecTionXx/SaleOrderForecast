/**
 * dealService.js - Deal API Service
 * Handles all API operations related to deals
 */

import apiService from '../utils/apiService.js';
import {
  getDealsListEndpoint,
  getDealCreateEndpoint,
  getDealUpdateEndpoint,
  getDealDeleteEndpoint,
  getDealHistoryEndpoint
} from '../utils/apiEndpoints.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Get all deals
 * @param {Object} filters - Optional filters to apply
 * @returns {Promise<Array>} - Array of deals
 */
async function getAllDeals(filters = {}) {
  try {
    const endpoint = getDealsListEndpoint();
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return await apiService.get(url);
  } catch (error) {
    logError('Error fetching deals:', error);
    throw error;
  }
}

/**
 * Get a single deal by ID
 * @param {string|number} id - Deal ID
 * @returns {Promise<Object>} - Deal object
 */
async function getDealById(id) {
  try {
    const endpoint = `${getDealsListEndpoint()}/${id}`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError(`Error fetching deal ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new deal
 * @param {Object} dealData - Deal data
 * @returns {Promise<Object>} - Created deal
 */
async function createDeal(dealData) {
  try {
    const endpoint = getDealCreateEndpoint();
    return await apiService.post(endpoint, dealData);
  } catch (error) {
    logError('Error creating deal:', error);
    throw error;
  }
}

/**
 * Update an existing deal
 * @param {string|number} id - Deal ID
 * @param {Object} dealData - Updated deal data
 * @returns {Promise<Object>} - Updated deal
 */
async function updateDeal(id, dealData) {
  try {
    const endpoint = getDealUpdateEndpoint(id);
    return await apiService.put(endpoint, dealData);
  } catch (error) {
    logError(`Error updating deal ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a deal
 * @param {string|number} id - Deal ID
 * @returns {Promise<Object>} - Response data
 */
async function deleteDeal(id) {
  try {
    const endpoint = getDealDeleteEndpoint(id);
    return await apiService.delete(endpoint);
  } catch (error) {
    logError(`Error deleting deal ${id}:`, error);
    throw error;
  }
}

/**
 * Get deal history
 * @param {string|number} id - Deal ID
 * @returns {Promise<Array>} - Deal history
 */
async function getDealHistory(id) {
  try {
    const endpoint = getDealHistoryEndpoint(id);
    return await apiService.get(endpoint);
  } catch (error) {
    logError(`Error fetching history for deal ${id}:`, error);
    throw error;
  }
}

/**
 * Batch update multiple deals
 * @param {Array} deals - Array of deal objects with IDs
 * @returns {Promise<Array>} - Updated deals
 */
async function batchUpdateDeals(deals) {
  try {
    const endpoint = `${getDealsListEndpoint()}/batch`;
    return await apiService.put(endpoint, { deals });
  } catch (error) {
    logError('Error batch updating deals:', error);
    throw error;
  }
}

/**
 * Export deals to specified format
 * @param {string} format - Export format (csv, excel, pdf)
 * @param {Array} dealIds - Optional array of deal IDs to export
 * @param {Object} filters - Optional filters to apply
 * @returns {Promise<Blob>} - Exported file as blob
 */
async function exportDeals(format, dealIds = [], filters = {}) {
  try {
    const endpoint = `${getDealsListEndpoint()}/export`;
    
    const requestData = {
      format,
      filters
    };
    
    if (dealIds.length > 0) {
      requestData.dealIds = dealIds;
    }
    
    // Use different response type for file downloads
    const options = {
      responseType: 'blob'
    };
    
    return await apiService.post(endpoint, requestData, options);
  } catch (error) {
    logError(`Error exporting deals to ${format}:`, error);
    throw error;
  }
}

// Export all deal service functions
export {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealHistory,
  batchUpdateDeals,
  exportDeals
};

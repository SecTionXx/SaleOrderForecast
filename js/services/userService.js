/**
 * userService.js - User API Service
 * Handles all API operations related to users
 */

import apiService from '../utils/apiService.js';
import {
  getUsersListEndpoint,
  getUserProfileEndpoint,
  getUserUpdateEndpoint
} from '../utils/apiEndpoints.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Get all users
 * @param {Object} filters - Optional filters to apply
 * @returns {Promise<Array>} - Array of users
 */
async function getAllUsers(filters = {}) {
  try {
    const endpoint = getUsersListEndpoint();
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
    logError('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get current user profile
 * @returns {Promise<Object>} - User profile
 */
async function getCurrentUserProfile() {
  try {
    const endpoint = getUserProfileEndpoint();
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {string|number} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} - Updated user
 */
async function updateUserProfile(id, userData) {
  try {
    const endpoint = getUserUpdateEndpoint(id);
    return await apiService.put(endpoint, userData);
  } catch (error) {
    logError(`Error updating user ${id}:`, error);
    throw error;
  }
}

/**
 * Update current user's profile
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} - Updated user
 */
async function updateCurrentUserProfile(userData) {
  try {
    const endpoint = getUserProfileEndpoint();
    return await apiService.put(endpoint, userData);
  } catch (error) {
    logError('Error updating current user profile:', error);
    throw error;
  }
}

/**
 * Change user password
 * @param {Object} passwordData - Object containing old and new passwords
 * @returns {Promise<Object>} - Response data
 */
async function changePassword(passwordData) {
  try {
    const endpoint = `${getUserProfileEndpoint()}/password`;
    return await apiService.post(endpoint, passwordData);
  } catch (error) {
    logError('Error changing password:', error);
    throw error;
  }
}

/**
 * Get user preferences
 * @returns {Promise<Object>} - User preferences
 */
async function getUserPreferences() {
  try {
    const endpoint = `${getUserProfileEndpoint()}/preferences`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching user preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 * @param {Object} preferences - Updated preferences
 * @returns {Promise<Object>} - Updated preferences
 */
async function updateUserPreferences(preferences) {
  try {
    const endpoint = `${getUserProfileEndpoint()}/preferences`;
    return await apiService.put(endpoint, preferences);
  } catch (error) {
    logError('Error updating user preferences:', error);
    throw error;
  }
}

// Export all user service functions
export {
  getAllUsers,
  getCurrentUserProfile,
  updateUserProfile,
  updateCurrentUserProfile,
  changePassword,
  getUserPreferences,
  updateUserPreferences
};

/**
 * collaborationService.js - Collaboration API Service
 * Handles all operations related to team collaboration features
 */

import apiService from '../utils/apiService.js';
import { logDebug, logError } from '../utils/logger.js';

// Base collaboration endpoint
const COLLABORATION_ENDPOINT = '/api/collaboration';

/**
 * Add a comment to a deal
 * @param {string|number} dealId - Deal ID
 * @param {string} comment - Comment text
 * @param {Array} mentions - Array of user IDs mentioned in the comment
 * @returns {Promise<Object>} - Created comment
 */
async function addComment(dealId, comment, mentions = []) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/deals/${dealId}/comments`;
    
    const requestData = {
      comment,
      mentions
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError(`Error adding comment to deal ${dealId}:`, error);
    throw error;
  }
}

/**
 * Get comments for a deal
 * @param {string|number} dealId - Deal ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Deal comments
 */
async function getComments(dealId, options = {}) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/deals/${dealId}/comments`;
    
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
    logError(`Error fetching comments for deal ${dealId}:`, error);
    throw error;
  }
}

/**
 * Update a comment
 * @param {string|number} dealId - Deal ID
 * @param {string|number} commentId - Comment ID
 * @param {string} comment - Updated comment text
 * @param {Array} mentions - Updated array of user IDs mentioned in the comment
 * @returns {Promise<Object>} - Updated comment
 */
async function updateComment(dealId, commentId, comment, mentions = []) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/deals/${dealId}/comments/${commentId}`;
    
    const requestData = {
      comment,
      mentions
    };
    
    return await apiService.put(endpoint, requestData);
  } catch (error) {
    logError(`Error updating comment ${commentId} for deal ${dealId}:`, error);
    throw error;
  }
}

/**
 * Delete a comment
 * @param {string|number} dealId - Deal ID
 * @param {string|number} commentId - Comment ID
 * @returns {Promise<Object>} - Result
 */
async function deleteComment(dealId, commentId) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/deals/${dealId}/comments/${commentId}`;
    return await apiService.delete(endpoint);
  } catch (error) {
    logError(`Error deleting comment ${commentId} for deal ${dealId}:`, error);
    throw error;
  }
}

/**
 * Assign a deal to a user
 * @param {string|number} dealId - Deal ID
 * @param {string|number} userId - User ID
 * @returns {Promise<Object>} - Updated deal
 */
async function assignDeal(dealId, userId) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/deals/${dealId}/assign`;
    
    const requestData = {
      userId
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError(`Error assigning deal ${dealId} to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get activity feed for a deal
 * @param {string|number} dealId - Deal ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Activity feed
 */
async function getActivityFeed(dealId, options = {}) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/deals/${dealId}/activity`;
    
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
    logError(`Error fetching activity feed for deal ${dealId}:`, error);
    throw error;
  }
}

/**
 * Get team members
 * @returns {Promise<Array>} - Team members
 */
async function getTeamMembers() {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/team`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching team members:', error);
    throw error;
  }
}

/**
 * Get team member details
 * @param {string|number} userId - User ID
 * @returns {Promise<Object>} - Team member details
 */
async function getTeamMember(userId) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/team/${userId}`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError(`Error fetching team member ${userId}:`, error);
    throw error;
  }
}

/**
 * Get deals assigned to a team member
 * @param {string|number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Assigned deals
 */
async function getAssignedDeals(userId, options = {}) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/team/${userId}/deals`;
    
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
    logError(`Error fetching deals assigned to user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user mentions
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Mentions
 */
async function getMentions(options = {}) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/mentions`;
    
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
    logError('Error fetching mentions:', error);
    throw error;
  }
}

/**
 * Mark mentions as read
 * @param {Array} mentionIds - IDs of mentions to mark as read
 * @returns {Promise<Object>} - Result
 */
async function markMentionsAsRead(mentionIds) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/mentions/mark-read`;
    
    const requestData = {
      mentionIds: Array.isArray(mentionIds) ? mentionIds : [mentionIds]
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error marking mentions as read:', error);
    throw error;
  }
}

/**
 * Create a task
 * @param {Object} task - Task data
 * @returns {Promise<Object>} - Created task
 */
async function createTask(task) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/tasks`;
    return await apiService.post(endpoint, task);
  } catch (error) {
    logError('Error creating task:', error);
    throw error;
  }
}

/**
 * Get tasks
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Tasks
 */
async function getTasks(options = {}) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/tasks`;
    
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
    logError('Error fetching tasks:', error);
    throw error;
  }
}

/**
 * Update a task
 * @param {string|number} taskId - Task ID
 * @param {Object} task - Updated task data
 * @returns {Promise<Object>} - Updated task
 */
async function updateTask(taskId, task) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/tasks/${taskId}`;
    return await apiService.put(endpoint, task);
  } catch (error) {
    logError(`Error updating task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Delete a task
 * @param {string|number} taskId - Task ID
 * @returns {Promise<Object>} - Result
 */
async function deleteTask(taskId) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/tasks/${taskId}`;
    return await apiService.delete(endpoint);
  } catch (error) {
    logError(`Error deleting task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Complete a task
 * @param {string|number} taskId - Task ID
 * @returns {Promise<Object>} - Updated task
 */
async function completeTask(taskId) {
  try {
    const endpoint = `${COLLABORATION_ENDPOINT}/tasks/${taskId}/complete`;
    return await apiService.post(endpoint);
  } catch (error) {
    logError(`Error completing task ${taskId}:`, error);
    throw error;
  }
}

// Export all collaboration service functions
export {
  addComment,
  getComments,
  updateComment,
  deleteComment,
  assignDeal,
  getActivityFeed,
  getTeamMembers,
  getTeamMember,
  getAssignedDeals,
  getMentions,
  markMentionsAsRead,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  completeTask
};

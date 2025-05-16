/**
 * notificationService.js - Notification API Service
 * Handles all operations related to the notification system
 */

import apiService from '../utils/apiService.js';
import { logDebug, logError } from '../utils/logger.js';

// Base notification endpoint
const NOTIFICATIONS_ENDPOINT = '/api/notifications';

// Notification types
export const NOTIFICATION_TYPES = {
  DEAL_CREATED: 'deal_created',
  DEAL_UPDATED: 'deal_updated',
  DEAL_STAGE_CHANGED: 'deal_stage_changed',
  DEAL_AMOUNT_CHANGED: 'deal_amount_changed',
  DEAL_CLOSED: 'deal_closed',
  DEAL_COMMENT: 'deal_comment',
  DEAL_ASSIGNED: 'deal_assigned',
  MENTION: 'mention',
  SYSTEM: 'system',
  ALERT: 'alert'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Get all notifications for the current user
 * @param {Object} options - Query options (limit, offset, read status, etc.)
 * @returns {Promise<Object>} - Notifications and metadata
 */
async function getNotifications(options = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    // Add options to query params
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${NOTIFICATIONS_ENDPOINT}?${queryString}` : NOTIFICATIONS_ENDPOINT;
    
    return await apiService.get(url);
  } catch (error) {
    logError('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @returns {Promise<Object>} - Unread count
 */
async function getUnreadCount() {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/unread-count`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching unread notification count:', error);
    throw error;
  }
}

/**
 * Mark notifications as read
 * @param {Array} notificationIds - IDs of notifications to mark as read
 * @returns {Promise<Object>} - Result
 */
async function markAsRead(notificationIds) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/mark-read`;
    
    const requestData = {
      notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error marking notifications as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} - Result
 */
async function markAllAsRead() {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/mark-all-read`;
    return await apiService.post(endpoint);
  } catch (error) {
    logError('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notifications
 * @param {Array} notificationIds - IDs of notifications to delete
 * @returns {Promise<Object>} - Result
 */
async function deleteNotifications(notificationIds) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/delete`;
    
    const requestData = {
      notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error deleting notifications:', error);
    throw error;
  }
}

/**
 * Get notification preferences
 * @returns {Promise<Object>} - Notification preferences
 */
async function getNotificationPreferences() {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/preferences`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching notification preferences:', error);
    throw error;
  }
}

/**
 * Update notification preferences
 * @param {Object} preferences - Updated preferences
 * @returns {Promise<Object>} - Updated preferences
 */
async function updateNotificationPreferences(preferences) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/preferences`;
    return await apiService.put(endpoint, preferences);
  } catch (error) {
    logError('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Create a notification rule
 * @param {Object} rule - Notification rule configuration
 * @returns {Promise<Object>} - Created rule
 */
async function createNotificationRule(rule) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/rules`;
    return await apiService.post(endpoint, rule);
  } catch (error) {
    logError('Error creating notification rule:', error);
    throw error;
  }
}

/**
 * Get notification rules
 * @returns {Promise<Array>} - Notification rules
 */
async function getNotificationRules() {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/rules`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching notification rules:', error);
    throw error;
  }
}

/**
 * Update a notification rule
 * @param {string} ruleId - ID of the rule to update
 * @param {Object} rule - Updated rule configuration
 * @returns {Promise<Object>} - Updated rule
 */
async function updateNotificationRule(ruleId, rule) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/rules/${ruleId}`;
    return await apiService.put(endpoint, rule);
  } catch (error) {
    logError(`Error updating notification rule ${ruleId}:`, error);
    throw error;
  }
}

/**
 * Delete a notification rule
 * @param {string} ruleId - ID of the rule to delete
 * @returns {Promise<Object>} - Result
 */
async function deleteNotificationRule(ruleId) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/rules/${ruleId}`;
    return await apiService.delete(endpoint);
  } catch (error) {
    logError(`Error deleting notification rule ${ruleId}:`, error);
    throw error;
  }
}

/**
 * Send a test notification
 * @param {Object} notification - Test notification configuration
 * @returns {Promise<Object>} - Result
 */
async function sendTestNotification(notification) {
  try {
    const endpoint = `${NOTIFICATIONS_ENDPOINT}/test`;
    return await apiService.post(endpoint, notification);
  } catch (error) {
    logError('Error sending test notification:', error);
    throw error;
  }
}

// Client-side notification handling
const notificationListeners = [];

/**
 * Add a notification listener
 * @param {Function} listener - Notification listener function
 * @returns {number} - Listener ID for removal
 */
function addNotificationListener(listener) {
  return notificationListeners.push(listener) - 1;
}

/**
 * Remove a notification listener
 * @param {number} id - Listener ID to remove
 */
function removeNotificationListener(id) {
  if (id >= 0 && id < notificationListeners.length) {
    notificationListeners[id] = null;
  }
}

/**
 * Dispatch a notification to all listeners
 * @param {Object} notification - Notification object
 */
function dispatchNotification(notification) {
  for (const listener of notificationListeners) {
    if (listener) {
      try {
        listener(notification);
      } catch (error) {
        logError('Error in notification listener:', error);
      }
    }
  }
}

// Export all notification service functions
export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotificationRule,
  getNotificationRules,
  updateNotificationRule,
  deleteNotificationRule,
  sendTestNotification,
  addNotificationListener,
  removeNotificationListener,
  dispatchNotification
};

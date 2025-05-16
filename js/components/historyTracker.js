/**
 * historyTracker.js - Handles deal history tracking and versioning
 * Tracks changes to deals and provides history viewing functionality
 */

import { getCurrentUser } from '../auth/auth.js';

// Constants
const HISTORY_STORAGE_KEY = 'orderforecast_deal_history';
const MAX_HISTORY_ITEMS_PER_DEAL = 50; // Limit history items per deal to prevent excessive storage usage

/**
 * Initialize the history tracker functionality
 */
function initializeHistoryTracker() {
  console.log('Initializing history tracker functionality...');
  
  // Add event listeners for viewing history
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('view-history-btn') || 
        (event.target.parentElement && event.target.parentElement.classList.contains('view-history-btn'))) {
      event.preventDefault();
      const dealId = event.target.closest('[data-deal-id]').dataset.dealId;
      showHistoryModal(dealId);
    }
  });
}

/**
 * Track a change to a deal
 * @param {Object} dealData - The new deal data
 * @param {String} action - The action performed (create, update, delete)
 * @param {Object} previousData - The previous deal data (for updates)
 */
function trackDealChange(dealData, action, previousData = null) {
  // Get current user
  const user = getCurrentUser();
  const username = user ? user.username : 'unknown';
  
  // Create history entry
  const historyEntry = {
    dealId: dealData.dealId,
    timestamp: new Date().toISOString(),
    action: action,
    user: username,
    changes: {}
  };
  
  // For updates, calculate what changed
  if (action === 'update' && previousData) {
    historyEntry.changes = calculateChanges(previousData, dealData);
  } else if (action === 'create') {
    // For creates, store all fields
    historyEntry.changes = Object.keys(dealData).reduce((acc, key) => {
      acc[key] = { after: dealData[key] };
      return acc;
    }, {});
  } else if (action === 'delete') {
    // For deletes, store the deleted data
    historyEntry.changes = Object.keys(dealData).reduce((acc, key) => {
      acc[key] = { before: dealData[key] };
      return acc;
    }, {});
  }
  
  // Save to history
  saveToHistory(historyEntry);
}

/**
 * Calculate changes between previous and new deal data
 * @param {Object} previousData - Previous deal data
 * @param {Object} newData - New deal data
 * @returns {Object} - Object containing changed fields with before/after values
 */
function calculateChanges(previousData, newData) {
  const changes = {};
  
  // Compare all fields in new data
  Object.keys(newData).forEach(key => {
    // Skip fields that shouldn't be tracked
    if (['lastUpdated', 'updatedBy'].includes(key)) return;
    
    // Check if value changed
    if (previousData[key] !== newData[key]) {
      changes[key] = {
        before: previousData[key],
        after: newData[key]
      };
    }
  });
  
  return changes;
}

/**
 * Save a history entry to storage
 * @param {Object} historyEntry - The history entry to save
 */
function saveToHistory(historyEntry) {
  try {
    // Get existing history
    const history = getHistory();
    
    // Get history for this deal
    const dealHistory = history[historyEntry.dealId] || [];
    
    // Add new entry to the beginning of the array
    dealHistory.unshift(historyEntry);
    
    // Limit the number of history items per deal
    if (dealHistory.length > MAX_HISTORY_ITEMS_PER_DEAL) {
      dealHistory.length = MAX_HISTORY_ITEMS_PER_DEAL;
    }
    
    // Update history
    history[historyEntry.dealId] = dealHistory;
    
    // Save back to storage
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Get the complete history from storage
 * @returns {Object} - History object with deal IDs as keys
 */
function getHistory() {
  try {
    const historyString = localStorage.getItem(HISTORY_STORAGE_KEY);
    return historyString ? JSON.parse(historyString) : {};
  } catch (error) {
    console.error('Error getting history:', error);
    return {};
  }
}

/**
 * Get history for a specific deal
 * @param {String} dealId - The deal ID
 * @returns {Array} - Array of history entries for the deal
 */
function getDealHistory(dealId) {
  const history = getHistory();
  return history[dealId] || [];
}

/**
 * Show the history modal for a deal
 * @param {String} dealId - The deal ID
 */
function showHistoryModal(dealId) {
  // Get deal history
  const dealHistory = getDealHistory(dealId);
  
  if (dealHistory.length === 0) {
    showNotification('No history available for this deal', 'info');
    return;
  }
  
  // Get deal name from the page
  const dealRow = document.querySelector(`tr[data-deal-id="${dealId}"]`);
  const dealName = dealRow ? 
    (dealRow.dataset.customerName + ' - ' + dealRow.dataset.projectName) : 
    'Deal #' + dealId;
  
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'history-modal-backdrop';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'history-modal';
  
  // Create modal header
  const header = document.createElement('div');
  header.className = 'history-modal-header';
  
  const title = document.createElement('h3');
  title.textContent = 'History: ' + dealName;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.className = 'close-btn';
  closeButton.id = 'close-history-modal';
  closeButton.onclick = hideHistoryModal;
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create history timeline
  const timeline = document.createElement('div');
  timeline.className = 'history-timeline';
  
  // Add history items to timeline
  dealHistory.forEach((entry, index) => {
    const historyItem = createHistoryItem(entry, index);
    timeline.appendChild(historyItem);
  });
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(timeline);
  backdrop.appendChild(modal);
  
  // Add to document
  document.body.appendChild(backdrop);
  
  // Add event listener for close button
  document.getElementById('close-history-modal').addEventListener('click', hideHistoryModal);
  
  // Add event listener for clicking outside modal
  backdrop.addEventListener('click', function(event) {
    if (event.target === backdrop) {
      hideHistoryModal();
    }
  });
}

/**
 * Create a history item element
 * @param {Object} entry - History entry
 * @param {Number} index - Index in the timeline
 * @returns {HTMLElement} - History item element
 */
function createHistoryItem(entry, index) {
  const item = document.createElement('div');
  item.className = 'history-item';
  
  // Add timeline connector (except for first item)
  if (index > 0) {
    const connector = document.createElement('div');
    connector.className = 'timeline-connector';
    item.appendChild(connector);
  }
  
  // Create timestamp
  const timestamp = document.createElement('div');
  timestamp.className = 'history-timestamp';
  
  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  timestamp.innerHTML = `<span class="history-date">${formattedDate}</span> <span class="history-time">${formattedTime}</span>`;
  
  // Create action badge
  const actionBadge = document.createElement('div');
  actionBadge.className = 'history-action-badge';
  
  // Set badge color based on action
  let actionText = '';
  switch (entry.action) {
    case 'create':
      actionBadge.classList.add('create');
      actionText = 'Created';
      break;
    case 'update':
      actionBadge.classList.add('update');
      actionText = 'Updated';
      break;
    case 'delete':
      actionBadge.classList.add('delete');
      actionText = 'Deleted';
      break;
  }
  
  actionBadge.textContent = actionText;
  
  // Create user info
  const userInfo = document.createElement('div');
  userInfo.className = 'history-user-info';
  userInfo.textContent = `by ${entry.user}`;
  
  // Create header container
  const header = document.createElement('div');
  header.className = 'history-item-header';
  header.appendChild(timestamp);
  header.appendChild(actionBadge);
  header.appendChild(userInfo);
  
  // Create changes container
  const changes = document.createElement('div');
  changes.className = 'history-changes';
  
  // Add changes
  const changeEntries = Object.entries(entry.changes);
  
  if (changeEntries.length > 0) {
    const changesList = document.createElement('ul');
    
    changeEntries.forEach(([field, values]) => {
      const changeItem = document.createElement('li');
      
      // Format field name
      const fieldName = formatFieldName(field);
      
      // Format change text based on action
      if (entry.action === 'create') {
        changeItem.innerHTML = `<span class="field-name">${fieldName}:</span> <span class="field-value">${formatValue(values.after)}</span>`;
      } else if (entry.action === 'update') {
        changeItem.innerHTML = `<span class="field-name">${fieldName}:</span> <span class="field-value-before">${formatValue(values.before)}</span> <span class="arrow">→</span> <span class="field-value-after">${formatValue(values.after)}</span>`;
      } else if (entry.action === 'delete') {
        changeItem.innerHTML = `<span class="field-name">${fieldName}:</span> <span class="field-value">${formatValue(values.before)}</span>`;
      }
      
      changesList.appendChild(changeItem);
    });
    
    changes.appendChild(changesList);
  } else {
    const noChanges = document.createElement('p');
    noChanges.className = 'no-changes';
    noChanges.textContent = 'No changes recorded';
    changes.appendChild(noChanges);
  }
  
  // Assemble history item
  item.appendChild(header);
  item.appendChild(changes);
  
  return item;
}

/**
 * Format a field name for display
 * @param {String} fieldName - The raw field name
 * @returns {String} - Formatted field name
 */
function formatFieldName(fieldName) {
  // Convert camelCase to Title Case with spaces
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format a value for display
 * @param {*} value - The value to format
 * @returns {String} - Formatted value
 */
function formatValue(value) {
  if (value === undefined || value === null) {
    return '<em>None</em>';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    // Check if it's a currency value
    if (['dealValue', 'weightedValue'].includes(field)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    
    return value.toString();
  }
  
  if (typeof value === 'string') {
    // Check if it's a date
    if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return value || '<em>Empty</em>';
  }
  
  return String(value);
}

/**
 * Hide the history modal
 */
function hideHistoryModal() {
  const backdrop = document.getElementById('history-modal-backdrop');
  if (backdrop) {
    document.body.removeChild(backdrop);
  }
}

/**
 * Show a notification message
 * @param {String} message - The message to display
 * @param {String} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Set notification type
  notification.className = `notification ${type}`;
  
  // Set message
  notification.textContent = message;
  
  // Show notification
  notification.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Export functions
export {
  initializeHistoryTracker,
  trackDealChange,
  getDealHistory,
  showHistoryModal,
  hideHistoryModal
};

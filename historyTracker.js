// historyTracker.js - Handles deal history tracking and versioning

/**
 * History Tracker module for Order Forecast
 * Tracks changes to deals and provides history viewing functionality
 */

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
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.error('Cannot track changes: No authenticated user');
    return;
  }
  
  // Create history entry
  const historyEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    dealId: dealData.id,
    dealData: { ...dealData }, // Clone to prevent reference issues
  };
  
  // For updates, calculate and store changes
  if (action === 'update' && previousData) {
    historyEntry.changes = calculateChanges(previousData, dealData);
  }
  
  // Save to history
  saveToHistory(historyEntry);
  
  // Log the action
  console.log(`Deal ${action} tracked for deal ID: ${dealData.id}`);
}

/**
 * Calculate changes between previous and new deal data
 * @param {Object} previousData - Previous deal data
 * @param {Object} newData - New deal data
 * @returns {Object} - Object containing changed fields with before/after values
 */
function calculateChanges(previousData, newData) {
  const changes = {};
  
  // Compare all properties in newData
  for (const key in newData) {
    // Skip id and internal properties
    if (key === 'id' || key.startsWith('_')) continue;
    
    // Check if the value has changed
    if (JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = {
        before: previousData[key],
        after: newData[key]
      };
    }
  }
  
  return changes;
}

/**
 * Save a history entry to storage
 * @param {Object} historyEntry - The history entry to save
 */
function saveToHistory(historyEntry) {
  // Get existing history
  const history = getHistory();
  
  // Get deal-specific history
  const dealHistory = history[historyEntry.dealId] || [];
  
  // Add new entry to the beginning
  dealHistory.unshift(historyEntry);
  
  // Limit history size
  if (dealHistory.length > MAX_HISTORY_ITEMS_PER_DEAL) {
    dealHistory.length = MAX_HISTORY_ITEMS_PER_DEAL;
  }
  
  // Update history
  history[historyEntry.dealId] = dealHistory;
  
  // Save to storage
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

/**
 * Get the complete history from storage
 * @returns {Object} - History object with deal IDs as keys
 */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || {};
  } catch (error) {
    console.error('Error reading history:', error);
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
  
  // Get deal data for the title
  const allDealsData = window.allDealsData || [];
  const dealData = allDealsData.find(deal => deal.id === dealId);
  const dealName = dealData ? `${dealData.customerName} - ${dealData.projectName}` : `Deal ${dealId}`;
  
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
  title.textContent = `History for ${dealName}`;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.className = 'close-btn';
  closeButton.onclick = hideHistoryModal;
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create history content
  const content = document.createElement('div');
  content.className = 'history-content';
  
  // Create timeline
  const timeline = document.createElement('div');
  timeline.className = 'history-timeline';
  
  // Add history items to timeline
  dealHistory.forEach((entry, index) => {
    const historyItem = createHistoryItem(entry, index);
    timeline.appendChild(historyItem);
  });
  
  content.appendChild(timeline);
  
  // Create modal footer
  const footer = document.createElement('div');
  footer.className = 'history-modal-footer';
  
  const closeFooterButton = document.createElement('button');
  closeFooterButton.textContent = 'Close';
  closeFooterButton.className = 'btn btn-secondary';
  closeFooterButton.onclick = hideHistoryModal;
  
  footer.appendChild(closeFooterButton);
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  
  // Add to document
  document.body.appendChild(backdrop);
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
  
  // Add timeline dot
  const dot = document.createElement('div');
  dot.className = 'timeline-dot';
  
  // Color based on action
  if (entry.action === 'create') {
    dot.classList.add('create-dot');
  } else if (entry.action === 'update') {
    dot.classList.add('update-dot');
  } else if (entry.action === 'delete') {
    dot.classList.add('delete-dot');
  }
  
  item.appendChild(dot);
  
  // Create content
  const content = document.createElement('div');
  content.className = 'history-item-content';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'history-item-header';
  
  // Format timestamp
  const timestamp = new Date(entry.timestamp);
  const formattedDate = timestamp.toLocaleDateString();
  const formattedTime = timestamp.toLocaleTimeString();
  
  // Create action text
  let actionText = '';
  switch (entry.action) {
    case 'create':
      actionText = 'Created';
      break;
    case 'update':
      actionText = 'Updated';
      break;
    case 'delete':
      actionText = 'Deleted';
      break;
    default:
      actionText = entry.action;
  }
  
  header.innerHTML = `<strong>${actionText}</strong> on ${formattedDate} at ${formattedTime} by ${entry.userName}`;
  content.appendChild(header);
  
  // For updates, show changes
  if (entry.action === 'update' && entry.changes) {
    const changesList = document.createElement('ul');
    changesList.className = 'changes-list';
    
    // Create list items for each change
    let hasChanges = false;
    for (const key in entry.changes) {
      hasChanges = true;
      const change = entry.changes[key];
      
      const changeItem = document.createElement('li');
      
      // Format the field name for display
      const fieldName = formatFieldName(key);
      
      // Format values based on type
      const beforeValue = formatValue(change.before);
      const afterValue = formatValue(change.after);
      
      changeItem.innerHTML = `<strong>${fieldName}:</strong> ${beforeValue} → ${afterValue}`;
      changesList.appendChild(changeItem);
    }
    
    if (hasChanges) {
      content.appendChild(changesList);
    } else {
      const noChanges = document.createElement('p');
      noChanges.textContent = 'No changes detected';
      content.appendChild(noChanges);
    }
  }
  
  item.appendChild(content);
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
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Format a value for display
 * @param {*} value - The value to format
 * @returns {String} - Formatted value
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return '<em>None</em>';
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  } else if (typeof value === 'number') {
    // Format currency if it looks like a dollar amount
    if (value > 100) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    return value.toString();
  } else if (typeof value === 'string') {
    return value || '<em>Empty</em>';
  } else if (Array.isArray(value)) {
    return value.join(', ') || '<em>Empty list</em>';
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
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
 * Get the current user
 * @returns {Object|null} - The current user object or null
 */
function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('orderforecast_user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Show a notification message
 * @param {String} message - The message to display
 * @param {String} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
  // Check if notification container exists
  let container = document.getElementById('notification-container');
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add close button functionality
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    container.removeChild(notification);
  });
  
  // Add to container
  container.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode === container) {
      container.removeChild(notification);
    }
  }, 5000);
}

// Export functions
export {
  initializeHistoryTracker,
  trackDealChange,
  getDealHistory,
  showHistoryModal
};

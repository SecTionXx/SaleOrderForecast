// dealForm.js - Handles deal entry and editing functionality

import { validateForm, displayValidationErrors, clearValidationErrors, initializeLiveFormValidation } from './formValidation.js';
import { trackDealChange, showHistoryModal } from './historyTracker.js';

/**
 * Initialize the deal form functionality
 */
function initializeDealForm() {
  console.log('Initializing deal form functionality...');
  
  // Add event listeners for the "Add Deal" button
  const addDealBtn = document.getElementById('add-deal-btn');
  if (addDealBtn) {
    addDealBtn.addEventListener('click', showDealForm);
  }
  
  // Add event listener for form submission
  document.addEventListener('submit', function(event) {
    if (event.target.id === 'deal-form') {
      event.preventDefault();
      
      // Validate the form before submission
      const { isValid, errors } = validateForm(event.target);
      
      if (isValid) {
        handleDealFormSubmit(event.target);
      } else {
        displayValidationErrors(event.target, errors);
      }
    }
  });
  
  // Add event listener for form cancel
  document.addEventListener('click', function(event) {
    if (event.target.id === 'cancel-deal-form') {
      event.preventDefault();
      hideDealForm();
    }
  });
  
  // Add event listener for edit deal buttons
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('edit-deal-btn') || 
        (event.target.parentElement && event.target.parentElement.classList.contains('edit-deal-btn'))) {
      event.preventDefault();
      const dealId = event.target.closest('[data-deal-id]').dataset.dealId;
      showDealForm(null, dealId);
    }
  });
  
  // Add event listener for view history buttons
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
 * Show the deal form modal
 * @param {Event} event - The triggering event
 * @param {String} dealId - Optional deal ID for editing existing deals
 */
function showDealForm(event, dealId = null) {
  // Check if user has permission to add/edit deals
  const currentUser = getCurrentUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
    showNotification('You do not have permission to add or edit deals', 'error');
    return;
  }

  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'deal-form-backdrop';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'deal-form-modal';
  
  // Create modal header
  const header = document.createElement('div');
  header.className = 'deal-form-header';
  
  const title = document.createElement('h3');
  title.textContent = dealId ? 'Edit Deal' : 'Add New Deal';
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.className = 'close-btn';
  closeButton.id = 'close-deal-form';
  closeButton.onclick = hideDealForm;
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create form
  const form = document.createElement('form');
  form.id = 'deal-form';
  form.className = 'deal-form';
  
  if (dealId) {
    const hiddenId = document.createElement('input');
    hiddenId.type = 'hidden';
    hiddenId.name = 'dealId';
    hiddenId.value = dealId;
    form.appendChild(hiddenId);
  }
  
  // Create form fields
  const formFields = createFormFields(dealId);
  form.appendChild(formFields);
  
  // Create form actions
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.id = 'cancel-deal-form';
  cancelButton.className = 'btn btn-secondary';
  cancelButton.textContent = 'Cancel';
  
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn btn-primary';
  submitButton.textContent = dealId ? 'Update Deal' : 'Create Deal';
  
  actions.appendChild(cancelButton);
  actions.appendChild(submitButton);
  
  form.appendChild(actions);
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(form);
  backdrop.appendChild(modal);
  
  // Add to document
  document.body.appendChild(backdrop);
  
  // If editing, populate form with deal data
  if (dealId) {
    populateFormWithDealData(dealId);
  }
  
  // Focus first field
  setTimeout(() => {
    const firstInput = form.querySelector('input, select');
    if (firstInput) firstInput.focus();
    
    // Initialize live form validation
    initializeLiveFormValidation('deal-form');
  }, 100);
}

/**
 * Create form fields for the deal form
 * @param {String} dealId - Optional deal ID for editing
 * @returns {DocumentFragment} - Form fields fragment
 */
function createFormFields(dealId) {
  const fragment = document.createDocumentFragment();
  
  // Create form grid for 2-column layout
  const formGrid = document.createElement('div');
  formGrid.className = 'form-grid';
  
  // Customer Name
  const customerNameGroup = createFormGroup(
    'customer-name',
    'Customer Name',
    'text',
    'customerName',
    'Enter customer name',
    true
  );
  
  // Project Name
  const projectNameGroup = createFormGroup(
    'project-name',
    'Project Name',
    'text',
    'projectName',
    'Enter project name',
    true
  );
  
  // Deal Stage
  const dealStageGroup = createFormGroup(
    'deal-stage',
    'Deal Stage',
    'select',
    'dealStage',
    null,
    true
  );
  const dealStageSelect = dealStageGroup.querySelector('select');
  
  const dealStages = [
    'Lead',
    'Proposal Sent',
    'Negotiation',
    'Verbal Agreement',
    'Closed Won',
    'Closed Lost'
  ];
  
  dealStages.forEach(stage => {
    const option = document.createElement('option');
    option.value = stage;
    option.textContent = stage;
    dealStageSelect.appendChild(option);
  });
  
  // Sales Rep
  const salesRepGroup = createFormGroup(
    'sales-rep',
    'Sales Rep',
    'select',
    'salesRep',
    null,
    true
  );
  const salesRepSelect = salesRepGroup.querySelector('select');
  
  // Get sales reps from the dropdown in the main UI
  const salesReps = [];
  const mainDropdown = document.getElementById('sales-rep-filter');
  if (mainDropdown) {
    Array.from(mainDropdown.options).forEach(option => {
      if (option.value !== 'all') {
        salesReps.push(option.textContent);
      }
    });
  }
  
  // If no sales reps found, add some defaults
  if (salesReps.length === 0) {
    salesReps.push('Boworn', 'Lalipas');
  }
  
  salesReps.forEach(rep => {
    const option = document.createElement('option');
    option.value = rep;
    option.textContent = rep;
    salesRepSelect.appendChild(option);
  });
  
  // Total Value
  const totalValueGroup = createFormGroup(
    'total-value',
    'Total Value',
    'number',
    'totalValue',
    'Enter deal value',
    true
  );
  const totalValueInput = totalValueGroup.querySelector('input');
  totalValueInput.min = '0';
  totalValueInput.step = '1000';
  
  // Probability
  const probabilityGroup = createFormGroup(
    'probability',
    'Probability (%)',
    'number',
    'probabilityPercent',
    'Enter probability percentage',
    true
  );
  const probabilityInput = probabilityGroup.querySelector('input');
  probabilityInput.min = '0';
  probabilityInput.max = '100';
  probabilityInput.step = '5';
  
  // Expected Close Date
  const expectedCloseDateGroup = createFormGroup(
    'expected-close-date',
    'Expected Close Date',
    'date',
    'expectedCloseDate',
    null,
    true
  );
  
  // Actual Close Date (only for Closed Won/Lost)
  const actualCloseDateGroup = createFormGroup(
    'actual-close-date',
    'Actual Close Date',
    'date',
    'actualCloseDate',
    null,
    false
  );
  
  // Win/Loss Reason (only for Closed Won/Lost)
  const winLossReasonGroup = createFormGroup(
    'win-loss-reason',
    'Win/Loss Reason',
    'text',
    'winLossReason',
    'Enter reason for winning or losing the deal',
    false
  );
  
  // Notes (full width)
  const notesGroup = createFormGroup(
    'notes',
    'Notes',
    'textarea',
    'notes',
    'Enter any additional notes',
    false
  );
  notesGroup.className = 'form-group full-width';
  
  // Add fields to form grid
  formGrid.appendChild(customerNameGroup);
  formGrid.appendChild(projectNameGroup);
  formGrid.appendChild(dealStageGroup);
  formGrid.appendChild(salesRepGroup);
  formGrid.appendChild(totalValueGroup);
  formGrid.appendChild(probabilityGroup);
  formGrid.appendChild(expectedCloseDateGroup);
  formGrid.appendChild(actualCloseDateGroup);
  formGrid.appendChild(winLossReasonGroup);
  
  // Add form grid and notes to fragment
  fragment.appendChild(formGrid);
  fragment.appendChild(notesGroup);
  
  // Add event listener to deal stage to show/hide conditional fields
  dealStageSelect.addEventListener('change', function() {
    toggleConditionalFields(this.value);
  });
  
  return fragment;
}

/**
 * Create a form group with label and input
 * @param {String} id - Input ID
 * @param {String} label - Input label
 * @param {String} type - Input type
 * @param {String} name - Input name
 * @param {String} placeholder - Input placeholder
 * @param {Boolean} required - Whether the field is required
 * @returns {HTMLElement} - Form group element
 */
function createFormGroup(id, label, type, name, placeholder, required) {
  const group = document.createElement('div');
  group.className = 'form-group';
  
  const labelElement = document.createElement('label');
  labelElement.setAttribute('for', id);
  labelElement.textContent = label;
  
  if (required) {
    const requiredSpan = document.createElement('span');
    requiredSpan.className = 'required';
    requiredSpan.textContent = ' *';
    labelElement.appendChild(requiredSpan);
  }
  
  let inputElement;
  
  if (type === 'select') {
    inputElement = document.createElement('select');
  } else if (type === 'textarea') {
    inputElement = document.createElement('textarea');
    inputElement.rows = 3;
  } else {
    inputElement = document.createElement('input');
    inputElement.type = type;
  }
  
  inputElement.id = id;
  inputElement.name = name;
  inputElement.className = 'form-control';
  
  if (required) {
    inputElement.required = true;
    inputElement.setAttribute('data-validation-required', 'true');
  }
  
  if (placeholder && type !== 'select') {
    inputElement.placeholder = placeholder;
  }
  
  // Add data attributes for validation
  if (name === 'customerName' || name === 'projectName') {
    inputElement.setAttribute('data-validation-minlength', '2');
    inputElement.setAttribute('data-validation-maxlength', '100');
  } else if (name === 'totalValue') {
    inputElement.setAttribute('data-validation-min', '0');
    inputElement.setAttribute('data-validation-max', '1000000000');
    inputElement.setAttribute('data-validation-pattern', 'decimal');
  } else if (name === 'probabilityPercent') {
    inputElement.setAttribute('data-validation-min', '0');
    inputElement.setAttribute('data-validation-max', '100');
    inputElement.setAttribute('data-validation-pattern', 'decimal');
  } else if (name === 'notes') {
    inputElement.setAttribute('data-validation-maxlength', '500');
  } else if (name === 'closedReason') {
    inputElement.setAttribute('data-validation-maxlength', '200');
  }
  
  group.appendChild(labelElement);
  group.appendChild(inputElement);
  
  return group;
}

/**
 * Toggle visibility of conditional fields based on deal stage
 * @param {String} dealStage - The selected deal stage
 */
function toggleConditionalFields(dealStage) {
  const isClosedDeal = dealStage === 'Closed Won' || dealStage === 'Closed Lost';
  
  const actualCloseDateGroup = document.getElementById('actual-close-date').closest('.form-group');
  const winLossReasonGroup = document.getElementById('win-loss-reason').closest('.form-group');
  
  if (isClosedDeal) {
    actualCloseDateGroup.style.display = '';
    document.getElementById('actual-close-date').required = true;
    
    winLossReasonGroup.style.display = '';
    document.getElementById('win-loss-reason').required = true;
  } else {
    actualCloseDateGroup.style.display = 'none';
    document.getElementById('actual-close-date').required = false;
    
    winLossReasonGroup.style.display = 'none';
    document.getElementById('win-loss-reason').required = false;
  }
}

/**
 * Populate form with existing deal data
 * @param {String} dealId - The ID of the deal to edit
 */
function populateFormWithDealData(dealId) {
  // Find the deal in the global data
  const deal = window.allDealsData.find(d => d.dealId === dealId);
  
  if (!deal) {
    console.error(`Deal with ID ${dealId} not found`);
    showNotification('Deal not found', 'error');
    return;
  }
  
  // Populate form fields
  const form = document.getElementById('deal-form');
  
  // Set text/number/select inputs
  const fields = [
    'customerName',
    'projectName',
    'dealStage',
    'salesRep',
    'totalValue',
    'probabilityPercent',
    'notes',
    'winLossReason'
  ];
  
  fields.forEach(field => {
    const input = form.elements[field];
    if (input && deal[field] !== undefined) {
      input.value = deal[field];
    }
  });
  
  // Set date inputs
  const dateFields = [
    'expectedCloseDate',
    'actualCloseDate'
  ];
  
  dateFields.forEach(field => {
    const input = form.elements[field];
    if (input && deal[field]) {
      let dateValue = deal[field];
      
      // Convert Date object to YYYY-MM-DD
      if (dateValue instanceof Date) {
        dateValue = dateValue.toISOString().split('T')[0];
      } else if (typeof dateValue === 'string' && dateValue.includes('T')) {
        // Handle ISO date strings
        dateValue = dateValue.split('T')[0];
      }
      
      input.value = dateValue;
    }
  });
  
  // Trigger change event on deal stage to show/hide conditional fields
  const dealStageSelect = form.elements.dealStage;
  if (dealStageSelect) {
    dealStageSelect.dispatchEvent(new Event('change'));
  }
}

/**
 * Hide the deal form modal
 */
function hideDealForm() {
  const backdrop = document.getElementById('deal-form-backdrop');
  if (backdrop) {
    document.body.removeChild(backdrop);
  }
}

/**
 * Handle deal form submission
 * @param {HTMLFormElement} form - The submitted form
 */
async function handleDealFormSubmit(form) {
  try {
    // Clear any existing validation errors
    clearValidationErrors(form);
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    
    // Get form data
    const formData = new FormData(form);
    const dealData = {};
    
    for (const [key, value] of formData.entries()) {
      dealData[key] = value;
    }
    
    // Convert numeric fields
    dealData.totalValue = parseFloat(dealData.totalValue) || 0;
    dealData.probabilityPercent = parseFloat(dealData.probabilityPercent) || 0;
    
    // Calculate weighted value
    dealData.weightedValue = (dealData.totalValue * dealData.probabilityPercent) / 100;
    
    // Set creation/update dates
    const isUpdate = !!dealData.dealId;
    let previousData = null;
    
    if (isUpdate) {
      // Use existing ID for update
      dealData.id = dealData.dealId;
      delete dealData.dealId; // Remove the duplicate ID field
      
      // Get previous data for history tracking
      const allDealsData = window.allDealsData || [];
      previousData = allDealsData.find(deal => deal.id === dealData.id);
    } else {
      // Generate new ID for create
      dealData.id = generateDealId();
      dealData.dateCreated = new Date().toISOString().split('T')[0];
    }
    
    // Set last updated date
    dealData.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Send data to server
    const success = await saveDealData(dealData);
    
    if (success) {
      // Track the change for history tracking
      if (isUpdate) {
        trackDealChange(dealData, 'update', previousData);
      } else {
        trackDealChange(dealData, 'create');
      }
      
      // Close form
      hideDealForm();
      
      // Show success message
      showNotification(
        isUpdate ? 'Deal updated successfully' : 'New deal created successfully',
        'success'
      );
      
      // Refresh data
      if (typeof fetchDataAndInitializeDashboard === 'function') {
        fetchDataAndInitializeDashboard(true);
      }
    } else {
      // Show error
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      showNotification('Failed to save deal data', 'error');
    }
  } catch (error) {
    console.error('Error saving deal data:', error);
    showNotification('An error occurred while saving the deal', 'error');
    
    // Reset button
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = form.querySelector('input[name="dealId"]') ? 'Update Deal' : 'Create Deal';
    }
  }
}

/**
 * Generate a unique deal ID
 * @returns {String} - New deal ID
 */
function generateDealId() {
  const prefix = 'DEAL-';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Save deal data to the server
 * @param {Object} dealData - The deal data to save
 * @returns {Promise<boolean>} - Whether the save was successful
 */
async function saveDealData(dealData) {
  try {
    // Get authentication token
    const token = localStorage.getItem('orderforecast_auth_token');
    if (!token) {
      console.error('No authentication token found');
      return false;
    }
    
    // Get base URL
    const baseUrl = window.location.origin;
    
    // Determine if this is a create or update operation
    const isUpdate = Boolean(dealData.dealId && window.allDealsData.some(d => d.dealId === dealData.dealId));
    const endpoint = isUpdate ? '/api/updateDeal' : '/api/createDeal';
    
    // Send request to server
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dealData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData);
      throw new Error(errorData.message || 'Failed to save deal data');
    }
    
    const data = await response.json();
    
    // For demo/development purposes, if the server is not available,
    // we'll update the data locally
    if (data.demo) {
      updateLocalData(dealData, isUpdate);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving deal data:', error);
    
    // For demo/development purposes, if the server is not available,
    // we'll still update the data locally
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('Server unavailable, updating data locally (demo mode)');
      updateLocalData(dealData, Boolean(dealData.dealId && window.allDealsData.some(d => d.dealId === dealData.dealId)));
      return true;
    }
    
    return false;
  }
}

/**
 * Update data locally (for demo/development purposes)
 * @param {Object} dealData - The deal data to save
 * @param {Boolean} isUpdate - Whether this is an update or create operation
 */
function updateLocalData(dealData, isUpdate) {
  if (isUpdate) {
    // Update existing deal
    const index = window.allDealsData.findIndex(d => d.dealId === dealData.dealId);
    if (index !== -1) {
      window.allDealsData[index] = { ...window.allDealsData[index], ...dealData };
    }
  } else {
    // Add new deal
    window.allDealsData.push(dealData);
  }
  
  // Update localStorage cache
  try {
    const cacheData = {
      data: window.allDealsData,
      timestamp: Date.now()
    };
    localStorage.setItem('orderforecast_data_cache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error updating local cache:', error);
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
  
  if (!container) {
    // Create container
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Add icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    default:
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }
  
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  
  // Add to container
  container.appendChild(notification);
  
  // Add event listener to close button
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    container.removeChild(notification);
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode === container) {
      container.removeChild(notification);
    }
  }, 5000);
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

export { initializeDealForm, showDealForm, hideDealForm };

/**
 * dealForm.js - Handles deal entry and editing functionality
 */

import { validateForm, displayValidationErrors, clearValidationErrors, initializeLiveFormValidation } from '../utils/formValidation.js';
import { trackDealChange, showHistoryModal } from '../components/historyTracker.js';
import { getCurrentUser } from '../auth/auth.js';

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
  
  // Add options to deal stage select
  const dealStages = [
    { value: '', text: 'Select deal stage', disabled: true },
    { value: 'prospecting', text: 'Prospecting' },
    { value: 'qualification', text: 'Qualification' },
    { value: 'proposal', text: 'Proposal' },
    { value: 'negotiation', text: 'Negotiation' },
    { value: 'closed-won', text: 'Closed Won' },
    { value: 'closed-lost', text: 'Closed Lost' }
  ];
  
  dealStages.forEach(stage => {
    const option = document.createElement('option');
    option.value = stage.value;
    option.textContent = stage.text;
    if (stage.disabled) option.disabled = true;
    dealStageSelect.appendChild(option);
  });
  
  // Add event listener to deal stage select
  dealStageSelect.addEventListener('change', function() {
    toggleConditionalFields(this.value);
  });
  
  // Deal Value
  const dealValueGroup = createFormGroup(
    'deal-value',
    'Deal Value',
    'number',
    'dealValue',
    'Enter deal value',
    true
  );
  
  const dealValueInput = dealValueGroup.querySelector('input');
  dealValueInput.min = '0';
  dealValueInput.step = '1000';
  
  // Probability
  const probabilityGroup = createFormGroup(
    'probability',
    'Probability (%)',
    'number',
    'probability',
    'Enter probability',
    true
  );
  
  const probabilityInput = probabilityGroup.querySelector('input');
  probabilityInput.min = '0';
  probabilityInput.max = '100';
  probabilityInput.step = '5';
  
  // Expected Close Date
  const closeDateGroup = createFormGroup(
    'close-date',
    'Expected Close Date',
    'date',
    'closeDate',
    null,
    true
  );
  
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
  
  // Add options to sales rep select
  const salesReps = [
    { value: '', text: 'Select sales rep', disabled: true },
    { value: 'john.doe', text: 'John Doe' },
    { value: 'jane.smith', text: 'Jane Smith' },
    { value: 'bob.johnson', text: 'Bob Johnson' },
    { value: 'sarah.williams', text: 'Sarah Williams' }
  ];
  
  salesReps.forEach(rep => {
    const option = document.createElement('option');
    option.value = rep.value;
    option.textContent = rep.text;
    if (rep.disabled) option.disabled = true;
    salesRepSelect.appendChild(option);
  });
  
  // Notes
  const notesGroup = createFormGroup(
    'notes',
    'Notes',
    'textarea',
    'notes',
    'Enter any additional notes',
    false
  );
  
  // Loss Reason (conditional field)
  const lossReasonGroup = createFormGroup(
    'loss-reason',
    'Loss Reason',
    'select',
    'lossReason',
    null,
    false
  );
  
  lossReasonGroup.classList.add('conditional-field', 'loss-reason-field');
  
  const lossReasonSelect = lossReasonGroup.querySelector('select');
  
  // Add options to loss reason select
  const lossReasons = [
    { value: '', text: 'Select loss reason', disabled: true },
    { value: 'price', text: 'Price' },
    { value: 'competitor', text: 'Competitor' },
    { value: 'timing', text: 'Timing' },
    { value: 'no-budget', text: 'No Budget' },
    { value: 'no-decision', text: 'No Decision' },
    { value: 'other', text: 'Other' }
  ];
  
  lossReasons.forEach(reason => {
    const option = document.createElement('option');
    option.value = reason.value;
    option.textContent = reason.text;
    if (reason.disabled) option.disabled = true;
    lossReasonSelect.appendChild(option);
  });
  
  // Add fields to form grid
  formGrid.appendChild(customerNameGroup);
  formGrid.appendChild(projectNameGroup);
  formGrid.appendChild(dealStageGroup);
  formGrid.appendChild(dealValueGroup);
  formGrid.appendChild(probabilityGroup);
  formGrid.appendChild(closeDateGroup);
  formGrid.appendChild(salesRepGroup);
  formGrid.appendChild(lossReasonGroup);
  
  // Notes field spans full width
  const fullWidthContainer = document.createElement('div');
  fullWidthContainer.className = 'full-width-field';
  fullWidthContainer.appendChild(notesGroup);
  
  fragment.appendChild(formGrid);
  fragment.appendChild(fullWidthContainer);
  
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
  labelElement.htmlFor = id;
  labelElement.textContent = label;
  
  if (required) {
    const requiredSpan = document.createElement('span');
    requiredSpan.className = 'required';
    requiredSpan.textContent = '*';
    labelElement.appendChild(requiredSpan);
  }
  
  let inputElement;
  
  if (type === 'textarea') {
    inputElement = document.createElement('textarea');
    inputElement.rows = 3;
  } else if (type === 'select') {
    inputElement = document.createElement('select');
  } else {
    inputElement = document.createElement('input');
    inputElement.type = type;
  }
  
  inputElement.id = id;
  inputElement.name = name;
  
  if (placeholder && type !== 'select') {
    inputElement.placeholder = placeholder;
  }
  
  if (required) {
    inputElement.required = true;
  }
  
  // Add validation message container
  const validationMessage = document.createElement('div');
  validationMessage.className = 'validation-message';
  validationMessage.dataset.for = name;
  
  group.appendChild(labelElement);
  group.appendChild(inputElement);
  group.appendChild(validationMessage);
  
  return group;
}

/**
 * Toggle visibility of conditional fields based on deal stage
 * @param {String} dealStage - The selected deal stage
 */
function toggleConditionalFields(dealStage) {
  const lossReasonFields = document.querySelectorAll('.loss-reason-field');
  
  if (dealStage === 'closed-lost') {
    lossReasonFields.forEach(field => {
      field.style.display = 'block';
      const select = field.querySelector('select');
      if (select) select.required = true;
    });
  } else {
    lossReasonFields.forEach(field => {
      field.style.display = 'none';
      const select = field.querySelector('select');
      if (select) {
        select.required = false;
        select.value = '';
      }
    });
  }
}

/**
 * Populate form with existing deal data
 * @param {String} dealId - The ID of the deal to edit
 */
function populateFormWithDealData(dealId) {
  // Get deal data from the table or API
  const dealRow = document.querySelector(`tr[data-deal-id="${dealId}"]`);
  
  if (!dealRow) {
    console.error(`Deal with ID ${dealId} not found`);
    return;
  }
  
  // Get data from data attributes
  const dealData = {
    customerName: dealRow.dataset.customerName,
    projectName: dealRow.dataset.projectName,
    dealStage: dealRow.dataset.dealStage,
    dealValue: dealRow.dataset.dealValue,
    probability: dealRow.dataset.probability,
    closeDate: dealRow.dataset.closeDate,
    salesRep: dealRow.dataset.salesRep,
    notes: dealRow.dataset.notes,
    lossReason: dealRow.dataset.lossReason
  };
  
  // Populate form fields
  const form = document.getElementById('deal-form');
  
  for (const [key, value] of Object.entries(dealData)) {
    const field = form.elements[key];
    if (field) {
      field.value = value || '';
    }
  }
  
  // Toggle conditional fields based on deal stage
  toggleConditionalFields(dealData.dealStage);
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
function handleDealFormSubmit(form) {
  // Get form data
  const formData = new FormData(form);
  const dealData = {};
  
  for (const [key, value] of formData.entries()) {
    dealData[key] = value;
  }
  
  // Add additional data
  dealData.lastUpdated = new Date().toISOString();
  dealData.updatedBy = getCurrentUser()?.username || 'unknown';
  
  // Calculate weighted value
  dealData.weightedValue = (parseFloat(dealData.dealValue) * parseFloat(dealData.probability) / 100).toFixed(2);
  
  // If this is a new deal, generate an ID
  const isUpdate = !!dealData.dealId;
  if (!isUpdate) {
    dealData.dealId = generateDealId();
  }
  
  // Save deal data
  saveDealData(dealData)
    .then(success => {
      if (success) {
        // Track the change for history
        trackDealChange(dealData, isUpdate ? 'update' : 'create');
        
        // Hide the form
        hideDealForm();
        
        // Show success notification
        showNotification(
          isUpdate ? 'Deal updated successfully' : 'Deal created successfully',
          'success'
        );
        
        // Refresh the data
        if (typeof window.fetchDataAndInitializeDashboard === 'function') {
          window.fetchDataAndInitializeDashboard(true);
        }
      } else {
        showNotification('Failed to save deal data', 'error');
      }
    })
    .catch(error => {
      console.error('Error saving deal data:', error);
      showNotification('Error saving deal data: ' + error.message, 'error');
    });
}

/**
 * Generate a unique deal ID
 * @returns {String} - New deal ID
 */
function generateDealId() {
  return 'deal_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

/**
 * Save deal data to the server
 * @param {Object} dealData - The deal data to save
 * @returns {Promise<boolean>} - Whether the save was successful
 */
async function saveDealData(dealData) {
  try {
    // In a real app, this would send data to the server
    // For demo purposes, we'll just update the local data
    
    // Get the auth token
    const token = localStorage.getItem('orderforecast_auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local data for demo
    const isUpdate = !!dealData.dealId;
    updateLocalData(dealData, isUpdate);
    
    return true;
  } catch (error) {
    console.error('Error saving deal data:', error);
    return false;
  }
}

/**
 * Update data locally (for demo/development purposes)
 * @param {Object} dealData - The deal data to save
 * @param {Boolean} isUpdate - Whether this is an update or create operation
 */
function updateLocalData(dealData, isUpdate) {
  // Get current data
  let allData = [];
  try {
    const dataString = localStorage.getItem('orderforecast_deals_data');
    if (dataString) {
      allData = JSON.parse(dataString);
    }
  } catch (error) {
    console.error('Error parsing local data:', error);
    allData = [];
  }
  
  if (isUpdate) {
    // Update existing deal
    const index = allData.findIndex(deal => deal.dealId === dealData.dealId);
    if (index !== -1) {
      allData[index] = { ...allData[index], ...dealData };
    }
  } else {
    // Add new deal
    allData.push(dealData);
  }
  
  // Save back to localStorage
  localStorage.setItem('orderforecast_deals_data', JSON.stringify(allData));
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
export { initializeDealForm, showDealForm, hideDealForm };

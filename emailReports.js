// emailReports.js - Provides email report sharing functionality

/**
 * Initialize email report sharing functionality
 */
function initializeEmailReports() {
  console.log('Initializing email report sharing...');
  
  // Add email report button to export options
  addEmailReportButton();
  
  // Initialize email modal events
  initializeEmailModal();
}

/**
 * Add email report button to the export options
 */
function addEmailReportButton() {
  const exportButtonsContainer = document.querySelector('.export-buttons');
  if (!exportButtonsContainer) {
    console.error('Export buttons container not found');
    return;
  }
  
  // Create email report button
  const emailButton = document.createElement('button');
  emailButton.className = 'btn btn-outline-primary ms-2';
  emailButton.innerHTML = '<i data-feather="mail"></i> Email Report';
  emailButton.title = 'Share report via email';
  emailButton.addEventListener('click', showEmailModal);
  
  // Add button to container
  exportButtonsContainer.appendChild(emailButton);
  
  // Initialize feather icons
  if (window.feather) {
    window.feather.replace();
  }
}

/**
 * Show the email report modal
 */
function showEmailModal() {
  // Get current filter state for report context
  const currentFilters = getCurrentFilterState();
  const filteredData = getCurrentFilteredData();
  
  // Create modal if it doesn't exist
  let emailModal = document.getElementById('emailReportModal');
  if (!emailModal) {
    emailModal = createEmailModal();
  }
  
  // Update report preview
  updateReportPreview(filteredData, currentFilters);
  
  // Show the modal
  const modalInstance = new bootstrap.Modal(emailModal);
  modalInstance.show();
}

/**
 * Create the email report modal
 * @returns {HTMLElement} The created modal element
 */
function createEmailModal() {
  const modalHtml = `
    <div class="modal fade" id="emailReportModal" tabindex="-1" aria-labelledby="emailReportModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="emailReportModalLabel">Share Report via Email</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="emailReportForm">
              <div class="mb-3">
                <label for="recipientEmails" class="form-label">Recipients</label>
                <input type="text" class="form-control" id="recipientEmails" placeholder="Enter email addresses (comma separated)">
                <div class="form-text">Separate multiple email addresses with commas</div>
              </div>
              <div class="mb-3">
                <label for="emailSubject" class="form-label">Subject</label>
                <input type="text" class="form-control" id="emailSubject" value="Sales Order Forecast Report">
              </div>
              <div class="mb-3">
                <label for="emailMessage" class="form-label">Message</label>
                <textarea class="form-control" id="emailMessage" rows="3" placeholder="Add a personal message (optional)"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Report Format</label>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="reportFormat" id="formatPDF" value="pdf" checked>
                  <label class="form-check-label" for="formatPDF">PDF Report</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="reportFormat" id="formatExcel" value="excel">
                  <label class="form-check-label" for="formatExcel">Excel Spreadsheet</label>
                </div>
              </div>
              <div class="mb-3">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="includeCharts" checked>
                  <label class="form-check-label" for="includeCharts">Include Charts</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="includeDetails" checked>
                  <label class="form-check-label" for="includeDetails">Include Detailed Data</label>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Report Preview</label>
                <div class="report-preview p-3 border rounded bg-light">
                  <div id="reportPreview">
                    <p class="text-center text-muted">Preview will appear here...</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="sendReportBtn">Send Report</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to the document
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml.trim();
  document.body.appendChild(modalContainer.firstChild);
  
  return document.getElementById('emailReportModal');
}

/**
 * Initialize email modal events
 */
function initializeEmailModal() {
  // Add event listener to the send button when it exists
  document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'sendReportBtn') {
      sendEmailReport();
    }
  });
  
  // Add event listeners to format and option changes
  document.addEventListener('change', function(event) {
    if (event.target && 
        (event.target.name === 'reportFormat' || 
         event.target.id === 'includeCharts' || 
         event.target.id === 'includeDetails')) {
      // Update preview when options change
      const filteredData = getCurrentFilteredData();
      const currentFilters = getCurrentFilterState();
      updateReportPreview(filteredData, currentFilters);
    }
  });
}

/**
 * Update the report preview based on selected options
 * @param {Array} data - The filtered data to include in the report
 * @param {Object} filters - The current filter state
 */
function updateReportPreview(data, filters) {
  const previewElement = document.getElementById('reportPreview');
  if (!previewElement) return;
  
  const includeCharts = document.getElementById('includeCharts')?.checked || false;
  const includeDetails = document.getElementById('includeDetails')?.checked || false;
  const format = document.querySelector('input[name="reportFormat"]:checked')?.value || 'pdf';
  
  // Create preview HTML
  let previewHtml = `
    <div class="preview-header mb-3">
      <h5>Sales Order Forecast Report</h5>
      <p class="text-muted small">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  `;
  
  // Add filter summary if filters are applied
  if (Object.keys(filters).length > 0) {
    previewHtml += `<div class="preview-filters mb-3"><h6>Filters Applied:</h6><ul class="small">`;
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        previewHtml += `<li>${formatFilterName(key)}: ${formatFilterValue(key, value)}</li>`;
      }
    }
    previewHtml += `</ul></div>`;
  }
  
  // Add charts preview if selected
  if (includeCharts) {
    previewHtml += `
      <div class="preview-charts mb-3">
        <h6>Charts</h6>
        <div class="row">
          <div class="col-6">
            <div class="chart-placeholder bg-secondary bg-opacity-10 p-2 rounded text-center">
              <i data-feather="pie-chart"></i>
              <p class="small">Deal Stage Distribution</p>
            </div>
          </div>
          <div class="col-6">
            <div class="chart-placeholder bg-secondary bg-opacity-10 p-2 rounded text-center">
              <i data-feather="bar-chart-2"></i>
              <p class="small">Sales by Rep</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Add data preview if selected
  if (includeDetails) {
    previewHtml += `
      <div class="preview-data">
        <h6>Data Summary</h6>
        <p class="small">${data.length} deals included in report</p>
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Stage</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add up to 3 sample rows
    const sampleData = data.slice(0, 3);
    sampleData.forEach(deal => {
      previewHtml += `
        <tr>
          <td>${deal.dealName}</td>
          <td>${deal.dealStage}</td>
          <td>${formatCurrency(deal.totalValue)}</td>
        </tr>
      `;
    });
    
    if (data.length > 3) {
      previewHtml += `
        <tr>
          <td colspan="3" class="text-center text-muted">... and ${data.length - 3} more deals</td>
        </tr>
      `;
    }
    
    previewHtml += `
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Add format info
  previewHtml += `
    <div class="preview-format mt-3">
      <p class="small text-muted">
        <i data-feather="${format === 'pdf' ? 'file-text' : 'file-spreadsheet'}"></i>
        Report will be sent as a ${format.toUpperCase()} file
      </p>
    </div>
  `;
  
  // Update the preview
  previewElement.innerHTML = previewHtml;
  
  // Initialize feather icons
  if (window.feather) {
    window.feather.replace();
  }
}

/**
 * Format a filter name for display
 * @param {string} key - The filter key
 * @returns {string} The formatted filter name
 */
function formatFilterName(key) {
  const nameMap = {
    'dealStage': 'Deal Stage',
    'salesRep': 'Sales Rep',
    'dateRange': 'Date Range',
    'minValue': 'Minimum Value',
    'maxValue': 'Maximum Value',
    'probability': 'Probability'
  };
  
  return nameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

/**
 * Format a filter value for display
 * @param {string} key - The filter key
 * @param {any} value - The filter value
 * @returns {string} The formatted filter value
 */
function formatFilterValue(key, value) {
  if (key === 'dateRange') {
    return `${value.start} to ${value.end}`;
  }
  
  if (key === 'minValue' || key === 'maxValue' || key === 'totalValue') {
    return formatCurrency(value);
  }
  
  if (key === 'probability') {
    return `${value}%`;
  }
  
  return value;
}

/**
 * Format a currency value
 * @param {number} value - The value to format
 * @returns {string} The formatted currency value
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Get the current filter state
 * @returns {Object} The current filter state
 */
function getCurrentFilterState() {
  // This should be implemented to match your application's filter state
  // For now, we'll return a placeholder
  return {
    dealStage: document.getElementById('dealStageFilter')?.value || null,
    salesRep: document.getElementById('salesRepFilter')?.value || null,
    dateRange: getDateRangeFilter()
  };
}

/**
 * Get the date range filter values
 * @returns {Object|null} The date range filter object or null if not set
 */
function getDateRangeFilter() {
  const startDate = document.getElementById('startDateFilter')?.value;
  const endDate = document.getElementById('endDateFilter')?.value;
  
  if (startDate || endDate) {
    return {
      start: startDate || 'Any',
      end: endDate || 'Any'
    };
  }
  
  return null;
}

/**
 * Get the current filtered data
 * @returns {Array} The currently filtered data
 */
function getCurrentFilteredData() {
  // This should be implemented to match your application's data structure
  // For now, we'll access the global filteredData if available or return a placeholder
  return window.filteredData || [];
}

/**
 * Send the email report
 */
function sendEmailReport() {
  const recipients = document.getElementById('recipientEmails')?.value;
  const subject = document.getElementById('emailSubject')?.value;
  const message = document.getElementById('emailMessage')?.value;
  const format = document.querySelector('input[name="reportFormat"]:checked')?.value;
  const includeCharts = document.getElementById('includeCharts')?.checked;
  const includeDetails = document.getElementById('includeDetails')?.checked;
  
  // Validate recipients
  if (!recipients) {
    showEmailError('Please enter at least one recipient email address');
    return;
  }
  
  // Validate email format
  const emails = recipients.split(',').map(email => email.trim());
  const invalidEmails = emails.filter(email => !isValidEmail(email));
  
  if (invalidEmails.length > 0) {
    showEmailError(`Invalid email format: ${invalidEmails.join(', ')}`);
    return;
  }
  
  // Show sending indicator
  const sendButton = document.getElementById('sendReportBtn');
  const originalText = sendButton.innerHTML;
  sendButton.disabled = true;
  sendButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
  
  // Get the data for the report
  const reportData = {
    recipients: emails,
    subject: subject || 'Sales Order Forecast Report',
    message: message || '',
    format: format || 'pdf',
    includeCharts: includeCharts,
    includeDetails: includeDetails,
    data: getCurrentFilteredData(),
    filters: getCurrentFilterState(),
    timestamp: new Date().toISOString()
  };
  
  // Get authentication token
  const token = localStorage.getItem('orderforecast_auth_token');
  if (!token) {
    showEmailError('Authentication required. Please log in again.');
    resetSendButton();
    return;
  }
  
  // Send the report data to the server
  fetch(`${window.location.origin}/api/email/send-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reportData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    // Show success message
    showEmailSuccess(`Report successfully sent to ${emails.length} recipient${emails.length !== 1 ? 's' : ''}`);
    
    // Close the modal after a delay
    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('emailReportModal'));
      if (modal) {
        modal.hide();
      }
    }, 2000);
  })
  .catch(error => {
    console.error('Error sending email report:', error);
    showEmailError(`Failed to send report: ${error.message}`);
  })
  .finally(() => {
    // Reset the send button
    resetSendButton();
  });
  
  /**
   * Reset the send button to its original state
   */
  function resetSendButton() {
    sendButton.disabled = false;
    sendButton.innerHTML = originalText;
  }
}

/**
 * Show an error message in the email modal
 * @param {string} message - The error message to display
 */
function showEmailError(message) {
  // Create alert if it doesn't exist
  let alertElement = document.querySelector('#emailReportModal .alert');
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.className = 'alert mt-3';
    alertElement.role = 'alert';
    
    const form = document.getElementById('emailReportForm');
    form.appendChild(alertElement);
  }
  
  // Set alert content and style
  alertElement.textContent = message;
  alertElement.className = 'alert alert-danger mt-3';
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertElement.remove();
  }, 5000);
}

/**
 * Show a success message in the email modal
 * @param {string} message - The success message to display
 */
function showEmailSuccess(message) {
  // Create alert if it doesn't exist
  let alertElement = document.querySelector('#emailReportModal .alert');
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.className = 'alert mt-3';
    alertElement.role = 'alert';
    
    const form = document.getElementById('emailReportForm');
    form.appendChild(alertElement);
  }
  
  // Set alert content and style
  alertElement.textContent = message;
  alertElement.className = 'alert alert-success mt-3';
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertElement.remove();
  }, 5000);
}

/**
 * Validate an email address format
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email is valid, false otherwise
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Make functions available globally instead of using ES6 exports
window.initializeEmailReports = initializeEmailReports;
window.showEmailModal = showEmailModal;
window.getCurrentFilteredData = getCurrentFilteredData;

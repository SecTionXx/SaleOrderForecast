/**
 * Email Reports Component
 * Handles scheduling and sending of email reports
 */

import { getState, addStateListener, removeStateListener } from '../core/state.js';
import { logDebug } from '../utils/logger.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

class EmailReports {
  constructor() {
    this.initialized = false;
    this.schedules = [];
    this.stateListener = null;
  }

  /**
   * Initialize the email reports component
   */
  init() {
    if (this.initialized) return;
    
    logDebug('Initializing email reports');
    
    // Load saved schedules
    this.loadSavedSchedules();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Add state listener
    this.stateListener = this.handleStateChange.bind(this);
    addStateListener(this.stateListener);
    
    this.initialized = true;
  }

  /**
   * Load saved email report schedules
   */
  loadSavedSchedules() {
    try {
      const savedSchedules = localStorage.getItem('orderforecast_email_schedules');
      
      if (savedSchedules) {
        this.schedules = JSON.parse(savedSchedules);
        logDebug('Loaded email schedules', this.schedules);
        
        // Update UI with loaded schedules
        this.updateSchedulesList();
      }
    } catch (error) {
      logDebug('Error loading email schedules', error);
    }
  }

  /**
   * Set up event listeners for email report controls
   */
  setupEventListeners() {
    // Schedule form
    const scheduleForm = document.getElementById('email-schedule-form');
    if (scheduleForm) {
      scheduleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createSchedule(new FormData(scheduleForm));
      });
    }
    
    // Delete schedule buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-schedule-btn')) {
        const scheduleId = e.target.getAttribute('data-schedule-id');
        this.deleteSchedule(scheduleId);
      }
    });
    
    // Generate report button
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => {
        this.generateReport();
      });
    }
  }

  /**
   * Create a new email report schedule
   * @param {FormData} formData - Form data for the schedule
   */
  createSchedule(formData) {
    try {
      const schedule = {
        id: Date.now().toString(),
        name: formData.get('schedule-name'),
        email: formData.get('recipient-email'),
        frequency: formData.get('schedule-frequency'),
        day: formData.get('schedule-day') || null,
        time: formData.get('schedule-time'),
        reportType: formData.get('report-type'),
        filters: this.getCurrentFilters(),
        createdAt: new Date().toISOString()
      };
      
      // Add to schedules
      this.schedules.push(schedule);
      
      // Save schedules
      this.saveSchedules();
      
      // Update UI
      this.updateSchedulesList();
      
      // Reset form
      document.getElementById('email-schedule-form').reset();
      
      logDebug('Created email schedule', schedule);
    } catch (error) {
      logDebug('Error creating email schedule', error);
    }
  }

  /**
   * Delete an email report schedule
   * @param {string} scheduleId - ID of the schedule to delete
   */
  deleteSchedule(scheduleId) {
    try {
      // Filter out the schedule to delete
      this.schedules = this.schedules.filter(schedule => schedule.id !== scheduleId);
      
      // Save schedules
      this.saveSchedules();
      
      // Update UI
      this.updateSchedulesList();
      
      logDebug('Deleted email schedule', { scheduleId });
    } catch (error) {
      logDebug('Error deleting email schedule', error);
    }
  }

  /**
   * Save schedules to localStorage
   */
  saveSchedules() {
    try {
      localStorage.setItem('orderforecast_email_schedules', JSON.stringify(this.schedules));
      logDebug('Saved email schedules', this.schedules);
    } catch (error) {
      logDebug('Error saving email schedules', error);
    }
  }

  /**
   * Update the schedules list in the UI
   */
  updateSchedulesList() {
    const schedulesList = document.getElementById('email-schedules-list');
    if (!schedulesList) return;
    
    // Clear existing list
    schedulesList.innerHTML = '';
    
    if (this.schedules.length === 0) {
      schedulesList.innerHTML = '<div class="empty-state">No scheduled reports</div>';
      return;
    }
    
    // Add each schedule to the list
    this.schedules.forEach(schedule => {
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      
      const frequencyText = this.getFrequencyText(schedule);
      
      scheduleItem.innerHTML = `
        <div class="schedule-header">
          <h4>${schedule.name}</h4>
          <button class="delete-schedule-btn" data-schedule-id="${schedule.id}">
            <i data-feather="trash-2"></i>
          </button>
        </div>
        <div class="schedule-details">
          <div><strong>Recipient:</strong> ${schedule.email}</div>
          <div><strong>Frequency:</strong> ${frequencyText}</div>
          <div><strong>Report Type:</strong> ${schedule.reportType}</div>
          <div><strong>Created:</strong> ${formatDate(new Date(schedule.createdAt))}</div>
        </div>
      `;
      
      schedulesList.appendChild(scheduleItem);
    });
    
    // Update feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }

  /**
   * Get human-readable frequency text
   * @param {Object} schedule - Schedule object
   * @returns {string} - Human-readable frequency
   */
  getFrequencyText(schedule) {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.time}`;
      case 'weekly':
        return `Weekly on ${schedule.day} at ${schedule.time}`;
      case 'monthly':
        return `Monthly on day ${schedule.day} at ${schedule.time}`;
      default:
        return `${schedule.frequency} at ${schedule.time}`;
    }
  }

  /**
   * Get current filters from application state
   * @returns {Object} - Current filters
   */
  getCurrentFilters() {
    const state = getState();
    return {
      sortColumn: state.sortColumn,
      sortDirection: state.sortDirection,
      // Add other filters as needed
    };
  }

  /**
   * Generate a report based on current data
   */
  generateReport() {
    try {
      const state = getState();
      const data = state.filteredData.length > 0 ? state.filteredData : state.allDealsData;
      
      if (!data || data.length === 0) {
        logDebug('No data available for report generation');
        return;
      }
      
      // In a real application, this would send the data to a server endpoint
      // that would generate and email the report
      
      // For this demo, we'll just log the data
      logDebug('Generating report with data', {
        dataCount: data.length,
        totalValue: data.reduce((sum, deal) => sum + (parseFloat(deal.amount) || 0), 0),
        generatedAt: new Date().toISOString()
      });
      
      // Show success message
      this.showReportGenerationMessage(true);
    } catch (error) {
      logDebug('Error generating report', error);
      this.showReportGenerationMessage(false, error.message);
    }
  }

  /**
   * Show report generation message
   * @param {boolean} success - Whether generation was successful
   * @param {string} errorMessage - Error message if generation failed
   */
  showReportGenerationMessage(success, errorMessage = '') {
    const messageContainer = document.getElementById('report-message');
    if (!messageContainer) return;
    
    messageContainer.className = success ? 'success-message' : 'error-message';
    messageContainer.textContent = success 
      ? 'Report generated successfully! Check your email.'
      : `Failed to generate report: ${errorMessage}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
      messageContainer.textContent = '';
      messageContainer.className = '';
    }, 5000);
  }

  /**
   * Handle state changes
   * @param {Object} newState - New application state
   */
  handleStateChange(newState) {
    // Update UI based on state changes if needed
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (this.stateListener) {
      removeStateListener(this.stateListener);
    }
  }
}

// Create and export singleton instance
const emailReports = new EmailReports();

// Export initialization function
export const initializeEmailReports = () => {
  emailReports.init();
  return emailReports;
};

export default emailReports;

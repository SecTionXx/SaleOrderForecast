/**
 * reportService.js - Report API Service
 * Handles all API operations related to report generation and sharing
 */

import apiService from '../utils/apiService.js';
import {
  getReportGenerateEndpoint,
  getEmailReportEndpoint
} from '../utils/apiEndpoints.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Generate a report in the specified format
 * @param {string} format - Report format (pdf, excel, csv)
 * @param {Object} options - Report options
 * @param {Array} data - Data to include in the report
 * @returns {Promise<Blob>} - Generated report as blob
 */
async function generateReport(format, options = {}, data = null) {
  try {
    const endpoint = getReportGenerateEndpoint();
    
    const requestData = {
      format,
      options
    };
    
    if (data) {
      requestData.data = data;
    }
    
    // Use blob response type for file downloads
    const requestOptions = {
      responseType: 'blob'
    };
    
    return await apiService.post(endpoint, requestData, requestOptions);
  } catch (error) {
    logError(`Error generating ${format} report:`, error);
    throw error;
  }
}

/**
 * Generate a PDF report
 * @param {Object} options - Report options
 * @param {Array} data - Data to include in the report
 * @returns {Promise<Blob>} - Generated PDF as blob
 */
async function generatePdfReport(options = {}, data = null) {
  return generateReport('pdf', options, data);
}

/**
 * Generate an Excel report
 * @param {Object} options - Report options
 * @param {Array} data - Data to include in the report
 * @returns {Promise<Blob>} - Generated Excel file as blob
 */
async function generateExcelReport(options = {}, data = null) {
  return generateReport('excel', options, data);
}

/**
 * Generate a CSV report
 * @param {Object} options - Report options
 * @param {Array} data - Data to include in the report
 * @returns {Promise<Blob>} - Generated CSV file as blob
 */
async function generateCsvReport(options = {}, data = null) {
  return generateReport('csv', options, data);
}

/**
 * Email a report to specified recipients
 * @param {string} format - Report format (pdf, excel, csv)
 * @param {Array} recipients - Email recipients
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {Object} options - Report options
 * @param {Array} data - Data to include in the report
 * @returns {Promise<Object>} - Response data
 */
async function emailReport(format, recipients, subject, message, options = {}, data = null) {
  try {
    const endpoint = getEmailReportEndpoint();
    
    const requestData = {
      format,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      subject,
      message,
      options
    };
    
    if (data) {
      requestData.data = data;
    }
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error emailing report:', error);
    throw error;
  }
}

/**
 * Save a report to user's saved reports
 * @param {string} name - Report name
 * @param {string} format - Report format (pdf, excel, csv)
 * @param {Object} options - Report options
 * @param {Array} data - Data to include in the report
 * @returns {Promise<Object>} - Saved report metadata
 */
async function saveReport(name, format, options = {}, data = null) {
  try {
    const endpoint = `${getReportGenerateEndpoint()}/save`;
    
    const requestData = {
      name,
      format,
      options
    };
    
    if (data) {
      requestData.data = data;
    }
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error saving report:', error);
    throw error;
  }
}

/**
 * Get user's saved reports
 * @returns {Promise<Array>} - List of saved reports
 */
async function getSavedReports() {
  try {
    const endpoint = `${getReportGenerateEndpoint()}/saved`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching saved reports:', error);
    throw error;
  }
}

/**
 * Download a previously saved report
 * @param {string} reportId - ID of the saved report
 * @returns {Promise<Blob>} - Report file as blob
 */
async function downloadSavedReport(reportId) {
  try {
    const endpoint = `${getReportGenerateEndpoint()}/saved/${reportId}`;
    
    // Use blob response type for file downloads
    const options = {
      responseType: 'blob'
    };
    
    return await apiService.get(endpoint, options);
  } catch (error) {
    logError(`Error downloading saved report ${reportId}:`, error);
    throw error;
  }
}

// Export all report service functions
export {
  generateReport,
  generatePdfReport,
  generateExcelReport,
  generateCsvReport,
  emailReport,
  saveReport,
  getSavedReports,
  downloadSavedReport
};

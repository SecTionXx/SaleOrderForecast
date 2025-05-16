/**
 * apiEndpoints.js - API Endpoints Configuration
 * Centralizes all API endpoint definitions for the application
 */

// Base API paths
const API_PATHS = {
  SHEET_DATA: '/api/getSheetData',
  AUTH: {
    VERIFY: '/api/auth/verify',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh'
  },
  DEALS: {
    LIST: '/api/deals',
    CREATE: '/api/deals',
    UPDATE: '/api/deals/:id',
    DELETE: '/api/deals/:id',
    HISTORY: '/api/deals/:id/history'
  },
  USERS: {
    LIST: '/api/users',
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/:id'
  },
  REPORTS: {
    GENERATE: '/api/reports/generate',
    EMAIL: '/api/reports/email'
  },
  CRM: {
    CONNECT: '/api/crm/connect',
    SYNC: '/api/crm/sync',
    SETTINGS: '/api/crm/settings'
  },
  FORECASTING: {
    PREDICT: '/api/forecasting/predict',
    SCENARIOS: '/api/forecasting/scenarios',
    TRENDS: '/api/forecasting/trends'
  }
};

/**
 * Replace path parameters in URL
 * @param {string} url - URL with path parameters
 * @param {Object} params - Object with parameter values
 * @returns {string} - URL with replaced parameters
 */
function replacePathParams(url, params = {}) {
  let processedUrl = url;
  
  Object.keys(params).forEach(key => {
    processedUrl = processedUrl.replace(`:${key}`, encodeURIComponent(params[key]));
  });
  
  return processedUrl;
}

/**
 * Get sheet data endpoint
 * @returns {string} - API endpoint
 */
function getSheetDataEndpoint() {
  return API_PATHS.SHEET_DATA;
}

/**
 * Get auth verify endpoint
 * @returns {string} - API endpoint
 */
function getAuthVerifyEndpoint() {
  return API_PATHS.AUTH.VERIFY;
}

/**
 * Get auth login endpoint
 * @returns {string} - API endpoint
 */
function getAuthLoginEndpoint() {
  return API_PATHS.AUTH.LOGIN;
}

/**
 * Get auth logout endpoint
 * @returns {string} - API endpoint
 */
function getAuthLogoutEndpoint() {
  return API_PATHS.AUTH.LOGOUT;
}

/**
 * Get auth token refresh endpoint
 * @returns {string} - API endpoint
 */
function getAuthRefreshEndpoint() {
  return API_PATHS.AUTH.REFRESH;
}

/**
 * Get deals list endpoint
 * @returns {string} - API endpoint
 */
function getDealsListEndpoint() {
  return API_PATHS.DEALS.LIST;
}

/**
 * Get deal create endpoint
 * @returns {string} - API endpoint
 */
function getDealCreateEndpoint() {
  return API_PATHS.DEALS.CREATE;
}

/**
 * Get deal update endpoint
 * @param {string|number} id - Deal ID
 * @returns {string} - API endpoint
 */
function getDealUpdateEndpoint(id) {
  return replacePathParams(API_PATHS.DEALS.UPDATE, { id });
}

/**
 * Get deal delete endpoint
 * @param {string|number} id - Deal ID
 * @returns {string} - API endpoint
 */
function getDealDeleteEndpoint(id) {
  return replacePathParams(API_PATHS.DEALS.DELETE, { id });
}

/**
 * Get deal history endpoint
 * @param {string|number} id - Deal ID
 * @returns {string} - API endpoint
 */
function getDealHistoryEndpoint(id) {
  return replacePathParams(API_PATHS.DEALS.HISTORY, { id });
}

/**
 * Get users list endpoint
 * @returns {string} - API endpoint
 */
function getUsersListEndpoint() {
  return API_PATHS.USERS.LIST;
}

/**
 * Get user profile endpoint
 * @returns {string} - API endpoint
 */
function getUserProfileEndpoint() {
  return API_PATHS.USERS.PROFILE;
}

/**
 * Get user update endpoint
 * @param {string|number} id - User ID
 * @returns {string} - API endpoint
 */
function getUserUpdateEndpoint(id) {
  return replacePathParams(API_PATHS.USERS.UPDATE, { id });
}

/**
 * Get report generation endpoint
 * @returns {string} - API endpoint
 */
function getReportGenerateEndpoint() {
  return API_PATHS.REPORTS.GENERATE;
}

/**
 * Get email report endpoint
 * @returns {string} - API endpoint
 */
function getEmailReportEndpoint() {
  return API_PATHS.REPORTS.EMAIL;
}

/**
 * Get CRM connect endpoint
 * @returns {string} - API endpoint
 */
function getCrmConnectEndpoint() {
  return API_PATHS.CRM.CONNECT;
}

/**
 * Get CRM sync endpoint
 * @returns {string} - API endpoint
 */
function getCrmSyncEndpoint() {
  return API_PATHS.CRM.SYNC;
}

/**
 * Get CRM settings endpoint
 * @returns {string} - API endpoint
 */
function getCrmSettingsEndpoint() {
  return API_PATHS.CRM.SETTINGS;
}

/**
 * Get forecasting prediction endpoint
 * @returns {string} - API endpoint
 */
function getForecastingPredictEndpoint() {
  return API_PATHS.FORECASTING.PREDICT;
}

/**
 * Get forecasting scenarios endpoint
 * @returns {string} - API endpoint
 */
function getForecastingScenariosEndpoint() {
  return API_PATHS.FORECASTING.SCENARIOS;
}

/**
 * Get forecasting trends endpoint
 * @returns {string} - API endpoint
 */
function getForecastingTrendsEndpoint() {
  return API_PATHS.FORECASTING.TRENDS;
}

// Export all endpoint functions
export {
  getSheetDataEndpoint,
  getAuthVerifyEndpoint,
  getAuthLoginEndpoint,
  getAuthLogoutEndpoint,
  getAuthRefreshEndpoint,
  getDealsListEndpoint,
  getDealCreateEndpoint,
  getDealUpdateEndpoint,
  getDealDeleteEndpoint,
  getDealHistoryEndpoint,
  getUsersListEndpoint,
  getUserProfileEndpoint,
  getUserUpdateEndpoint,
  getReportGenerateEndpoint,
  getEmailReportEndpoint,
  getCrmConnectEndpoint,
  getCrmSyncEndpoint,
  getCrmSettingsEndpoint,
  getForecastingPredictEndpoint,
  getForecastingScenariosEndpoint,
  getForecastingTrendsEndpoint,
  replacePathParams
};

/**
 * apiEndpoints.js - Enhanced API Endpoints Configuration
 * Centralizes all API endpoint definitions for the application
 * with improved organization and type safety
 */

// Base API paths with versioning support
const API_VERSION = 'v1';
const API_BASE = `/api/${API_VERSION}`;

// Comprehensive API endpoints structure
const API_PATHS = {
  // Authentication endpoints
  AUTH: {
    VERIFY: `${API_BASE}/auth/verify`,
    LOGIN: `${API_BASE}/auth/login`,
    LOGOUT: `${API_BASE}/auth/logout`,
    REFRESH: `${API_BASE}/auth/refresh`,
    REGISTER: `${API_BASE}/auth/register`,
    RESET_PASSWORD: `${API_BASE}/auth/reset-password`,
    CHANGE_PASSWORD: `${API_BASE}/auth/change-password`
  },
  
  // Data endpoints
  DATA: {
    SHEET_DATA: `${API_BASE}/data/sheet`,
    CACHED_DATA: `${API_BASE}/data/cached`,
    METRICS: `${API_BASE}/data/metrics`
  },
  
  // Deal management
  DEALS: {
    LIST: `${API_BASE}/deals`,
    CREATE: `${API_BASE}/deals`,
    GET: `${API_BASE}/deals/:id`,
    UPDATE: `${API_BASE}/deals/:id`,
    DELETE: `${API_BASE}/deals/:id`,
    HISTORY: `${API_BASE}/deals/:id/history`,
    BULK_UPDATE: `${API_BASE}/deals/bulk`,
    STAGES: `${API_BASE}/deals/stages`
  },
  
  // User management
  USERS: {
    LIST: `${API_BASE}/users`,
    GET: `${API_BASE}/users/:id`,
    CREATE: `${API_BASE}/users`,
    UPDATE: `${API_BASE}/users/:id`,
    DELETE: `${API_BASE}/users/:id`,
    PROFILE: `${API_BASE}/users/profile`,
    PREFERENCES: `${API_BASE}/users/preferences`
  },
  
  // Reporting
  REPORTS: {
    GENERATE: `${API_BASE}/reports/generate`,
    LIST: `${API_BASE}/reports`,
    GET: `${API_BASE}/reports/:id`,
    EMAIL: `${API_BASE}/reports/email`,
    SCHEDULE: `${API_BASE}/reports/schedule`,
    TEMPLATES: `${API_BASE}/reports/templates`
  },
  
  // CRM integration
  CRM: {
    CONNECT: `${API_BASE}/crm/connect`,
    SYNC: `${API_BASE}/crm/sync`,
    SETTINGS: `${API_BASE}/crm/settings`,
    PROVIDERS: `${API_BASE}/crm/providers`,
    MAPPING: `${API_BASE}/crm/mapping`
  },
  
  // Forecasting
  FORECASTING: {
    PREDICT: `${API_BASE}/forecasting/predict`,
    SCENARIOS: `${API_BASE}/forecasting/scenarios`,
    TRENDS: `${API_BASE}/forecasting/trends`,
    MODELS: `${API_BASE}/forecasting/models`,
    ACCURACY: `${API_BASE}/forecasting/accuracy`
  },
  
  // System
  SYSTEM: {
    HEALTH: `${API_BASE}/system/health`,
    VERSION: `${API_BASE}/system/version`,
    LOGS: `${API_BASE}/system/logs`
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
    const value = params[key];
    if (value !== undefined && value !== null) {
      processedUrl = processedUrl.replace(`:${key}`, encodeURIComponent(value.toString()));
    }
  });
  
  return processedUrl;
}

/**
 * Add query parameters to URL
 * @param {string} url - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} - URL with query parameters
 */
function addQueryParams(url, params = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== undefined && item !== null) {
            queryParams.append(`${key}[]`, item.toString());
          }
        });
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  const queryString = queryParams.toString();
  if (!queryString) return url;
  
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

// Authentication endpoints
export function getAuthVerifyEndpoint() {
  return API_PATHS.AUTH.VERIFY;
}

export function getAuthLoginEndpoint() {
  return API_PATHS.AUTH.LOGIN;
}

export function getAuthLogoutEndpoint() {
  return API_PATHS.AUTH.LOGOUT;
}

export function getAuthRefreshEndpoint() {
  return API_PATHS.AUTH.REFRESH;
}

export function getAuthRegisterEndpoint() {
  return API_PATHS.AUTH.REGISTER;
}

export function getAuthResetPasswordEndpoint() {
  return API_PATHS.AUTH.RESET_PASSWORD;
}

export function getAuthChangePasswordEndpoint() {
  return API_PATHS.AUTH.CHANGE_PASSWORD;
}

// Data endpoints
export function getSheetDataEndpoint(params = {}) {
  return addQueryParams(API_PATHS.DATA.SHEET_DATA, params);
}

export function getCachedDataEndpoint() {
  return API_PATHS.DATA.CACHED_DATA;
}

export function getMetricsEndpoint(params = {}) {
  return addQueryParams(API_PATHS.DATA.METRICS, params);
}

// Deal endpoints
export function getDealsListEndpoint(params = {}) {
  return addQueryParams(API_PATHS.DEALS.LIST, params);
}

export function getDealCreateEndpoint() {
  return API_PATHS.DEALS.CREATE;
}

export function getDealEndpoint(id) {
  return replacePathParams(API_PATHS.DEALS.GET, { id });
}

export function getDealUpdateEndpoint(id) {
  return replacePathParams(API_PATHS.DEALS.UPDATE, { id });
}

export function getDealDeleteEndpoint(id) {
  return replacePathParams(API_PATHS.DEALS.DELETE, { id });
}

export function getDealHistoryEndpoint(id, params = {}) {
  const url = replacePathParams(API_PATHS.DEALS.HISTORY, { id });
  return addQueryParams(url, params);
}

export function getDealBulkUpdateEndpoint() {
  return API_PATHS.DEALS.BULK_UPDATE;
}

export function getDealStagesEndpoint() {
  return API_PATHS.DEALS.STAGES;
}

// User endpoints
export function getUsersListEndpoint(params = {}) {
  return addQueryParams(API_PATHS.USERS.LIST, params);
}

export function getUserEndpoint(id) {
  return replacePathParams(API_PATHS.USERS.GET, { id });
}

export function getUserCreateEndpoint() {
  return API_PATHS.USERS.CREATE;
}

export function getUserUpdateEndpoint(id) {
  return replacePathParams(API_PATHS.USERS.UPDATE, { id });
}

export function getUserDeleteEndpoint(id) {
  return replacePathParams(API_PATHS.USERS.DELETE, { id });
}

export function getUserProfileEndpoint() {
  return API_PATHS.USERS.PROFILE;
}

export function getUserPreferencesEndpoint() {
  return API_PATHS.USERS.PREFERENCES;
}

// Report endpoints
export function getReportGenerateEndpoint(params = {}) {
  return addQueryParams(API_PATHS.REPORTS.GENERATE, params);
}

export function getReportsListEndpoint(params = {}) {
  return addQueryParams(API_PATHS.REPORTS.LIST, params);
}

export function getReportEndpoint(id) {
  return replacePathParams(API_PATHS.REPORTS.GET, { id });
}

export function getEmailReportEndpoint() {
  return API_PATHS.REPORTS.EMAIL;
}

export function getScheduleReportEndpoint() {
  return API_PATHS.REPORTS.SCHEDULE;
}

export function getReportTemplatesEndpoint() {
  return API_PATHS.REPORTS.TEMPLATES;
}

// CRM endpoints
export function getCrmConnectEndpoint() {
  return API_PATHS.CRM.CONNECT;
}

export function getCrmSyncEndpoint(params = {}) {
  return addQueryParams(API_PATHS.CRM.SYNC, params);
}

export function getCrmSettingsEndpoint() {
  return API_PATHS.CRM.SETTINGS;
}

export function getCrmProvidersEndpoint() {
  return API_PATHS.CRM.PROVIDERS;
}

export function getCrmMappingEndpoint() {
  return API_PATHS.CRM.MAPPING;
}

// Forecasting endpoints
export function getForecastingPredictEndpoint(params = {}) {
  return addQueryParams(API_PATHS.FORECASTING.PREDICT, params);
}

export function getForecastingScenariosEndpoint() {
  return API_PATHS.FORECASTING.SCENARIOS;
}

export function getForecastingTrendsEndpoint(params = {}) {
  return addQueryParams(API_PATHS.FORECASTING.TRENDS, params);
}

export function getForecastingModelsEndpoint() {
  return API_PATHS.FORECASTING.MODELS;
}

export function getForecastingAccuracyEndpoint() {
  return API_PATHS.FORECASTING.ACCURACY;
}

// System endpoints
export function getSystemHealthEndpoint() {
  return API_PATHS.SYSTEM.HEALTH;
}

export function getSystemVersionEndpoint() {
  return API_PATHS.SYSTEM.VERSION;
}

export function getSystemLogsEndpoint(params = {}) {
  return addQueryParams(API_PATHS.SYSTEM.LOGS, params);
}

// Export the API_PATHS object for direct access if needed
export { API_PATHS, API_VERSION, API_BASE };

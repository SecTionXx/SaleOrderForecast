/**
 * apiErrorHandler.js - API Error Handling Utility
 * Provides standardized error handling for API requests
 */

import { logError } from './logger.js';
import config from '../config.js';

/**
 * Standard API error class with enhanced information
 */
export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status || 500;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Convert to a user-friendly error message
   * @returns {string} User-friendly error message
   */
  toUserMessage() {
    // Map common error codes to user-friendly messages
    const userMessages = {
      'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
      'TIMEOUT': 'The request took too long to complete. Please try again.',
      'UNAUTHORIZED': 'Your session has expired. Please log in again.',
      'FORBIDDEN': 'You don\'t have permission to access this resource.',
      'NOT_FOUND': 'The requested resource was not found.',
      'VALIDATION_ERROR': 'There was an issue with the data you submitted.',
      'SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
      'RATE_LIMITED': 'Too many requests. Please try again in a moment.',
      'MAINTENANCE': 'The system is currently under maintenance. Please try again later.'
    };

    return userMessages[this.code] || this.message;
  }
}

/**
 * Handle API errors in a standardized way
 * @param {Error} error - The error object
 * @param {boolean} throwError - Whether to throw the error or return it
 * @returns {ApiError} - Standardized API error
 */
export function handleApiError(error, throwError = false) {
  let apiError;

  // Convert to ApiError if it's not already
  if (!(error instanceof ApiError)) {
    if (error.name === 'AbortError') {
      apiError = new ApiError('Request was aborted', 0, 'TIMEOUT');
    } else if (error.message && error.message.includes('timeout')) {
      apiError = new ApiError('Request timed out', 0, 'TIMEOUT');
    } else if (!navigator.onLine) {
      apiError = new ApiError('No internet connection', 0, 'NETWORK_ERROR');
    } else {
      // Handle response errors
      if (error.response) {
        const { status } = error.response;
        let code = 'SERVER_ERROR';
        let message = 'An error occurred while processing your request';
        let details = null;

        // Map HTTP status codes to error codes
        switch (status) {
          case 400:
            code = 'VALIDATION_ERROR';
            message = 'Invalid request data';
            details = error.response.data;
            break;
          case 401:
            code = 'UNAUTHORIZED';
            message = 'Authentication required';
            break;
          case 403:
            code = 'FORBIDDEN';
            message = 'Access denied';
            break;
          case 404:
            code = 'NOT_FOUND';
            message = 'Resource not found';
            break;
          case 409:
            code = 'CONFLICT';
            message = 'Resource conflict';
            break;
          case 429:
            code = 'RATE_LIMITED';
            message = 'Too many requests';
            break;
          case 500:
            code = 'SERVER_ERROR';
            message = 'Internal server error';
            break;
          case 503:
            code = 'MAINTENANCE';
            message = 'Service unavailable';
            break;
        }

        apiError = new ApiError(message, status, code, details);
      } else {
        // Network or other errors
        apiError = new ApiError(
          error.message || 'Unknown error occurred',
          0,
          'NETWORK_ERROR'
        );
      }
    }
  } else {
    apiError = error;
  }

  // Log the error if enabled in config
  if (config.api.errorLogging) {
    logError('API Error:', {
      message: apiError.message,
      code: apiError.code,
      status: apiError.status,
      details: apiError.details,
      originalError: error
    });
  }

  if (throwError) {
    throw apiError;
  }

  return apiError;
}

/**
 * Parse error response from API
 * @param {Response} response - Fetch API response object
 * @returns {Promise<ApiError>} - Promise resolving to ApiError
 */
export async function parseErrorResponse(response) {
  let errorData = {};
  
  try {
    // Try to parse error response as JSON
    errorData = await response.json();
  } catch (e) {
    // If parsing fails, use text content
    try {
      errorData = { message: await response.text() };
    } catch (textError) {
      errorData = { message: 'Unknown error' };
    }
  }

  const message = errorData.message || errorData.error || `HTTP Error ${response.status}`;
  const code = errorData.code || `HTTP_${response.status}`;
  const details = errorData.details || null;

  return new ApiError(message, response.status, code, details);
}

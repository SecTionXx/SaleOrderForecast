/**
 * Unit tests for errorHandler.js utility
 */

import {
  AppError,
  handleApiError,
  createValidationError,
  createAuthError,
  createPermissionError,
  createNotFoundError,
  ERROR_TYPES,
  ERROR_SEVERITY
} from '../../js/utils/errorHandler';

describe('Error Handler Utility', () => {
  describe('AppError Class', () => {
    test('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(error.details).toEqual({});
      expect(error.severity).toBe(ERROR_SEVERITY.ERROR);
      expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO date format
    });
    
    test('should create an AppError with custom values', () => {
      const details = { field: 'username', code: 'invalid' };
      const error = new AppError(
        'Validation failed',
        ERROR_TYPES.VALIDATION,
        details,
        ERROR_SEVERITY.WARNING
      );
      
      expect(error.message).toBe('Validation failed');
      expect(error.type).toBe(ERROR_TYPES.VALIDATION);
      expect(error.details).toEqual(details);
      expect(error.severity).toBe(ERROR_SEVERITY.WARNING);
    });
  });
  
  describe('handleApiError Function', () => {
    test('should handle 401 authentication errors', () => {
      const originalError = new Error('Unauthorized');
      originalError.response = {
        status: 401,
        statusText: 'Unauthorized'
      };
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.AUTHENTICATION);
      expect(appError.message).toBe('Authentication failed. Please log in again.');
      expect(appError.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(appError.details.status).toBe(401);
    });
    
    test('should handle 403 permission errors', () => {
      const originalError = new Error('Forbidden');
      originalError.response = {
        status: 403,
        statusText: 'Forbidden'
      };
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.PERMISSION);
      expect(appError.message).toBe('You do not have permission to perform this action.');
      expect(appError.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(appError.details.status).toBe(403);
    });
    
    test('should handle 404 not found errors', () => {
      const originalError = new Error('Not Found');
      originalError.response = {
        status: 404,
        statusText: 'Not Found'
      };
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.NOT_FOUND);
      expect(appError.message).toBe('The requested resource was not found.');
      expect(appError.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(appError.details.status).toBe(404);
    });
    
    test('should handle 422 validation errors', () => {
      const originalError = new Error('Unprocessable Entity');
      originalError.response = {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          message: 'Validation failed',
          errors: {
            email: 'Invalid email format',
            password: 'Password too short'
          }
        }
      };
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.VALIDATION);
      expect(appError.message).toBe('Validation failed');
      expect(appError.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(appError.details.status).toBe(422);
      expect(appError.details.errors).toEqual({
        email: 'Invalid email format',
        password: 'Password too short'
      });
    });
    
    test('should handle 500 server errors', () => {
      const originalError = new Error('Internal Server Error');
      originalError.response = {
        status: 500,
        statusText: 'Internal Server Error'
      };
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.API);
      expect(appError.message).toBe('A server error occurred. Please try again later.');
      expect(appError.severity).toBe(ERROR_SEVERITY.ERROR);
      expect(appError.details.status).toBe(500);
    });
    
    test('should handle network errors', () => {
      const originalError = new Error('Network Error');
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.NETWORK);
      expect(appError.message).toBe('A network error occurred. Please check your connection.');
      expect(appError.severity).toBe(ERROR_SEVERITY.WARNING);
    });
    
    test('should handle timeout errors', () => {
      const originalError = new Error('Request timeout');
      
      const appError = handleApiError(originalError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(appError.details.originalMessage).toBe('Request timeout');
    });
  });
  
  describe('Error Creator Functions', () => {
    test('createValidationError should create a validation error', () => {
      const validationErrors = {
        email: 'Invalid email format',
        password: 'Password too short'
      };
      
      const error = createValidationError('Form validation failed', validationErrors);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Form validation failed');
      expect(error.type).toBe(ERROR_TYPES.VALIDATION);
      expect(error.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(error.details.validationErrors).toEqual(validationErrors);
    });
    
    test('createAuthError should create an authentication error', () => {
      const error = createAuthError('Invalid credentials');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.type).toBe(ERROR_TYPES.AUTHENTICATION);
      expect(error.severity).toBe(ERROR_SEVERITY.ERROR);
    });
    
    test('createPermissionError should create a permission error', () => {
      const error = createPermissionError('Access denied');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Access denied');
      expect(error.type).toBe(ERROR_TYPES.PERMISSION);
      expect(error.severity).toBe(ERROR_SEVERITY.ERROR);
    });
    
    test('createNotFoundError should create a not found error', () => {
      const error = createNotFoundError('User');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.type).toBe(ERROR_TYPES.NOT_FOUND);
      expect(error.severity).toBe(ERROR_SEVERITY.WARNING);
      expect(error.details.resource).toBe('User');
    });
  });
});

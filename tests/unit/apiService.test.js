/**
 * Unit tests for apiService.js utility
 */

import apiService from '../../js/utils/apiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({ data: 'test data' }),
      text: jest.fn().mockResolvedValue('test text'),
      headers: new Headers(),
      url: 'http://test.com/api'
    });
  });
  
  describe('HTTP Methods', () => {
    test('get method should make a GET request', async () => {
      const result = await apiService.get('/test');
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test'), expect.objectContaining({
        method: 'GET',
        headers: expect.any(Object)
      }));
      expect(result).toEqual({ data: 'test data' });
    });
    
    test('post method should make a POST request with data', async () => {
      const data = { name: 'Test', value: 123 };
      const result = await apiService.post('/test', data);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test'), expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(data)
      }));
      expect(result).toEqual({ data: 'test data' });
    });
    
    test('put method should make a PUT request with data', async () => {
      const data = { id: 1, name: 'Updated Test' };
      const result = await apiService.put('/test/1', data);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test/1'), expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(data)
      }));
      expect(result).toEqual({ data: 'test data' });
    });
    
    test('delete method should make a DELETE request', async () => {
      const result = await apiService.delete('/test/1');
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test/1'), expect.objectContaining({
        method: 'DELETE',
        headers: expect.any(Object)
      }));
      expect(result).toEqual({ data: 'test data' });
    });
    
    test('patch method should make a PATCH request with data', async () => {
      const data = { status: 'active' };
      const result = await apiService.patch('/test/1', data);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test/1'), expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(data)
      }));
      expect(result).toEqual({ data: 'test data' });
    });
  });
  
  describe('Error Handling', () => {
    test('should handle API error responses', async () => {
      // Mock error response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ 
          message: 'Resource not found',
          error: 'not_found'
        }),
        headers: new Headers(),
        url: 'http://test.com/api/notfound'
      });
      
      await expect(apiService.get('/notfound')).rejects.toThrow('Not Found');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    test('should handle network errors', async () => {
      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network Error'));
      
      await expect(apiService.get('/test')).rejects.toThrow('Network Error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    test('should handle timeout errors', async () => {
      // Mock timeout (this is more complex as we need to mock the Promise.race)
      jest.useFakeTimers();
      
      // Create a promise that never resolves to simulate a hanging request
      global.fetch.mockImplementationOnce(() => new Promise(() => {}));
      
      const promise = apiService.get('/test', { timeout: 1000 });
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(2000);
      
      await expect(promise).rejects.toThrow('Request timed out');
      
      jest.useRealTimers();
    });
  });
  
  describe('Interceptors', () => {
    test('should apply request interceptors', async () => {
      // Add a test interceptor
      const interceptorId = apiService.addRequestInterceptor((config) => {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-Test-Header': 'test-value'
          }
        };
      });
      
      await apiService.get('/test');
      
      expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({
          'X-Test-Header': 'test-value'
        })
      }));
      
      // Clean up
      apiService.removeRequestInterceptor(interceptorId);
    });
    
    test('should apply response interceptors', async () => {
      // Add a test interceptor
      const interceptorId = apiService.addResponseInterceptor((response) => {
        return {
          ...response,
          data: {
            ...response.data,
            intercepted: true
          }
        };
      });
      
      const result = await apiService.get('/test');
      
      expect(result).toEqual({
        data: 'test data',
        intercepted: true
      });
      
      // Clean up
      apiService.removeResponseInterceptor(interceptorId);
    });
    
    test('should handle interceptor errors gracefully', async () => {
      // Add a faulty interceptor
      const interceptorId = apiService.addRequestInterceptor(() => {
        throw new Error('Interceptor error');
      });
      
      // Should still work despite the interceptor error
      const result = await apiService.get('/test');
      expect(result).toEqual({ data: 'test data' });
      
      // Clean up
      apiService.removeRequestInterceptor(interceptorId);
    });
  });
});

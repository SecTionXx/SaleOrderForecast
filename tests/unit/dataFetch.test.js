/**
 * Unit tests for dataFetch.js utility
 */

import {
  fetchDataWithCaching,
  fetchDataFromServer,
  clearCache,
  getLastFetchTimestamp
} from '../../js/utils/dataFetch';
import apiService from '../../js/utils/apiService';

// Mock dependencies
jest.mock('../../js/utils/apiService', () => ({
  get: jest.fn()
}));

describe('Data Fetch Utility', () => {
  // Mock data
  const mockData = [
    { id: 1, name: 'Deal 1', amount: 1000 },
    { id: 2, name: 'Deal 2', amount: 2000 }
  ];
  
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      getStore: () => store
    };
  })();
  
  // Replace global localStorage with mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Mock successful API response
    apiService.get.mockResolvedValue(mockData);
  });
  
  describe('fetchDataFromServer', () => {
    test('should fetch data from the server', async () => {
      const result = await fetchDataFromServer();
      
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(apiService.get).toHaveBeenCalledWith('/api/getSheetData');
      expect(result).toEqual(mockData);
    });
    
    test('should handle API errors', async () => {
      // Mock API error
      apiService.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(fetchDataFromServer()).rejects.toThrow('Failed to fetch data');
    });
  });
  
  describe('fetchDataWithCaching', () => {
    test('should fetch fresh data when cache is empty', async () => {
      const result = await fetchDataWithCaching();
      
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('orderforecast_data_cache');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'orderforecast_data_cache',
        expect.any(String)
      );
      expect(result).toEqual(mockData);
      
      // Verify cache was set
      const cachedData = JSON.parse(localStorageMock.getStore()['orderforecast_data_cache']);
      expect(cachedData.data).toEqual(mockData);
      expect(cachedData.timestamp).toBeGreaterThan(0);
    });
    
    test('should use cached data when available and not expired', async () => {
      // Set up cache with non-expired data
      const cachedData = {
        timestamp: Date.now(),
        data: mockData
      };
      localStorageMock.setItem('orderforecast_data_cache', JSON.stringify(cachedData));
      
      const result = await fetchDataWithCaching();
      
      expect(apiService.get).not.toHaveBeenCalled();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('orderforecast_data_cache');
      expect(result).toEqual(mockData);
    });
    
    test('should fetch fresh data when cache is expired', async () => {
      // Set up cache with expired data (older than 5 minutes)
      const cachedData = {
        timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago
        data: [{ id: 3, name: 'Old Deal', amount: 3000 }]
      };
      localStorageMock.setItem('orderforecast_data_cache', JSON.stringify(cachedData));
      
      const result = await fetchDataWithCaching();
      
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('orderforecast_data_cache');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'orderforecast_data_cache',
        expect.any(String)
      );
      expect(result).toEqual(mockData);
    });
    
    test('should force fetch fresh data when forceFresh is true', async () => {
      // Set up cache with non-expired data
      const cachedData = {
        timestamp: Date.now(),
        data: [{ id: 3, name: 'Cached Deal', amount: 3000 }]
      };
      localStorageMock.setItem('orderforecast_data_cache', JSON.stringify(cachedData));
      
      const result = await fetchDataWithCaching(true);
      
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
    
    test('should fall back to cache when force fetch fails', async () => {
      // Set up cache with non-expired data
      const cachedData = {
        timestamp: Date.now(),
        data: [{ id: 3, name: 'Cached Deal', amount: 3000 }]
      };
      localStorageMock.setItem('orderforecast_data_cache', JSON.stringify(cachedData));
      
      // Mock API error
      apiService.get.mockRejectedValueOnce(new Error('API Error'));
      
      const result = await fetchDataWithCaching(true);
      
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(cachedData.data);
    });
    
    test('should throw error when both fetch and cache fail', async () => {
      // Mock API error
      apiService.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(fetchDataWithCaching(true)).rejects.toThrow('Failed to fetch data');
    });
  });
  
  describe('clearCache', () => {
    test('should clear the data cache', () => {
      // Set up cache
      const cachedData = {
        timestamp: Date.now(),
        data: mockData
      };
      localStorageMock.setItem('orderforecast_data_cache', JSON.stringify(cachedData));
      
      clearCache();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('orderforecast_data_cache');
    });
  });
  
  describe('getLastFetchTimestamp', () => {
    test('should return the timestamp of the last fetch', () => {
      // Set up cache with timestamp
      const timestamp = Date.now();
      const cachedData = {
        timestamp,
        data: mockData
      };
      localStorageMock.setItem('orderforecast_data_cache', JSON.stringify(cachedData));
      
      const result = getLastFetchTimestamp();
      
      expect(result).toBe(timestamp);
    });
    
    test('should return null when no cache exists', () => {
      const result = getLastFetchTimestamp();
      
      expect(result).toBeNull();
    });
  });
});

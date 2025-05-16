/**
 * Unit tests for analytics service
 */

import analyticsService from '../../js/services/analyticsService.js';
import { apiService } from '../../js/utils/apiService.js';

// Mock the API service
jest.mock('../../js/utils/apiService.js', () => ({
  apiService: {
    get: jest.fn()
  }
}));

// Mock data for testing
const mockSalesData = [
  { date: '2023-01-01', amount: 100 },
  { date: '2023-02-01', amount: 120 },
  { date: '2023-03-01', amount: 110 },
  { date: '2023-04-01', amount: 130 },
  { date: '2023-05-01', amount: 150 },
  { date: '2023-06-01', amount: 140 },
  { date: '2023-07-01', amount: 160 },
  { date: '2023-08-01', amount: 200 },
  { date: '2023-09-01', amount: 190 },
  { date: '2023-10-01', amount: 210 },
  { date: '2023-11-01', amount: 230 },
  { date: '2023-12-01', amount: 250 }
];

describe('Analytics Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Reset cached data
    analyticsService.cachedData = null;
    analyticsService.lastFetchTime = null;
  });

  describe('fetchSalesData', () => {
    test('should fetch sales data from API when cache is empty', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.fetchSalesData();
      
      // Should call API
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining('/api/sales/data'));
      
      // Should return data and update cache
      expect(result).toEqual(mockSalesData);
      expect(analyticsService.cachedData).toEqual(mockSalesData);
      expect(analyticsService.lastFetchTime).toBeTruthy();
    });

    test('should use cached data when available and not expired', async () => {
      // Setup cached data
      analyticsService.cachedData = mockSalesData;
      analyticsService.lastFetchTime = new Date().getTime();
      
      const result = await analyticsService.fetchSalesData();
      
      // Should not call API
      expect(apiService.get).not.toHaveBeenCalled();
      
      // Should return cached data
      expect(result).toEqual(mockSalesData);
    });

    test('should force fresh data fetch when requested', async () => {
      // Setup cached data
      analyticsService.cachedData = mockSalesData;
      analyticsService.lastFetchTime = new Date().getTime();
      
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.fetchSalesData({ forceFresh: true });
      
      // Should call API despite having cached data
      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSalesData);
    });

    test('should handle API errors', async () => {
      // Setup API mock error response
      apiService.get.mockResolvedValueOnce({
        success: false,
        error: 'API error'
      });
      
      await expect(analyticsService.fetchSalesData()).rejects.toThrow('API error');
    });
  });

  describe('analyzeSalesTrends', () => {
    test('should analyze sales trends with default options', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.analyzeSalesTrends();
      
      // Should call fetchSalesData
      expect(apiService.get).toHaveBeenCalledTimes(1);
      
      // Should return analysis results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSalesData);
      expect(result.analysis).toBeTruthy();
      expect(result.analysis.metrics).toBeTruthy();
      expect(result.analysis.summary).toBeTruthy();
    });

    test('should handle empty data', async () => {
      // Setup API mock response with empty data
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: []
      });
      
      const result = await analyticsService.analyzeSalesTrends();
      
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should use custom analysis options', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const options = {
        startDate: '2023-01-01',
        endDate: '2023-06-30',
        groupBy: 'week',
        movingAveragePeriod: 4,
        emaAlpha: 0.4,
        outlierThreshold: 2.5,
        seasonality: 4
      };
      
      const result = await analyticsService.analyzeSalesTrends(options);
      
      // Should include options in result
      expect(result.options).toMatchObject(options);
    });
  });

  describe('generateSalesForecast', () => {
    test('should generate sales forecast with default options', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.generateSalesForecast();
      
      // Should call fetchSalesData
      expect(apiService.get).toHaveBeenCalledTimes(1);
      
      // Should return forecast results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSalesData);
      expect(result.forecast).toBeTruthy();
      expect(result.forecast.length).toBeGreaterThan(0);
      expect(result.scenarios).toBeTruthy();
    });

    test('should handle empty data', async () => {
      // Setup API mock response with empty data
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: []
      });
      
      const result = await analyticsService.generateSalesForecast();
      
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should use custom forecast options', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const options = {
        periods: 12,
        method: 'linear',
        confidenceLevel: 0.9,
        includeScenarios: false
      };
      
      const result = await analyticsService.generateSalesForecast(options);
      
      // Should include options in result
      expect(result.options).toMatchObject(options);
      
      // Should not include scenarios if not requested
      expect(result.scenarios).toBeNull();
    });
  });

  describe('identifySalesAnomalies', () => {
    test('should identify sales anomalies with default options', async () => {
      // Setup API mock response with data containing an outlier
      const dataWithOutlier = [...mockSalesData, { date: '2024-01-01', amount: 1000 }];
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: dataWithOutlier
      });
      
      const result = await analyticsService.identifySalesAnomalies();
      
      // Should call fetchSalesData
      expect(apiService.get).toHaveBeenCalledTimes(1);
      
      // Should return anomaly results
      expect(result.success).toBe(true);
      expect(result.data).toEqual(dataWithOutlier);
      expect(result.anomalies).toBeTruthy();
      expect(result.anomalyCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty data', async () => {
      // Setup API mock response with empty data
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: []
      });
      
      const result = await analyticsService.identifySalesAnomalies();
      
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should use custom anomaly detection options', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const options = {
        threshold: 1.5 // More sensitive threshold
      };
      
      const result = await analyticsService.identifySalesAnomalies(options);
      
      // Should include options in result
      expect(result.options.threshold).toBe(1.5);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    test('should calculate performance metrics with default options', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.calculatePerformanceMetrics();
      
      // Should call fetchSalesData
      expect(apiService.get).toHaveBeenCalledTimes(1);
      
      // Should return metrics results
      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.metrics).toBeTruthy();
      expect(result.metrics.total).toBeTruthy();
      expect(result.metrics.average).toBeTruthy();
      expect(result.metrics.trend).toBeTruthy();
    });

    test('should handle empty data', async () => {
      // Setup API mock response with empty data
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: []
      });
      
      const result = await analyticsService.calculatePerformanceMetrics();
      
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should calculate period-over-period comparison', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const options = {
        compareWithPrevious: true,
        previousPeriodCount: 3
      };
      
      const result = await analyticsService.calculatePerformanceMetrics(options);
      
      // Should include period comparison
      expect(result.periodComparison).toBeTruthy();
      expect(result.periodComparison.currentPeriod).toBeTruthy();
      expect(result.periodComparison.previousPeriod).toBeTruthy();
      expect(result.periodComparison.change).toBeTruthy();
    });
  });

  describe('generatePerformanceReport', () => {
    test('should generate comprehensive performance report', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.generatePerformanceReport({
        includeForecasts: true,
        includeTrends: true,
        includeAnomalies: true
      });
      
      // Should call fetchSalesData only once (and reuse data for other methods)
      expect(apiService.get).toHaveBeenCalledTimes(1);
      
      // Should return report results
      expect(result.success).toBe(true);
      expect(result.summary).toBeTruthy();
      expect(result.metrics).toBeTruthy();
      expect(result.trends).toBeTruthy();
      expect(result.forecasts).toBeTruthy();
      expect(result.anomalies).toBeTruthy();
    });

    test('should generate report with only requested components', async () => {
      // Setup API mock response
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: mockSalesData
      });
      
      const result = await analyticsService.generatePerformanceReport({
        includeForecasts: true,
        includeTrends: false,
        includeAnomalies: false
      });
      
      // Should include only requested components
      expect(result.success).toBe(true);
      expect(result.metrics).toBeTruthy();
      expect(result.forecasts).toBeTruthy();
      expect(result.trends).toBeNull();
      expect(result.anomalies).toBeNull();
    });

    test('should handle empty data', async () => {
      // Setup API mock response with empty data
      apiService.get.mockResolvedValueOnce({
        success: true,
        data: []
      });
      
      const result = await analyticsService.generatePerformanceReport();
      
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});

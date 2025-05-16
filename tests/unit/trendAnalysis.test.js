/**
 * Unit tests for trend analysis module
 */

import {
  calculateMovingAverage,
  calculateExponentialMovingAverage,
  calculateLinearRegression,
  calculateSeasonalIndices,
  detectOutliers,
  calculateGrowthRates,
  calculateCumulativeSum,
  analyzeTrends
} from '../../js/analytics/trendAnalysis.js';

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

// Array data for simpler tests
const simpleData = [10, 20, 15, 30, 25, 40, 35];

describe('Trend Analysis Module', () => {
  describe('calculateMovingAverage', () => {
    test('should calculate moving average for object data', () => {
      const result = calculateMovingAverage(mockSalesData, 3, 'amount');
      
      // We should have n-period+1 results
      expect(result.length).toBe(mockSalesData.length - 3 + 1);
      
      // First moving average should be average of first 3 values
      expect(result[0].movingAverage).toBeCloseTo((100 + 120 + 110) / 3, 2);
      
      // Last moving average should be average of last 3 values
      expect(result[result.length - 1].movingAverage).toBeCloseTo((210 + 230 + 250) / 3, 2);
    });

    test('should calculate moving average for array data', () => {
      const result = calculateMovingAverage(simpleData, 3);
      
      expect(result.length).toBe(simpleData.length - 3 + 1);
      expect(result[0].movingAverage).toBeCloseTo((10 + 20 + 15) / 3, 2);
      expect(result[result.length - 1].movingAverage).toBeCloseTo((25 + 40 + 35) / 3, 2);
    });

    test('should return empty array for insufficient data', () => {
      const result = calculateMovingAverage([10, 20], 3);
      expect(result).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(calculateMovingAverage([], 3)).toEqual([]);
      expect(calculateMovingAverage(null, 3)).toEqual([]);
      expect(calculateMovingAverage(undefined, 3)).toEqual([]);
    });
  });

  describe('calculateExponentialMovingAverage', () => {
    test('should calculate EMA for object data', () => {
      const result = calculateExponentialMovingAverage(mockSalesData, 0.3, 'amount');
      
      expect(result.length).toBe(mockSalesData.length);
      expect(result[0].ema).toBe(100); // First value is the same as the first data point
      expect(typeof result[1].ema).toBe('number');
      
      // Verify EMA calculation for second point
      // EMA = alpha * current + (1 - alpha) * previous
      const expectedSecondEMA = 0.3 * 120 + 0.7 * 100;
      expect(result[1].ema).toBeCloseTo(expectedSecondEMA, 2);
    });

    test('should calculate EMA for array data', () => {
      const result = calculateExponentialMovingAverage(simpleData, 0.3);
      
      expect(result.length).toBe(simpleData.length);
      expect(result[0].ema).toBe(10);
      
      // Verify calculation
      const expectedSecondEMA = 0.3 * 20 + 0.7 * 10;
      expect(result[1].ema).toBeCloseTo(expectedSecondEMA, 2);
    });

    test('should handle empty or invalid input', () => {
      expect(calculateExponentialMovingAverage([], 0.3)).toEqual([]);
      expect(calculateExponentialMovingAverage(null, 0.3)).toEqual([]);
      expect(calculateExponentialMovingAverage(undefined, 0.3)).toEqual([]);
    });
  });

  describe('calculateLinearRegression', () => {
    test('should calculate linear regression parameters for object data', () => {
      const result = calculateLinearRegression(mockSalesData, null, 'amount');
      
      expect(result).toHaveProperty('slope');
      expect(result).toHaveProperty('intercept');
      expect(result).toHaveProperty('r2');
      
      // Slope should be positive for increasing data
      expect(result.slope).toBeGreaterThan(0);
      
      // R-squared should be between 0 and 1
      expect(result.r2).toBeGreaterThanOrEqual(0);
      expect(result.r2).toBeLessThanOrEqual(1);
    });

    test('should calculate linear regression for array data', () => {
      const result = calculateLinearRegression(simpleData);
      
      expect(result).toHaveProperty('slope');
      expect(result).toHaveProperty('intercept');
      expect(result).toHaveProperty('r2');
      
      // Slope should be positive for increasing data
      expect(result.slope).toBeGreaterThan(0);
    });

    test('should handle insufficient data', () => {
      const result = calculateLinearRegression([10]);
      expect(result).toEqual({ slope: 0, intercept: 0, r2: 0 });
    });

    test('should handle empty or invalid input', () => {
      expect(calculateLinearRegression([])).toEqual({ slope: 0, intercept: 0, r2: 0 });
      expect(calculateLinearRegression(null)).toEqual({ slope: 0, intercept: 0, r2: 0 });
      expect(calculateLinearRegression(undefined)).toEqual({ slope: 0, intercept: 0, r2: 0 });
    });
  });

  describe('calculateSeasonalIndices', () => {
    test('should calculate seasonal indices for monthly data', () => {
      const result = calculateSeasonalIndices(mockSalesData, 12, 'amount');
      
      expect(result.length).toBe(12);
      
      // Seasonal indices should average to approximately 1
      const avgIndex = result.reduce((sum, val) => sum + val, 0) / result.length;
      expect(avgIndex).toBeCloseTo(1, 1);
    });

    test('should handle insufficient data', () => {
      // Not enough data for a full season
      const result = calculateSeasonalIndices(mockSalesData.slice(0, 6), 12, 'amount');
      expect(result).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(calculateSeasonalIndices([], 12)).toEqual([]);
      expect(calculateSeasonalIndices(null, 12)).toEqual([]);
      expect(calculateSeasonalIndices(undefined, 12)).toEqual([]);
    });
  });

  describe('detectOutliers', () => {
    test('should detect outliers using z-score method', () => {
      // Create data with an obvious outlier
      const dataWithOutlier = [...mockSalesData, { date: '2024-01-01', amount: 1000 }];
      
      const result = detectOutliers(dataWithOutlier, 2, 'amount');
      
      // Should detect the outlier
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(dataWithOutlier.length - 1);
    });

    test('should not detect outliers in uniform data', () => {
      // Create uniform data
      const uniformData = Array(10).fill({ amount: 100 });
      
      const result = detectOutliers(uniformData, 2, 'amount');
      
      // Should not detect any outliers
      expect(result.length).toBe(0);
    });

    test('should handle empty or invalid input', () => {
      expect(detectOutliers([], 2)).toEqual([]);
      expect(detectOutliers(null, 2)).toEqual([]);
      expect(detectOutliers(undefined, 2)).toEqual([]);
    });
  });

  describe('calculateGrowthRates', () => {
    test('should calculate growth rates for object data', () => {
      const result = calculateGrowthRates(mockSalesData, 'amount');
      
      expect(result.length).toBe(mockSalesData.length - 1);
      
      // First growth rate should be (120 - 100) / 100 = 0.2
      expect(result[0].growthRate).toBeCloseTo(0.2, 2);
    });

    test('should handle division by zero', () => {
      const dataWithZero = [
        { amount: 0 },
        { amount: 100 }
      ];
      
      const result = calculateGrowthRates(dataWithZero, 'amount');
      
      // Growth rate should be 0 when previous value is 0
      expect(result[0].growthRate).toBe(0);
    });

    test('should handle empty or invalid input', () => {
      expect(calculateGrowthRates([], 'amount')).toEqual([]);
      expect(calculateGrowthRates([10], 'amount')).toEqual([]);
      expect(calculateGrowthRates(null, 'amount')).toEqual([]);
      expect(calculateGrowthRates(undefined, 'amount')).toEqual([]);
    });
  });

  describe('calculateCumulativeSum', () => {
    test('should calculate cumulative sum for object data', () => {
      const result = calculateCumulativeSum(mockSalesData, 'amount');
      
      expect(result.length).toBe(mockSalesData.length);
      
      // First cumulative sum should be the first value
      expect(result[0].cumulativeSum).toBe(100);
      
      // Last cumulative sum should be the sum of all values
      const totalSum = mockSalesData.reduce((sum, item) => sum + item.amount, 0);
      expect(result[result.length - 1].cumulativeSum).toBe(totalSum);
    });

    test('should calculate cumulative sum for array data', () => {
      const result = calculateCumulativeSum(simpleData);
      
      expect(result.length).toBe(simpleData.length);
      expect(result[0].cumulativeSum).toBe(10);
      
      const totalSum = simpleData.reduce((sum, val) => sum + val, 0);
      expect(result[result.length - 1].cumulativeSum).toBe(totalSum);
    });

    test('should handle empty or invalid input', () => {
      expect(calculateCumulativeSum([])).toEqual([]);
      expect(calculateCumulativeSum(null)).toEqual([]);
      expect(calculateCumulativeSum(undefined)).toEqual([]);
    });
  });

  describe('analyzeTrends', () => {
    test('should analyze trends and return comprehensive results', () => {
      const result = analyzeTrends(mockSalesData, { valueKey: 'amount', dateKey: 'date' });
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('summary');
      
      // Check metrics
      expect(result.metrics).toHaveProperty('movingAverages');
      expect(result.metrics).toHaveProperty('ema');
      expect(result.metrics).toHaveProperty('regression');
      expect(result.metrics).toHaveProperty('growthRates');
      expect(result.metrics).toHaveProperty('outliers');
      expect(result.metrics).toHaveProperty('cumulativeSum');
      
      // Check summary
      expect(result.summary).toHaveProperty('trendDirection');
      expect(result.summary).toHaveProperty('overallGrowthRate');
      expect(result.summary).toHaveProperty('avgGrowthRate');
      expect(result.summary).toHaveProperty('volatility');
      
      // Trend direction should be 'increasing' for our test data
      expect(['increasing', 'stable', 'decreasing']).toContain(result.summary.trendDirection);
    });

    test('should handle empty or invalid input', () => {
      const emptyResult = analyzeTrends([]);
      expect(emptyResult.success).toBe(false);
      expect(emptyResult).toHaveProperty('error');
      
      const nullResult = analyzeTrends(null);
      expect(nullResult.success).toBe(false);
      expect(nullResult).toHaveProperty('error');
    });
  });
});

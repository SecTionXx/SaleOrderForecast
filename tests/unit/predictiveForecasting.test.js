/**
 * Unit tests for predictive forecasting module
 */

import {
  movingAverageForecast,
  exponentialSmoothingForecast,
  linearRegressionForecast,
  seasonalForecast,
  weightedAverageForecast,
  ensembleForecast,
  forecastWithConfidenceIntervals,
  scenarioForecasting
} from '../../js/analytics/predictiveForecasting.js';

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

describe('Predictive Forecasting Module', () => {
  describe('movingAverageForecast', () => {
    test('should generate forecast based on moving average', () => {
      const periods = 3;
      const result = movingAverageForecast(mockSalesData, periods, 3, 'amount', 'date');
      
      expect(result.length).toBe(periods);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('forecast');
      expect(result[0]).toHaveProperty('method');
      expect(result[0].method).toBe('moving_average');
      
      // All forecast values should be the same (based on last moving average)
      const firstValue = result[0].amount;
      result.forEach(point => {
        expect(point.amount).toBe(firstValue);
      });
      
      // Forecast dates should be sequential months
      if (result[0].date && result[1].date) {
        const firstDate = new Date(result[0].date);
        const secondDate = new Date(result[1].date);
        const monthDiff = (secondDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                          secondDate.getMonth() - firstDate.getMonth();
        expect(monthDiff).toBe(1);
      }
    });

    test('should handle insufficient data', () => {
      const result = movingAverageForecast([{ amount: 100 }, { amount: 120 }], 3, 3, 'amount');
      expect(result).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(movingAverageForecast([], 3)).toEqual([]);
      expect(movingAverageForecast(null, 3)).toEqual([]);
      expect(movingAverageForecast(undefined, 3)).toEqual([]);
    });
  });

  describe('exponentialSmoothingForecast', () => {
    test('should generate forecast based on exponential smoothing', () => {
      const periods = 3;
      const result = exponentialSmoothingForecast(mockSalesData, periods, 0.3, 'amount', 'date');
      
      expect(result.length).toBe(periods);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('forecast');
      expect(result[0]).toHaveProperty('method');
      expect(result[0].method).toBe('exponential_smoothing');
      
      // All forecast values should be the same (based on last EMA)
      const firstValue = result[0].amount;
      result.forEach(point => {
        expect(point.amount).toBe(firstValue);
      });
    });

    test('should work with minimal data', () => {
      const result = exponentialSmoothingForecast([{ amount: 100 }], 2, 0.3, 'amount');
      expect(result.length).toBe(2);
      expect(result[0].amount).toBe(100);
    });

    test('should handle empty or invalid input', () => {
      expect(exponentialSmoothingForecast([], 3)).toEqual([]);
      expect(exponentialSmoothingForecast(null, 3)).toEqual([]);
      expect(exponentialSmoothingForecast(undefined, 3)).toEqual([]);
    });
  });

  describe('linearRegressionForecast', () => {
    test('should generate forecast based on linear regression', () => {
      const periods = 3;
      const result = linearRegressionForecast(mockSalesData, periods, 'amount', 'date');
      
      expect(result.length).toBe(periods);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('forecast');
      expect(result[0]).toHaveProperty('method');
      expect(result[0].method).toBe('linear_regression');
      
      // For increasing data, forecast values should be increasing
      if (result.length >= 2) {
        expect(result[1].amount).toBeGreaterThan(result[0].amount);
      }
    });

    test('should handle insufficient data', () => {
      const result = linearRegressionForecast([{ amount: 100 }], 3, 'amount');
      expect(result).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(linearRegressionForecast([], 3)).toEqual([]);
      expect(linearRegressionForecast(null, 3)).toEqual([]);
      expect(linearRegressionForecast(undefined, 3)).toEqual([]);
    });
  });

  describe('seasonalForecast', () => {
    test('should generate forecast based on seasonal patterns', () => {
      const periods = 3;
      const result = seasonalForecast(mockSalesData, periods, 4, 'amount', 'date');
      
      expect(result.length).toBe(periods);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('forecast');
      expect(result[0]).toHaveProperty('method');
      expect(result[0].method).toBe('seasonal');
      expect(result[0]).toHaveProperty('trendComponent');
      expect(result[0]).toHaveProperty('seasonalComponent');
    });

    test('should handle insufficient data', () => {
      // Not enough data for seasonal patterns
      const result = seasonalForecast(mockSalesData.slice(0, 3), 3, 4, 'amount');
      expect(result).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(seasonalForecast([], 3)).toEqual([]);
      expect(seasonalForecast(null, 3)).toEqual([]);
      expect(seasonalForecast(undefined, 3)).toEqual([]);
    });
  });

  describe('weightedAverageForecast', () => {
    test('should generate forecast based on weighted average', () => {
      const periods = 3;
      const weights = [0.5, 0.3, 0.2];
      const result = weightedAverageForecast(mockSalesData, periods, weights, 'amount', 'date');
      
      expect(result.length).toBe(periods);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('forecast');
      expect(result[0]).toHaveProperty('method');
      expect(result[0].method).toBe('weighted_average');
      
      // All forecast values should be the same
      const firstValue = result[0].amount;
      result.forEach(point => {
        expect(point.amount).toBe(firstValue);
      });
    });

    test('should handle insufficient data', () => {
      const weights = [0.5, 0.3, 0.2];
      const result = weightedAverageForecast(mockSalesData.slice(0, 2), 3, weights, 'amount');
      expect(result).toEqual([]);
    });

    test('should handle empty or invalid input', () => {
      expect(weightedAverageForecast([], 3)).toEqual([]);
      expect(weightedAverageForecast(null, 3)).toEqual([]);
      expect(weightedAverageForecast(undefined, 3)).toEqual([]);
    });
  });

  describe('ensembleForecast', () => {
    test('should generate forecast combining multiple methods', () => {
      const periods = 3;
      const options = {
        methods: ['linear', 'moving_average', 'exponential'],
        weights: {
          linear: 0.4,
          moving_average: 0.3,
          exponential: 0.3
        }
      };
      
      const result = ensembleForecast(mockSalesData, periods, options, 'amount', 'date');
      
      expect(result.length).toBe(periods);
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('forecast');
      expect(result[0]).toHaveProperty('method');
      expect(result[0].method).toBe('ensemble');
      
      // Should have individual method forecasts
      expect(result[0]).toHaveProperty('linear_forecast');
      expect(result[0]).toHaveProperty('moving_average_forecast');
      expect(result[0]).toHaveProperty('exponential_forecast');
    });

    test('should handle empty methods array', () => {
      const result = ensembleForecast(mockSalesData, 3, { methods: [] }, 'amount');
      expect(result.length).toBe(3);
      
      // All values should be 0 if no methods are provided
      result.forEach(point => {
        expect(point.amount).toBe(0);
      });
    });

    test('should handle empty or invalid input', () => {
      expect(ensembleForecast([], 3)).toEqual([]);
      expect(ensembleForecast(null, 3)).toEqual([]);
      expect(ensembleForecast(undefined, 3)).toEqual([]);
    });
  });

  describe('forecastWithConfidenceIntervals', () => {
    test('should generate forecast with confidence intervals', () => {
      const periods = 3;
      const result = forecastWithConfidenceIntervals(mockSalesData, periods, {
        method: 'linear',
        confidenceLevel: 0.95
      }, 'amount', 'date');
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('forecast');
      expect(result.forecast.length).toBe(periods);
      
      // Each forecast point should have confidence intervals
      result.forecast.forEach(point => {
        expect(point).toHaveProperty('amount');
        expect(point).toHaveProperty('lower');
        expect(point).toHaveProperty('upper');
        expect(point).toHaveProperty('confidence');
        
        // Upper bound should be greater than lower bound
        expect(point.upper).toBeGreaterThan(point.lower);
        
        // Forecast value should be between bounds
        expect(point.amount).toBeGreaterThanOrEqual(point.lower);
        expect(point.amount).toBeLessThanOrEqual(point.upper);
      });
      
      // Confidence level should be as specified
      expect(result.forecast[0].confidence).toBe(0.95);
    });

    test('should handle different confidence levels', () => {
      const result90 = forecastWithConfidenceIntervals(mockSalesData, 1, {
        method: 'linear',
        confidenceLevel: 0.9
      }, 'amount');
      
      const result95 = forecastWithConfidenceIntervals(mockSalesData, 1, {
        method: 'linear',
        confidenceLevel: 0.95
      }, 'amount');
      
      const result99 = forecastWithConfidenceIntervals(mockSalesData, 1, {
        method: 'linear',
        confidenceLevel: 0.99
      }, 'amount');
      
      // Higher confidence level should have wider intervals
      expect(result99.forecast[0].upper - result99.forecast[0].lower)
        .toBeGreaterThan(result95.forecast[0].upper - result95.forecast[0].lower);
      
      expect(result95.forecast[0].upper - result95.forecast[0].lower)
        .toBeGreaterThan(result90.forecast[0].upper - result90.forecast[0].lower);
    });

    test('should handle empty or invalid input', () => {
      const result = forecastWithConfidenceIntervals([], 3);
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('scenarioForecasting', () => {
    test('should generate forecasts for multiple scenarios', () => {
      const periods = 3;
      const scenarios = [
        { name: 'optimistic', growthFactor: 1.2 },
        { name: 'realistic', growthFactor: 1.0 },
        { name: 'pessimistic', growthFactor: 0.8 }
      ];
      
      const result = scenarioForecasting(mockSalesData, periods, scenarios, 'amount', 'date');
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('baseForecast');
      
      // Should have all specified scenarios
      expect(result.scenarios).toHaveProperty('optimistic');
      expect(result.scenarios).toHaveProperty('realistic');
      expect(result.scenarios).toHaveProperty('pessimistic');
      
      // Each scenario should have the correct number of forecast points
      expect(result.scenarios.optimistic.length).toBe(periods);
      expect(result.scenarios.realistic.length).toBe(periods);
      expect(result.scenarios.pessimistic.length).toBe(periods);
      
      // Optimistic scenario should have higher values than realistic
      for (let i = 0; i < periods; i++) {
        expect(result.scenarios.optimistic[i].amount)
          .toBeGreaterThan(result.scenarios.realistic[i].amount);
        
        expect(result.scenarios.realistic[i].amount)
          .toBeGreaterThan(result.scenarios.pessimistic[i].amount);
      }
    });

    test('should use default scenarios if none provided', () => {
      const result = scenarioForecasting(mockSalesData, 3, [], 'amount', 'date');
      
      expect(result.success).toBe(true);
      expect(result.scenarios).toHaveProperty('optimistic');
      expect(result.scenarios).toHaveProperty('realistic');
      expect(result.scenarios).toHaveProperty('pessimistic');
    });

    test('should handle empty or invalid input', () => {
      const result = scenarioForecasting([], 3);
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });
});

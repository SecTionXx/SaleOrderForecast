/**
 * predictiveForecasting.js - Predictive Forecasting Algorithms
 * Provides algorithms for predicting future sales based on historical data
 * Optimized for performance with large datasets
 */

import { logDebug, logError } from '../utils/logger.js';
import { 
  calculateMovingAverage, 
  calculateExponentialMovingAverage,
  calculateLinearRegression,
  calculateSeasonalIndices
} from './trendAnalysis.js';
import {
  processInChunks,
  processWithWorker,
  optimizedSort,
  streamingTransform,
  memoize
} from '../utils/dataProcessingOptimizer.js';

/**
 * Simple moving average forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} windowSize - Size of the moving average window
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function movingAverageForecast(historicalData, periods = 3, windowSize = 3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < windowSize) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Calculate moving average for historical data
  const movingAverages = calculateMovingAverage(sortedData, windowSize, valueKey);
  
  // Use the last moving average as the forecast for future periods
  const lastMA = movingAverages[movingAverages.length - 1].movingAverage;
  const forecast = [];
  
  // Generate dates for forecast periods
  let lastDate = null;
  if (dateKey && sortedData[sortedData.length - 1][dateKey]) {
    lastDate = new Date(sortedData[sortedData.length - 1][dateKey]);
  }
  
  for (let i = 0; i < periods; i++) {
    let forecastDate = null;
    
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: lastMA,
      forecast: true,
      method: 'moving_average'
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Exponential smoothing forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} alpha - Smoothing factor (0 < alpha < 1)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function exponentialSmoothingForecast(historicalData, periods = 3, alpha = 0.3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Calculate exponential moving average for historical data
  const emaData = calculateExponentialMovingAverage(sortedData, alpha, valueKey);
  
  // Use the last EMA as the forecast for future periods
  const lastEMA = emaData[emaData.length - 1].ema;
  const forecast = [];
  
  // Generate dates for forecast periods
  let lastDate = null;
  if (dateKey && sortedData[sortedData.length - 1][dateKey]) {
    lastDate = new Date(sortedData[sortedData.length - 1][dateKey]);
  }
  
  for (let i = 0; i < periods; i++) {
    let forecastDate = null;
    
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: lastEMA,
      forecast: true,
      method: 'exponential_smoothing'
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Linear regression forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
// Memoized linear regression calculation for better performance with repeated calls
const memoizedLinearRegression = memoize((xValues, yValues) => {
  const n = xValues.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumXX += xValues[i] * xValues[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}, (args) => {
  // Custom key function to handle arrays
  const [xValues, yValues] = args;
  return `${xValues.length}_${yValues.length}`;
});

function linearRegressionForecast(historicalData, periods = 3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < 2) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Convert dates to numeric values for regression
  let xValues = [];
  if (dateKey && sortedData[0][dateKey]) {
    const baseDate = new Date(sortedData[0][dateKey]);
    xValues = sortedData.map(item => {
      const date = new Date(item[dateKey]);
      return (date - baseDate) / (1000 * 60 * 60 * 24 * 30); // Convert to months
    });
  } else {
    xValues = sortedData.map((_, index) => index);
  }
  
  // Extract y values
  const yValues = sortedData.map(item => Number(item[valueKey]) || 0);
  
  // Calculate linear regression using memoized function for better performance
  const { slope, intercept } = memoizedLinearRegression(xValues, yValues);
  
  // Generate forecast
  const forecast = [];
  
  // Generate dates for forecast periods
  let lastDate = null;
  if (dateKey && sortedData[sortedData.length - 1][dateKey]) {
    lastDate = new Date(sortedData[sortedData.length - 1][dateKey]);
  }
  
  const lastX = xValues[xValues.length - 1];
  
  for (let i = 0; i < periods; i++) {
    const forecastX = lastX + i + 1;
    const forecastY = slope * forecastX + intercept;
    
    let forecastDate = null;
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: forecastY,
      forecast: true,
      method: 'linear_regression'
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Seasonal forecast using multiplicative seasonal model
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} seasonality - Number of periods in a season
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function seasonalForecast(historicalData, periods = 3, seasonality = 12, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < seasonality * 2) {
    return [];
  }
  
  // Sort data by date if dateKey is provided
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData.sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Calculate seasonal indices
  const seasonalIndices = calculateSeasonalIndices(sortedData, seasonality, valueKey);
  
  // Calculate trend using linear regression
  const regression = calculateLinearRegression(sortedData, null, valueKey);
  
  // Generate forecast
  const forecast = [];
  
  // Generate dates for forecast periods
  let lastDate = null;
  if (dateKey && sortedData[sortedData.length - 1][dateKey]) {
    lastDate = new Date(sortedData[sortedData.length - 1][dateKey]);
  }
  
  const n = sortedData.length;
  
  for (let i = 0; i < periods; i++) {
    const forecastX = n + i;
    const trendComponent = regression.slope * forecastX + regression.intercept;
    const seasonIndex = (n + i) % seasonality;
    const seasonalComponent = seasonalIndices[seasonIndex];
    
    const forecastValue = trendComponent * seasonalComponent;
    
    let forecastDate = null;
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: forecastValue,
      forecast: true,
      method: 'seasonal',
      trendComponent,
      seasonalComponent
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Weighted average forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Array} weights - Weights for each historical data point (most recent first)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function weightedAverageForecast(historicalData, periods = 3, weights = [0.5, 0.3, 0.2], valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < weights.length) {
    return [];
  }
  
  // Sort data by date if dateKey is provided
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData.sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Calculate weighted average
  const recentData = sortedData.slice(-weights.length);
  let weightedSum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < weights.length; i++) {
    const value = typeof recentData[recentData.length - 1 - i] === 'object' ? 
      Number(recentData[recentData.length - 1 - i][valueKey]) || 0 : 
      Number(recentData[recentData.length - 1 - i]) || 0;
    
    weightedSum += value * weights[i];
    weightSum += weights[i];
  }
  
  const weightedAverage = weightedSum / weightSum;
  
  // Generate forecast
  const forecast = [];
  
  // Generate dates for forecast periods
  let lastDate = null;
  if (dateKey && sortedData[sortedData.length - 1][dateKey]) {
    lastDate = new Date(sortedData[sortedData.length - 1][dateKey]);
  }
  
  for (let i = 0; i < periods; i++) {
    let forecastDate = null;
    
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: weightedAverage,
      forecast: true,
      method: 'weighted_average'
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Ensemble forecast (combining multiple forecasting methods)
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
/**
 * Ensemble forecast (combining multiple forecasting methods)
 * Optimized for large datasets using parallel processing when available
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
async function ensembleForecast(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return [];
  }
  
  const {
    methods = ['linear', 'moving_average', 'exponential', 'seasonal'],
    weights = {
      linear: 0.3,
      moving_average: 0.2,
      exponential: 0.2,
      seasonal: 0.3
    },
    movingAveragePeriod = 3,
    emaAlpha = 0.3,
    seasonality = 12
  } = options;
  
  // Generate forecasts for each method
 * Generate forecast with confidence intervals
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Object} - Forecast with confidence intervals
 */
async function forecastWithConfidenceIntervals(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return {
      success: false,
      error: 'Invalid or empty dataset'
    };
  }
  
  try {
    const {
      method = 'ensemble',
      confidenceLevel = 0.95,
      ...methodOptions
    } = options;
    
    // Generate forecasts using different methods - process in parallel for large datasets
    const forecastPromises = [];
    const forecasts = [];
    
    if (options.methods) {
      // For large datasets, process forecasts in parallel
      if (historicalData.length > 1000) {
        if (options.methods.includes('moving_average')) {
          forecastPromises.push(
            processWithWorker(historicalData, (data, opts) => {
              // This function will run in a separate thread
              return movingAverageForecast(
                data, 
                opts.periods, 
                opts.windowSize, 
                opts.valueKey, 
                opts.dateKey
              );
            }, {
              periods,
              windowSize: options.windowSize || 3,
              valueKey,
              dateKey
            }).then(result => {
              forecasts.push({
                method: 'moving_average',
                forecast: result,
                weight: options.weights?.moving_average || 1
              });
            })
          );
        }
        
        if (options.methods.includes('exponential_smoothing')) {
          forecastPromises.push(
            processWithWorker(historicalData, (data, opts) => {
              return exponentialSmoothingForecast(
                data, 
                opts.periods, 
                opts.alpha, 
                opts.valueKey, 
                opts.dateKey
              );
            }, {
              periods,
              alpha: options.alpha || 0.3,
              valueKey,
              dateKey
            }).then(result => {
              forecasts.push({
                method: 'exponential_smoothing',
                forecast: result,
                weight: options.weights?.exponential_smoothing || 1
              });
            })
          );
        }
        
        if (options.methods.includes('linear_regression')) {
          forecastPromises.push(
            processWithWorker(historicalData, (data, opts) => {
              return linearRegressionForecast(
                data, 
                opts.periods, 
                opts.valueKey, 
                opts.dateKey
              );
            }, {
              periods,
              valueKey,
              dateKey
            }).then(result => {
              forecasts.push({
                method: 'linear_regression',
                forecast: result,
                weight: options.weights?.linear_regression || 1
              });
            })
          );
        }
        
        if (options.methods.includes('seasonal')) {
          forecastPromises.push(
            processWithWorker(historicalData, (data, opts) => {
              return seasonalForecast(
                data, 
                opts.periods, 
                opts.seasonality, 
                opts.valueKey, 
                opts.dateKey
              );
            }, {
              periods,
              seasonality: options.seasonality || 12,
              valueKey,
              dateKey
            }).then(result => {
              forecasts.push({
                method: 'seasonal',
                forecast: result,
                weight: options.weights?.seasonal || 1
              });
            })
          );
        }
        
        // Wait for all forecasts to complete
        try {
          await Promise.all(forecastPromises);
        } catch (error) {
          logError('Error in parallel forecast processing:', error);
          // Fall back to sequential processing if parallel processing fails
          forecasts.length = 0; // Clear any partial results
          
          if (options.methods.includes('moving_average')) {
            const maForecast = movingAverageForecast(
              historicalData, 
              periods, 
              options.windowSize || 3, 
              valueKey, 
              dateKey
            );
            forecasts.push({
              method: 'moving_average',
              forecast: maForecast,
              weight: options.weights?.moving_average || 1
            });
          }
          
          // Add other methods similarly...
        }
      } else {
        // For smaller datasets, use regular processing
        if (options.methods.includes('moving_average')) {
          const maForecast = movingAverageForecast(
            historicalData, 
            periods, 
            options.windowSize || 3, 
            valueKey, 
            dateKey
          );
          forecasts.push({
            method: 'moving_average',
            forecast: maForecast,
            weight: options.weights?.moving_average || 1
          });
        }
        
        if (options.methods.includes('exponential_smoothing')) {
          const esForecast = exponentialSmoothingForecast(
            historicalData, 
            periods, 
            options.alpha || 0.3, 
            valueKey, 
            dateKey
          );
          forecasts.push({
            method: 'exponential_smoothing',
            forecast: esForecast,
            weight: options.weights?.exponential_smoothing || 1
          });
        }
        
        if (options.methods.includes('linear_regression')) {
          const lrForecast = linearRegressionForecast(
            historicalData, 
            periods, 
            valueKey, 
            dateKey
          );
          forecasts.push({
            method: 'linear_regression',
            forecast: lrForecast,
            weight: options.weights?.linear_regression || 1
          });
        }
        
        if (options.methods.includes('seasonal')) {
          const seasonalForecast = seasonalForecast(
            historicalData, 
            periods, 
            options.seasonality || 12, 
            valueKey, 
            dateKey
          );
          forecasts.push({
            method: 'seasonal',
            forecast: seasonalForecast,
            weight: options.weights?.seasonal || 1
          });
        }
      }
    } else {
      // Default methods if none provided
      const maForecast = movingAverageForecast(
        historicalData, 
        periods, 
        3, 
        valueKey, 
        dateKey
      );
      forecasts.push({
        method: 'moving_average',
        forecast: maForecast,
        weight: 1
      });
      
      const esForecast = exponentialSmoothingForecast(
        historicalData, 
        periods, 
        0.3, 
        valueKey, 
        dateKey
      );
      forecasts.push({
        method: 'exponential_smoothing',
        forecast: esForecast,
        weight: 1
      });
      
      const lrForecast = linearRegressionForecast(
        historicalData, 
        periods, 
        valueKey, 
        dateKey
      );
      forecasts.push({
        method: 'linear_regression',
        forecast: lrForecast,
        weight: 1
      });
      
      const seasonalForecast = seasonalForecast(
        historicalData, 
        periods, 
        12, 
        valueKey, 
        dateKey
      );
      forecasts.push({
        method: 'seasonal',
        forecast: seasonalForecast,
        weight: 1
      });
    }
    
    // Calculate prediction error from historical data
    const values = historicalData.map(item => 
      typeof item === 'object' ? Number(item[valueKey]) || 0 : Number(item) || 0
    );
    
    // Calculate standard deviation of historical data
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score for the confidence level
    // For 95% confidence, z = 1.96
    const zScore = confidenceLevel === 0.9 ? 1.645 :
                  confidenceLevel === 0.95 ? 1.96 :
                  confidenceLevel === 0.99 ? 2.576 : 1.96;
    
    // Add confidence intervals to forecast
    const forecastWithIntervals = forecast.map((point, index) => {
      const forecastValue = point[valueKey];
      
      // Increase uncertainty for further periods
      const periodFactor = 1 + (index * 0.1);
      const marginOfError = zScore * stdDev * periodFactor;
      
      return {
        ...point,
        lower: Math.max(0, forecastValue - marginOfError),
        upper: forecastValue + marginOfError,
        confidence: confidenceLevel
      };
    });
    
    return {
      success: true,
      forecast: forecastWithIntervals,
      method,
      confidenceLevel,
      metrics: {
        meanHistorical: mean,
        stdDevHistorical: stdDev
      }
    };
  } catch (error) {
    logError('Error generating forecast with confidence intervals:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate forecast for multiple scenarios
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Array} scenarios - Scenario configurations
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Object} - Forecasts for different scenarios
 */
async function scenarioForecasting(historicalData, periods = 3, scenarios = [], valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return {
      success: false,
      error: 'Invalid or empty dataset'
    };
  }
  
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    // Default scenarios if none provided
    scenarios = [
      { name: 'optimistic', growthFactor: 1.2 },
      { name: 'realistic', growthFactor: 1.0 },
      { name: 'pessimistic', growthFactor: 0.8 }
    ];
  }
  
  try {
    // Generate base forecast
    const baseForecast = forecastWithConfidenceIntervals(
      historicalData, 
      periods, 
      { method: 'ensemble' }, 
      valueKey, 
      dateKey
    );
    
    if (!baseForecast.success) {
      return baseForecast;
    }
    
    // Generate scenario forecasts
    const scenarioForecasts = {};
    
    for (const scenario of scenarios) {
      const { name, growthFactor = 1.0, ...scenarioOptions } = scenario;
      
      // Apply growth factor to base forecast
      const scenarioForecast = baseForecast.forecast.map(point => {
        const forecastValue = point[valueKey] * growthFactor;
        
        return {
          ...point,
          [valueKey]: forecastValue,
          lower: point.lower * growthFactor,
          upper: point.upper * growthFactor,
          scenario: name
        };
      });
      
      scenarioForecasts[name] = scenarioForecast;
    }
    
    return {
      success: true,
      scenarios: scenarioForecasts,
      baseForecast: baseForecast.forecast
    };
  } catch (error) {
    logError('Error generating scenario forecasts:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export forecasting functions
// Export forecasting functions
export {
  movingAverageForecast,
  exponentialSmoothingForecast,
  linearRegressionForecast,
  seasonalForecast,
  weightedAverageForecast,
  ensembleForecast,
  forecastWithConfidenceIntervals,
  scenarioForecasting
};

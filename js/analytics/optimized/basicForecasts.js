/**
 * basicForecasts.js - Basic Optimized Forecasting Algorithms
 * Provides optimized implementations of simple forecasting algorithms
 * Designed for handling large datasets efficiently
 */

import { logDebug, logError } from '../../utils/logger.js';
import { 
  calculateMovingAverage, 
  calculateExponentialMovingAverage
} from '../trendAnalysis.js';
import {
  optimizedSort,
  streamingTransform
} from '../../utils/dataProcessingOptimizer.js';

/**
 * Optimized moving average forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} windowSize - Size of the moving average window
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function optimizedMovingAverageForecast(historicalData, periods = 3, windowSize = 3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < windowSize) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // For large datasets, use streaming transform to calculate moving average
  let movingAverages;
  if (sortedData.length > 10000) {
    // Use a sliding window approach to calculate moving average for very large datasets
    const sum = new Array(windowSize).fill(0);
    let windowSum = 0;
    
    // Initialize the sum with the first windowSize elements
    for (let i = 0; i < Math.min(windowSize, sortedData.length); i++) {
      const value = typeof sortedData[i] === 'object' ? 
        Number(sortedData[i][valueKey]) || 0 : 
        Number(sortedData[i]) || 0;
      
      sum[i % windowSize] = value;
      windowSum += value;
    }
    
    // Calculate moving averages using sliding window
    movingAverages = [];
    for (let i = windowSize - 1; i < sortedData.length; i++) {
      const average = windowSum / windowSize;
      const dataPoint = typeof sortedData[i] === 'object' ? { ...sortedData[i] } : { value: sortedData[i] };
      
      movingAverages.push({
        ...dataPoint,
        movingAverage: average
      });
      
      // Update sliding window for next iteration
      if (i + 1 < sortedData.length) {
        const outgoingValue = typeof sortedData[i - windowSize + 1] === 'object' ? 
          Number(sortedData[i - windowSize + 1][valueKey]) || 0 : 
          Number(sortedData[i - windowSize + 1]) || 0;
          
        const incomingValue = typeof sortedData[i + 1] === 'object' ? 
          Number(sortedData[i + 1][valueKey]) || 0 : 
          Number(sortedData[i + 1]) || 0;
          
        windowSum = windowSum - outgoingValue + incomingValue;
      }
    }
  } else {
    // For smaller datasets, use the standard calculation
    movingAverages = calculateMovingAverage(sortedData, windowSize, valueKey);
  }
  
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
 * Optimized exponential smoothing forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} alpha - Smoothing factor (0 < alpha < 1)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function optimizedExponentialSmoothingForecast(historicalData, periods = 3, alpha = 0.3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // For large datasets, use streaming transform to calculate EMA
  let emaData;
  if (sortedData.length > 10000) {
    // Use streaming approach for very large datasets
    emaData = [];
    let ema = typeof sortedData[0] === 'object' ? 
      Number(sortedData[0][valueKey]) || 0 : 
      Number(sortedData[0]) || 0;
    
    // Calculate EMA for each data point
    for (let i = 0; i < sortedData.length; i++) {
      const value = typeof sortedData[i] === 'object' ? 
        Number(sortedData[i][valueKey]) || 0 : 
        Number(sortedData[i]) || 0;
      
      // EMA = alpha * current value + (1 - alpha) * previous EMA
      ema = alpha * value + (1 - alpha) * ema;
      
      const dataPoint = typeof sortedData[i] === 'object' ? 
        { ...sortedData[i] } : 
        { value: sortedData[i] };
      
      emaData.push({
        ...dataPoint,
        ema: ema
      });
    }
  } else {
    // For smaller datasets, use the standard calculation
    emaData = calculateExponentialMovingAverage(sortedData, alpha, valueKey);
  }
  
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
 * Optimized weighted average forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Array} weights - Weights for each historical data point (most recent first)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function optimizedWeightedAverageForecast(historicalData, periods = 3, weights = [0.5, 0.3, 0.2], valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0 || !Array.isArray(weights) || weights.length === 0) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Get the most recent data points based on weights length
  const recentData = sortedData.slice(-weights.length);
  
  // If we don't have enough data points, adjust weights
  const adjustedWeights = [...weights];
  if (recentData.length < weights.length) {
    adjustedWeights.splice(0, weights.length - recentData.length);
  }
  
  // Normalize weights to sum to 1
  const weightSum = adjustedWeights.reduce((sum, weight) => sum + weight, 0);
  const normalizedWeights = adjustedWeights.map(weight => weight / weightSum);
  
  // Calculate weighted average
  let weightedAverage = 0;
  for (let i = 0; i < recentData.length; i++) {
    const value = typeof recentData[recentData.length - 1 - i] === 'object' ? 
      Number(recentData[recentData.length - 1 - i][valueKey]) || 0 : 
      Number(recentData[recentData.length - 1 - i]) || 0;
    
    weightedAverage += value * normalizedWeights[i];
  }
  
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

// Export optimized basic forecasting functions
export {
  optimizedMovingAverageForecast,
  optimizedExponentialSmoothingForecast,
  optimizedWeightedAverageForecast
};

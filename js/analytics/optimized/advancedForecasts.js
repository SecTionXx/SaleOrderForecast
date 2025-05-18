/**
 * advancedForecasts.js - Advanced Optimized Forecasting Algorithms
 * Provides optimized implementations of complex forecasting algorithms
 * Designed for handling large datasets efficiently
 */

import { logDebug, logError } from '../../utils/logger.js';
import { 
  calculateLinearRegression,
  calculateSeasonalIndices
} from '../trendAnalysis.js';
import {
  optimizedSort,
  memoize
} from '../../utils/dataProcessingOptimizer.js';

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

/**
 * Optimized linear regression forecast
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function optimizedLinearRegressionForecast(historicalData, periods = 3, valueKey = 'amount', dateKey = 'date') {
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
      method: 'linear_regression',
      slope,
      intercept
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Optimized seasonal forecast using multiplicative seasonal model
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} seasonality - Number of periods in a season
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function optimizedSeasonalForecast(historicalData, periods = 3, seasonality = 12, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < seasonality * 2) {
    return [];
  }
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Calculate seasonal indices
  const seasonalIndices = calculateSeasonalIndices(sortedData, seasonality, valueKey);
  
  if (seasonalIndices.length === 0) {
    return [];
  }
  
  // Calculate trend using linear regression
  let xValues = sortedData.map((_, index) => index);
  let yValues = sortedData.map(item => Number(item[valueKey]) || 0);
  
  // Deseasonalize data for trend calculation
  const deseasonalizedY = [];
  for (let i = 0; i < yValues.length; i++) {
    const seasonIndex = i % seasonality;
    const seasonalIndex = seasonalIndices[seasonIndex];
    deseasonalizedY.push(yValues[i] / seasonalIndex);
  }
  
  // Calculate trend using linear regression on deseasonalized data
  const { slope, intercept } = memoizedLinearRegression(xValues, deseasonalizedY);
  
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
    const seasonIndex = (sortedData.length + i) % seasonality;
    const seasonalIndex = seasonalIndices[seasonIndex];
    
    // Calculate trend component
    const trendComponent = slope * forecastX + intercept;
    
    // Apply seasonal index
    const forecastY = trendComponent * seasonalIndex;
    
    let forecastDate = null;
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: forecastY,
      forecast: true,
      method: 'seasonal',
      trend: trendComponent,
      seasonalIndex
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

/**
 * Optimized ARIMA forecast (Auto-Regressive Integrated Moving Average)
 * Simplified implementation for large datasets
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - ARIMA parameters (p, d, q)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function optimizedArimaForecast(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length < 10) {
    return [];
  }
  
  const { p = 1, d = 1, q = 0 } = options;
  
  // Sort data by date if dateKey is provided - use optimized sort for large datasets
  let sortedData = [...historicalData];
  if (dateKey && sortedData[0] && sortedData[0][dateKey]) {
    sortedData = optimizedSort(sortedData, (a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
  }
  
  // Extract values
  const values = sortedData.map(item => Number(item[valueKey]) || 0);
  
  // Differencing (d parameter)
  let diffValues = [...values];
  for (let i = 0; i < d; i++) {
    const tempValues = [];
    for (let j = 1; j < diffValues.length; j++) {
      tempValues.push(diffValues[j] - diffValues[j - 1]);
    }
    diffValues = tempValues;
  }
  
  // Auto-regressive coefficients (p parameter)
  // Simplified approach: use correlation between values at different lags
  const arCoefficients = [];
  for (let i = 1; i <= p; i++) {
    let numerator = 0;
    let denominator = 0;
    
    for (let j = i; j < diffValues.length; j++) {
      numerator += diffValues[j] * diffValues[j - i];
      denominator += diffValues[j - i] * diffValues[j - i];
    }
    
    const coefficient = denominator !== 0 ? numerator / denominator : 0;
    arCoefficients.push(coefficient);
  }
  
  // Moving average coefficients (q parameter)
  // Simplified approach: use average of residuals
  const residuals = [];
  for (let i = p; i < diffValues.length; i++) {
    let predicted = 0;
    for (let j = 0; j < p; j++) {
      predicted += arCoefficients[j] * diffValues[i - j - 1];
    }
    residuals.push(diffValues[i] - predicted);
  }
  
  const maCoefficients = [];
  for (let i = 0; i < q; i++) {
    if (residuals.length > i) {
      const sum = residuals.slice(0, residuals.length - i).reduce((acc, val, idx) => 
        acc + val * residuals[idx + i], 0);
      const denominator = residuals.reduce((acc, val) => acc + val * val, 0);
      const coefficient = denominator !== 0 ? sum / denominator : 0;
      maCoefficients.push(coefficient);
    } else {
      maCoefficients.push(0);
    }
  }
  
  // Generate forecast
  const forecast = [];
  let lastValues = diffValues.slice(-Math.max(p, q));
  let lastResiduals = residuals.slice(-q);
  
  // Generate dates for forecast periods
  let lastDate = null;
  if (dateKey && sortedData[sortedData.length - 1][dateKey]) {
    lastDate = new Date(sortedData[sortedData.length - 1][dateKey]);
  }
  
  for (let i = 0; i < periods; i++) {
    // Forecast next differenced value
    let forecastDiff = 0;
    
    // AR component
    for (let j = 0; j < p && j < lastValues.length; j++) {
      forecastDiff += arCoefficients[j] * lastValues[lastValues.length - j - 1];
    }
    
    // MA component
    for (let j = 0; j < q && j < lastResiduals.length; j++) {
      forecastDiff += maCoefficients[j] * lastResiduals[lastResiduals.length - j - 1];
    }
    
    // Update last values and residuals
    lastValues.push(forecastDiff);
    lastValues.shift();
    
    const residual = 0; // Assume zero residual for future periods
    lastResiduals.push(residual);
    lastResiduals.shift();
    
    // Convert differenced forecast back to original scale
    let forecastValue = forecastDiff;
    let lastOriginalValues = values.slice(-d - 1);
    
    for (let j = d - 1; j >= 0; j--) {
      forecastValue += lastOriginalValues[j + 1];
    }
    
    let forecastDate = null;
    if (lastDate) {
      forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    }
    
    const forecastPoint = {
      [valueKey]: forecastValue,
      forecast: true,
      method: 'arima',
      parameters: { p, d, q }
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate.toISOString().split('T')[0];
    }
    
    forecast.push(forecastPoint);
  }
  
  return forecast;
}

// Export optimized advanced forecasting functions
export {
  optimizedLinearRegressionForecast,
  optimizedSeasonalForecast,
  optimizedArimaForecast
};

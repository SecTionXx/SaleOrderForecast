/**
 * optimizedForecasting.js - Optimized Forecasting Algorithms
 * Provides high-performance algorithms for predicting future sales based on historical data
 * Specifically designed for handling large datasets efficiently
 */

import { logDebug, logError } from '../../utils/logger.js';
import { 
  calculateMovingAverage, 
  calculateExponentialMovingAverage,
  calculateLinearRegression,
  calculateSeasonalIndices
} from '../trendAnalysis.js';
import {
  processInChunks,
  processWithWorker,
  optimizedSort,
  streamingTransform,
  memoize
} from '../../utils/dataProcessingOptimizer.js';

// Import specialized forecasting methods
import { 
  optimizedMovingAverageForecast,
  optimizedExponentialSmoothingForecast
} from './basicForecasts.js';
import {
  optimizedLinearRegressionForecast,
  optimizedSeasonalForecast
} from './advancedForecasts.js';

/**
 * Ensemble forecast (combining multiple forecasting methods)
 * Optimized for large datasets using parallel processing when available
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Promise<Array>} - Forecasted data points
 */
async function optimizedEnsembleForecast(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return [];
  }
  
  const {
    methods = ['moving_average', 'exponential_smoothing', 'linear_regression', 'seasonal'],
    weights = {
      moving_average: 1,
      exponential_smoothing: 1,
      linear_regression: 1,
      seasonal: 1
    },
    movingAveragePeriod = 3,
    emaAlpha = 0.3,
    seasonality = 12
  } = options;
  
  // For large datasets, process forecasts in parallel
  const forecastPromises = [];
  const forecasts = [];
  
  if (historicalData.length > 1000) {
    try {
      // Process forecasts in parallel for large datasets
      if (methods.includes('moving_average')) {
        forecastPromises.push(
          processWithWorker(historicalData, (data, opts) => {
            return optimizedMovingAverageForecast(
              data, 
              opts.periods, 
              opts.windowSize, 
              opts.valueKey, 
              opts.dateKey
            );
          }, {
            periods,
            windowSize: movingAveragePeriod,
            valueKey,
            dateKey
          }).then(result => {
            forecasts.push({
              method: 'moving_average',
              forecast: result,
              weight: weights.moving_average || 1
            });
          })
        );
      }
      
      if (methods.includes('exponential_smoothing')) {
        forecastPromises.push(
          processWithWorker(historicalData, (data, opts) => {
            return optimizedExponentialSmoothingForecast(
              data, 
              opts.periods, 
              opts.alpha, 
              opts.valueKey, 
              opts.dateKey
            );
          }, {
            periods,
            alpha: emaAlpha,
            valueKey,
            dateKey
          }).then(result => {
            forecasts.push({
              method: 'exponential_smoothing',
              forecast: result,
              weight: weights.exponential_smoothing || 1
            });
          })
        );
      }
      
      if (methods.includes('linear_regression')) {
        forecastPromises.push(
          processWithWorker(historicalData, (data, opts) => {
            return optimizedLinearRegressionForecast(
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
              weight: weights.linear_regression || 1
            });
          })
        );
      }
      
      if (methods.includes('seasonal')) {
        forecastPromises.push(
          processWithWorker(historicalData, (data, opts) => {
            return optimizedSeasonalForecast(
              data, 
              opts.periods, 
              opts.seasonality, 
              opts.valueKey, 
              opts.dateKey
            );
          }, {
            periods,
            seasonality,
            valueKey,
            dateKey
          }).then(result => {
            forecasts.push({
              method: 'seasonal',
              forecast: result,
              weight: weights.seasonal || 1
            });
          })
        );
      }
      
      // Wait for all forecasts to complete
      await Promise.all(forecastPromises);
    } catch (error) {
      logError('Error in parallel forecast processing:', error);
      // Fall back to sequential processing if parallel processing fails
      return optimizedEnsembleForecastSequential(historicalData, periods, options, valueKey, dateKey);
    }
  } else {
    // For smaller datasets, use sequential processing
    return optimizedEnsembleForecastSequential(historicalData, periods, options, valueKey, dateKey);
  }
  
  // Combine forecasts with weighted average
  const ensemble = [];
  let totalWeight = 0;
  
  // Calculate total weight
  for (const forecastData of forecasts) {
    totalWeight += forecastData.weight;
  }
  
  // If no valid forecasts or weights, return empty array
  if (forecasts.length === 0 || totalWeight === 0) {
    return [];
  }
  
  // Generate ensemble forecast for each period
  for (let i = 0; i < periods; i++) {
    let weightedSum = 0;
    let validWeightSum = 0;
    let forecastDate = null;
    
    // Calculate weighted sum for this period
    for (const forecastData of forecasts) {
      const forecast = forecastData.forecast;
      const weight = forecastData.weight;
      
      if (forecast && forecast[i]) {
        weightedSum += forecast[i][valueKey] * weight;
        validWeightSum += weight;
        
        // Get forecast date if available
        if (!forecastDate && forecast[i][dateKey]) {
          forecastDate = forecast[i][dateKey];
        }
      }
    }
    
    // Create ensemble forecast point
    const ensembleValue = validWeightSum > 0 ? weightedSum / validWeightSum : 0;
    
    const forecastPoint = {
      [valueKey]: ensembleValue,
      forecast: true,
      method: 'ensemble'
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate;
    }
    
    // Add individual method forecasts
    for (const forecastData of forecasts) {
      const forecast = forecastData.forecast;
      const method = forecastData.method;
      
      if (forecast && forecast[i]) {
        forecastPoint[`${method}_forecast`] = forecast[i][valueKey];
      }
    }
    
    ensemble.push(forecastPoint);
  }
  
  return ensemble;
}

/**
 * Sequential version of ensemble forecast for fallback
 * @private
 */
function optimizedEnsembleForecastSequential(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  const {
    methods = ['moving_average', 'exponential_smoothing', 'linear_regression', 'seasonal'],
    weights = {
      moving_average: 1,
      exponential_smoothing: 1,
      linear_regression: 1,
      seasonal: 1
    },
    movingAveragePeriod = 3,
    emaAlpha = 0.3,
    seasonality = 12
  } = options;
  
  const forecasts = [];
  
  // Generate forecasts sequentially
  if (methods.includes('moving_average')) {
    const maForecast = optimizedMovingAverageForecast(
      historicalData, 
      periods, 
      movingAveragePeriod, 
      valueKey, 
      dateKey
    );
    forecasts.push({
      method: 'moving_average',
      forecast: maForecast,
      weight: weights.moving_average || 1
    });
  }
  
  if (methods.includes('exponential_smoothing')) {
    const esForecast = optimizedExponentialSmoothingForecast(
      historicalData, 
      periods, 
      emaAlpha, 
      valueKey, 
      dateKey
    );
    forecasts.push({
      method: 'exponential_smoothing',
      forecast: esForecast,
      weight: weights.exponential_smoothing || 1
    });
  }
  
  if (methods.includes('linear_regression')) {
    const lrForecast = optimizedLinearRegressionForecast(
      historicalData, 
      periods, 
      valueKey, 
      dateKey
    );
    forecasts.push({
      method: 'linear_regression',
      forecast: lrForecast,
      weight: weights.linear_regression || 1
    });
  }
  
  if (methods.includes('seasonal')) {
    const seasonalForecast = optimizedSeasonalForecast(
      historicalData, 
      periods, 
      seasonality, 
      valueKey, 
      dateKey
    );
    forecasts.push({
      method: 'seasonal',
      forecast: seasonalForecast,
      weight: weights.seasonal || 1
    });
  }
  
  // Combine forecasts with weighted average
  const ensemble = [];
  let totalWeight = 0;
  
  // Calculate total weight
  for (const forecastData of forecasts) {
    totalWeight += forecastData.weight;
  }
  
  // If no valid forecasts or weights, return empty array
  if (forecasts.length === 0 || totalWeight === 0) {
    return [];
  }
  
  // Generate ensemble forecast for each period
  for (let i = 0; i < periods; i++) {
    let weightedSum = 0;
    let validWeightSum = 0;
    let forecastDate = null;
    
    // Calculate weighted sum for this period
    for (const forecastData of forecasts) {
      const forecast = forecastData.forecast;
      const weight = forecastData.weight;
      
      if (forecast && forecast[i]) {
        weightedSum += forecast[i][valueKey] * weight;
        validWeightSum += weight;
        
        // Get forecast date if available
        if (!forecastDate && forecast[i][dateKey]) {
          forecastDate = forecast[i][dateKey];
        }
      }
    }
    
    // Create ensemble forecast point
    const ensembleValue = validWeightSum > 0 ? weightedSum / validWeightSum : 0;
    
    const forecastPoint = {
      [valueKey]: ensembleValue,
      forecast: true,
      method: 'ensemble'
    };
    
    if (forecastDate) {
      forecastPoint[dateKey] = forecastDate;
    }
    
    // Add individual method forecasts
    for (const forecastData of forecasts) {
      const forecast = forecastData.forecast;
      const method = forecastData.method;
      
      if (forecast && forecast[i]) {
        forecastPoint[`${method}_forecast`] = forecast[i][valueKey];
      }
    }
    
    ensemble.push(forecastPoint);
  }
  
  return ensemble;
}

/**
 * Generate forecast with confidence intervals
 * Optimized for large datasets
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Promise<Object>} - Forecast with confidence intervals
 */
async function optimizedForecastWithConfidenceIntervals(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
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
    
    // Generate base forecast
    let forecast;
    
    switch (method) {
      case 'linear':
        forecast = optimizedLinearRegressionForecast(historicalData, periods, valueKey, dateKey);
        break;
      case 'moving_average':
        forecast = optimizedMovingAverageForecast(historicalData, periods, methodOptions.windowSize || 3, valueKey, dateKey);
        break;
      case 'exponential':
        forecast = optimizedExponentialSmoothingForecast(historicalData, periods, methodOptions.alpha || 0.3, valueKey, dateKey);
        break;
      case 'seasonal':
        forecast = optimizedSeasonalForecast(historicalData, periods, methodOptions.seasonality || 12, valueKey, dateKey);
        break;
      case 'ensemble':
      default:
        forecast = await optimizedEnsembleForecast(historicalData, periods, methodOptions, valueKey, dateKey);
        break;
    }
    
    // Calculate prediction error from historical data
    const errors = [];
    const sortedData = optimizedSort([...historicalData], (a, b) => 
      new Date(a[dateKey]) - new Date(b[dateKey])
    );
    
    // Use a sliding window approach to calculate errors
    const windowSize = Math.min(6, Math.floor(sortedData.length / 3));
    if (windowSize < 2) {
      // Not enough data for confidence intervals
      return {
        success: true,
        forecast,
        confidenceIntervals: null,
        message: 'Not enough historical data for confidence intervals'
      };
    }
    
    // Calculate errors using sliding window
    for (let i = windowSize; i < sortedData.length; i++) {
      const historicalWindow = sortedData.slice(i - windowSize, i);
      let predictedValue;
      
      switch (method) {
        case 'linear':
          const regression = calculateLinearRegression(historicalWindow, null, valueKey);
          predictedValue = regression.slope * windowSize + regression.intercept;
          break;
        case 'moving_average':
          const ma = calculateMovingAverage(historicalWindow, methodOptions.windowSize || 3, valueKey);
          predictedValue = ma[ma.length - 1].movingAverage;
          break;
        case 'exponential':
          const ema = calculateExponentialMovingAverage(historicalWindow, methodOptions.alpha || 0.3, valueKey);
          predictedValue = ema[ema.length - 1].ema;
          break;
        case 'ensemble':
        default:
          // For ensemble, use average of recent values as a simple approximation
          const sum = historicalWindow.reduce((acc, val) => acc + Number(val[valueKey]), 0);
          predictedValue = sum / historicalWindow.length;
          break;
      }
      
      const actualValue = Number(sortedData[i][valueKey]);
      const error = actualValue - predictedValue;
      errors.push(error);
    }
    
    // Calculate standard deviation of errors
    const meanError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    const squaredDiffs = errors.map(error => Math.pow(error - meanError, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / errors.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score for confidence level
    // Approximation of z-score for common confidence levels
    let zScore;
    if (confidenceLevel >= 0.99) {
      zScore = 2.576; // 99% confidence
    } else if (confidenceLevel >= 0.95) {
      zScore = 1.96; // 95% confidence
    } else if (confidenceLevel >= 0.90) {
      zScore = 1.645; // 90% confidence
    } else if (confidenceLevel >= 0.80) {
      zScore = 1.28; // 80% confidence
    } else {
      zScore = 1.0; // Default
    }
    
    // Calculate confidence intervals
    const marginOfError = zScore * stdDev;
    const confidenceIntervals = forecast.map(point => {
      const forecastValue = Number(point[valueKey]);
      return {
        ...point,
        lowerBound: forecastValue - marginOfError,
        upperBound: forecastValue + marginOfError,
        confidenceLevel
      };
    });
    
    return {
      success: true,
      forecast,
      confidenceIntervals,
      method,
      confidenceLevel,
      marginOfError
    };
  } catch (error) {
    logError('Error generating forecast with confidence intervals:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export optimized forecasting functions
export {
  optimizedEnsembleForecast,
  optimizedForecastWithConfidenceIntervals
};

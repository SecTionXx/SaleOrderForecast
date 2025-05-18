/**
 * forecastingAdapter.js - Forecasting Adapter
 * Provides a unified interface to forecasting algorithms, automatically selecting
 * between standard and optimized implementations based on dataset size
 */

import { logDebug, logError } from '../utils/logger.js';

// Import standard forecasting methods
import {
  movingAverageForecast,
  exponentialSmoothingForecast,
  linearRegressionForecast,
  seasonalForecast,
  weightedAverageForecast,
  ensembleForecast,
  forecastWithConfidenceIntervals,
  scenarioForecasting
} from './predictiveForecasting.js';

// Import optimized forecasting methods
import {
  optimizedEnsembleForecast,
  optimizedForecastWithConfidenceIntervals
} from './optimized/optimizedForecasting.js';
import {
  optimizedMovingAverageForecast,
  optimizedExponentialSmoothingForecast,
  optimizedWeightedAverageForecast
} from './optimized/basicForecasts.js';
import {
  optimizedLinearRegressionForecast,
  optimizedSeasonalForecast,
  optimizedArimaForecast
} from './optimized/advancedForecasts.js';

// Dataset size thresholds for using optimized implementations
const LARGE_DATASET_THRESHOLD = 5000;
const VERY_LARGE_DATASET_THRESHOLD = 20000;

/**
 * Adaptive moving average forecast
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} windowSize - Size of the moving average window
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function adaptiveMovingAverageForecast(historicalData, periods = 3, windowSize = 3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return [];
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized moving average forecast for large dataset (${historicalData.length} data points)`);
    return optimizedMovingAverageForecast(historicalData, periods, windowSize, valueKey, dateKey);
  } else {
    return movingAverageForecast(historicalData, periods, windowSize, valueKey, dateKey);
  }
}

/**
 * Adaptive exponential smoothing forecast
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} alpha - Smoothing factor (0 < alpha < 1)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function adaptiveExponentialSmoothingForecast(historicalData, periods = 3, alpha = 0.3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return [];
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized exponential smoothing forecast for large dataset (${historicalData.length} data points)`);
    return optimizedExponentialSmoothingForecast(historicalData, periods, alpha, valueKey, dateKey);
  } else {
    return exponentialSmoothingForecast(historicalData, periods, alpha, valueKey, dateKey);
  }
}

/**
 * Adaptive linear regression forecast
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function adaptiveLinearRegressionForecast(historicalData, periods = 3, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return [];
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized linear regression forecast for large dataset (${historicalData.length} data points)`);
    return optimizedLinearRegressionForecast(historicalData, periods, valueKey, dateKey);
  } else {
    return linearRegressionForecast(historicalData, periods, valueKey, dateKey);
  }
}

/**
 * Adaptive seasonal forecast
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {number} seasonality - Number of periods in a season
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function adaptiveSeasonalForecast(historicalData, periods = 3, seasonality = 12, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return [];
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized seasonal forecast for large dataset (${historicalData.length} data points)`);
    return optimizedSeasonalForecast(historicalData, periods, seasonality, valueKey, dateKey);
  } else {
    return seasonalForecast(historicalData, periods, seasonality, valueKey, dateKey);
  }
}

/**
 * Adaptive weighted average forecast
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Array} weights - Weights for each historical data point (most recent first)
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Array} - Forecasted data points
 */
function adaptiveWeightedAverageForecast(historicalData, periods = 3, weights = [0.5, 0.3, 0.2], valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return [];
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized weighted average forecast for large dataset (${historicalData.length} data points)`);
    return optimizedWeightedAverageForecast(historicalData, periods, weights, valueKey, dateKey);
  } else {
    return weightedAverageForecast(historicalData, periods, weights, valueKey, dateKey);
  }
}

/**
 * Adaptive ensemble forecast
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Promise<Array>} - Forecasted data points
 */
async function adaptiveEnsembleForecast(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return [];
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized ensemble forecast for large dataset (${historicalData.length} data points)`);
    return optimizedEnsembleForecast(historicalData, periods, options, valueKey, dateKey);
  } else {
    try {
      return await ensembleForecast(historicalData, periods, options, valueKey, dateKey);
    } catch (error) {
      logError('Error in standard ensemble forecast, falling back to optimized implementation:', error);
      return optimizedEnsembleForecast(historicalData, periods, options, valueKey, dateKey);
    }
  }
}

/**
 * Adaptive forecast with confidence intervals
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Forecasting options
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Promise<Object>} - Forecast with confidence intervals
 */
async function adaptiveForecastWithConfidenceIntervals(historicalData, periods = 3, options = {}, valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return {
      success: false,
      error: 'Invalid dataset'
    };
  }
  
  if (historicalData.length >= LARGE_DATASET_THRESHOLD) {
    logDebug(`Using optimized forecast with confidence intervals for large dataset (${historicalData.length} data points)`);
    return optimizedForecastWithConfidenceIntervals(historicalData, periods, options, valueKey, dateKey);
  } else {
    try {
      return await forecastWithConfidenceIntervals(historicalData, periods, options, valueKey, dateKey);
    } catch (error) {
      logError('Error in standard forecast with confidence intervals, falling back to optimized implementation:', error);
      return optimizedForecastWithConfidenceIntervals(historicalData, periods, options, valueKey, dateKey);
    }
  }
}

/**
 * Adaptive scenario forecasting
 * Automatically selects between standard and optimized implementations based on dataset size
 * @param {Array} historicalData - Historical data points
 * @param {number} periods - Number of periods to forecast
 * @param {Array} scenarios - Scenario configurations
 * @param {string} valueKey - Key to access the value in data objects
 * @param {string} dateKey - Key to access the date in data objects
 * @returns {Promise<Object>} - Forecasts for different scenarios
 */
async function adaptiveScenarioForecasting(historicalData, periods = 3, scenarios = [], valueKey = 'amount', dateKey = 'date') {
  if (!Array.isArray(historicalData)) {
    return {
      success: false,
      error: 'Invalid dataset'
    };
  }
  
  try {
    if (historicalData.length >= VERY_LARGE_DATASET_THRESHOLD) {
      logDebug(`Using optimized scenario forecasting for very large dataset (${historicalData.length} data points)`);
      
      // For very large datasets, process each scenario with optimized methods
      const results = {
        success: true,
        scenarios: []
      };
      
      for (const scenario of scenarios) {
        // Apply scenario modifications to data
        const scenarioData = applyScenarioModifications(historicalData, scenario);
        
        // Generate forecast for this scenario using optimized methods
        let forecast;
        if (scenario.method === 'ensemble') {
          forecast = await optimizedEnsembleForecast(
            scenarioData, 
            periods, 
            scenario.options || {}, 
            valueKey, 
            dateKey
          );
        } else if (scenario.method === 'linear_regression') {
          forecast = optimizedLinearRegressionForecast(
            scenarioData, 
            periods, 
            valueKey, 
            dateKey
          );
        } else if (scenario.method === 'seasonal') {
          forecast = optimizedSeasonalForecast(
            scenarioData, 
            periods, 
            scenario.options?.seasonality || 12, 
            valueKey, 
            dateKey
          );
        } else {
          // Default to optimized moving average
          forecast = optimizedMovingAverageForecast(
            scenarioData, 
            periods, 
            scenario.options?.windowSize || 3, 
            valueKey, 
            dateKey
          );
        }
        
        results.scenarios.push({
          name: scenario.name || `Scenario ${results.scenarios.length + 1}`,
          description: scenario.description || '',
          forecast
        });
      }
      
      return results;
    } else {
      // For smaller datasets, use standard scenario forecasting
      return await scenarioForecasting(historicalData, periods, scenarios, valueKey, dateKey);
    }
  } catch (error) {
    logError('Error in scenario forecasting:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Apply scenario modifications to historical data
 * @private
 * @param {Array} historicalData - Original historical data
 * @param {Object} scenario - Scenario configuration
 * @returns {Array} - Modified data for scenario
 */
function applyScenarioModifications(historicalData, scenario) {
  if (!scenario.modifications) {
    return [...historicalData];
  }
  
  const modifiedData = [...historicalData];
  
  // Apply growth rate modification
  if (scenario.modifications.growthRate !== undefined) {
    const growthFactor = 1 + scenario.modifications.growthRate;
    
    // Apply growth factor to most recent data points
    const modificationPeriod = scenario.modifications.period || 6; // Default to last 6 periods
    const startIndex = Math.max(0, modifiedData.length - modificationPeriod);
    
    for (let i = startIndex; i < modifiedData.length; i++) {
      if (typeof modifiedData[i] === 'object') {
        // Apply to all numeric properties or specific value key
        for (const key in modifiedData[i]) {
          if (!isNaN(modifiedData[i][key])) {
            modifiedData[i][key] *= growthFactor;
          }
        }
      } else if (!isNaN(modifiedData[i])) {
        modifiedData[i] *= growthFactor;
      }
    }
  }
  
  // Apply specific value modifications
  if (scenario.modifications.values && Array.isArray(scenario.modifications.values)) {
    for (const mod of scenario.modifications.values) {
      if (mod.index !== undefined && mod.value !== undefined) {
        const index = mod.index < 0 ? modifiedData.length + mod.index : mod.index;
        
        if (index >= 0 && index < modifiedData.length) {
          if (typeof modifiedData[index] === 'object' && mod.key) {
            modifiedData[index][mod.key] = mod.value;
          } else if (!isNaN(modifiedData[index])) {
            modifiedData[index] = mod.value;
          }
        }
      }
    }
  }
  
  return modifiedData;
}

// Export adaptive forecasting functions
export {
  adaptiveMovingAverageForecast,
  adaptiveExponentialSmoothingForecast,
  adaptiveLinearRegressionForecast,
  adaptiveSeasonalForecast,
  adaptiveWeightedAverageForecast,
  adaptiveEnsembleForecast,
  adaptiveForecastWithConfidenceIntervals,
  adaptiveScenarioForecasting,
  // Also export the optimized ARIMA forecast which doesn't have a standard counterpart
  optimizedArimaForecast
};

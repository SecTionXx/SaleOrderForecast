/**
 * forecastingService.js - Forecasting API Service
 * Handles all API operations related to advanced forecasting
 */

import apiService from '../utils/apiService.js';
import {
  getForecastingPredictEndpoint,
  getForecastingScenariosEndpoint,
  getForecastingTrendsEndpoint
} from '../utils/apiEndpoints.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Get sales forecast prediction
 * @param {Object} options - Prediction options
 * @param {Array} historicalData - Optional historical data to use for prediction
 * @returns {Promise<Object>} - Forecast prediction
 */
async function getPrediction(options = {}, historicalData = null) {
  try {
    const endpoint = getForecastingPredictEndpoint();
    
    const requestData = {
      options
    };
    
    if (historicalData) {
      requestData.historicalData = historicalData;
    }
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error getting forecast prediction:', error);
    throw error;
  }
}

/**
 * Generate what-if scenarios
 * @param {Array} scenarios - Array of scenario configurations
 * @param {Object} baselineOptions - Baseline options for comparison
 * @returns {Promise<Object>} - Generated scenarios
 */
async function generateScenarios(scenarios, baselineOptions = {}) {
  try {
    const endpoint = getForecastingScenariosEndpoint();
    
    const requestData = {
      scenarios,
      baselineOptions
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error generating forecast scenarios:', error);
    throw error;
  }
}

/**
 * Get trend analysis
 * @param {Object} options - Analysis options
 * @param {Array} historicalData - Optional historical data to analyze
 * @returns {Promise<Object>} - Trend analysis
 */
async function getTrendAnalysis(options = {}, historicalData = null) {
  try {
    const endpoint = getForecastingTrendsEndpoint();
    
    const requestData = {
      options
    };
    
    if (historicalData) {
      requestData.historicalData = historicalData;
    }
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error getting trend analysis:', error);
    throw error;
  }
}

/**
 * Get sales velocity metrics
 * @param {Object} options - Options for velocity calculation
 * @returns {Promise<Object>} - Sales velocity metrics
 */
async function getSalesVelocity(options = {}) {
  try {
    const endpoint = `${getForecastingTrendsEndpoint()}/velocity`;
    return await apiService.post(endpoint, options);
  } catch (error) {
    logError('Error getting sales velocity metrics:', error);
    throw error;
  }
}

/**
 * Get win rate analysis
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} - Win rate analysis
 */
async function getWinRateAnalysis(options = {}) {
  try {
    const endpoint = `${getForecastingTrendsEndpoint()}/win-rate`;
    return await apiService.post(endpoint, options);
  } catch (error) {
    logError('Error getting win rate analysis:', error);
    throw error;
  }
}

/**
 * Get deal stage conversion analysis
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} - Stage conversion analysis
 */
async function getStageConversionAnalysis(options = {}) {
  try {
    const endpoint = `${getForecastingTrendsEndpoint()}/stage-conversion`;
    return await apiService.post(endpoint, options);
  } catch (error) {
    logError('Error getting stage conversion analysis:', error);
    throw error;
  }
}

/**
 * Save a forecast model
 * @param {string} name - Model name
 * @param {Object} model - Model configuration
 * @returns {Promise<Object>} - Saved model
 */
async function saveModel(name, model) {
  try {
    const endpoint = `${getForecastingPredictEndpoint()}/models`;
    
    const requestData = {
      name,
      model
    };
    
    return await apiService.post(endpoint, requestData);
  } catch (error) {
    logError('Error saving forecast model:', error);
    throw error;
  }
}

/**
 * Get saved forecast models
 * @returns {Promise<Array>} - List of saved models
 */
async function getSavedModels() {
  try {
    const endpoint = `${getForecastingPredictEndpoint()}/models`;
    return await apiService.get(endpoint);
  } catch (error) {
    logError('Error fetching saved forecast models:', error);
    throw error;
  }
}

/**
 * Apply a saved model to generate a forecast
 * @param {string} modelId - ID of the saved model
 * @param {Object} options - Forecast options
 * @returns {Promise<Object>} - Forecast prediction
 */
async function applyModel(modelId, options = {}) {
  try {
    const endpoint = `${getForecastingPredictEndpoint()}/models/${modelId}/apply`;
    return await apiService.post(endpoint, options);
  } catch (error) {
    logError(`Error applying forecast model ${modelId}:`, error);
    throw error;
  }
}

// Export all forecasting service functions
export {
  getPrediction,
  generateScenarios,
  getTrendAnalysis,
  getSalesVelocity,
  getWinRateAnalysis,
  getStageConversionAnalysis,
  saveModel,
  getSavedModels,
  applyModel
};

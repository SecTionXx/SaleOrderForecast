/**
 * trendAnalysis.js - Trend Analysis Algorithms
 * Provides algorithms for analyzing sales trends and patterns
 */

import { logDebug, logError } from '../utils/logger.js';

/**
 * Calculate moving average for a dataset
 * @param {Array} data - Array of data points
 * @param {number} period - Period for moving average calculation
 * @param {string} valueKey - Key to access the value in data objects
 * @returns {Array} - Moving averages
 */
function calculateMovingAverage(data, period = 3, valueKey = 'amount') {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const result = [];
  
  // Need at least 'period' data points to calculate moving average
  if (data.length < period) {
    return result;
  }
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      const value = typeof data[i - j] === 'object' ? data[i - j][valueKey] : data[i - j];
      sum += Number(value) || 0;
    }
    
    const average = sum / period;
    const dataPoint = typeof data[i] === 'object' ? { ...data[i] } : { value: data[i] };
    
    result.push({
      ...dataPoint,
      movingAverage: average
    });
  }
  
  return result;
}

/**
 * Calculate exponential moving average for a dataset
 * @param {Array} data - Array of data points
 * @param {number} alpha - Smoothing factor (0 < alpha < 1)
 * @param {string} valueKey - Key to access the value in data objects
 * @returns {Array} - Exponential moving averages
 */
function calculateExponentialMovingAverage(data, alpha = 0.3, valueKey = 'amount') {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const result = [];
  let ema = typeof data[0] === 'object' ? Number(data[0][valueKey]) || 0 : Number(data[0]) || 0;
  
  for (let i = 0; i < data.length; i++) {
    const value = typeof data[i] === 'object' ? Number(data[i][valueKey]) || 0 : Number(data[i]) || 0;
    
    // EMA = alpha * current value + (1 - alpha) * previous EMA
    ema = alpha * value + (1 - alpha) * ema;
    
    const dataPoint = typeof data[i] === 'object' ? { ...data[i] } : { value: data[i] };
    
    result.push({
      ...dataPoint,
      ema: ema
    });
  }
  
  return result;
}

/**
 * Calculate linear regression for a dataset
 * @param {Array} data - Array of data points
 * @param {string} xKey - Key to access the x value in data objects (or index if not provided)
 * @param {string} yKey - Key to access the y value in data objects
 * @returns {Object} - Linear regression parameters (slope, intercept, r2)
 */
function calculateLinearRegression(data, xKey = null, yKey = 'amount') {
  if (!Array.isArray(data) || data.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }
  
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;
  
  for (let i = 0; i < n; i++) {
    const x = xKey ? Number(data[i][xKey]) || 0 : i;
    const y = typeof data[i] === 'object' ? Number(data[i][yKey]) || 0 : Number(data[i]) || 0;
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared (coefficient of determination)
  const meanY = sumY / n;
  let totalVariation = 0;
  let residualVariation = 0;
  
  for (let i = 0; i < n; i++) {
    const x = xKey ? Number(data[i][xKey]) || 0 : i;
    const y = typeof data[i] === 'object' ? Number(data[i][yKey]) || 0 : Number(data[i]) || 0;
    const predicted = slope * x + intercept;
    
    totalVariation += Math.pow(y - meanY, 2);
    residualVariation += Math.pow(y - predicted, 2);
  }
  
  const r2 = 1 - (residualVariation / totalVariation);
  
  return { slope, intercept, r2 };
}

/**
 * Calculate seasonal indices for a dataset
 * @param {Array} data - Array of data points
 * @param {number} seasonality - Number of periods in a season (e.g., 12 for monthly data with yearly seasonality)
 * @param {string} valueKey - Key to access the value in data objects
 * @returns {Array} - Seasonal indices
 */
function calculateSeasonalIndices(data, seasonality = 12, valueKey = 'amount') {
  if (!Array.isArray(data) || data.length < seasonality) {
    return [];
  }
  
  const n = data.length;
  const numSeasons = Math.floor(n / seasonality);
  
  if (numSeasons === 0) {
    return [];
  }
  
  // Calculate average for each season
  const seasonalSums = Array(seasonality).fill(0);
  const seasonalCounts = Array(seasonality).fill(0);
  
  for (let i = 0; i < n; i++) {
    const seasonIndex = i % seasonality;
    const value = typeof data[i] === 'object' ? Number(data[i][valueKey]) || 0 : Number(data[i]) || 0;
    
    seasonalSums[seasonIndex] += value;
    seasonalCounts[seasonIndex]++;
  }
  
  const seasonalAverages = seasonalSums.map((sum, index) => sum / seasonalCounts[index]);
  
  // Calculate overall average
  const overallAverage = seasonalSums.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate seasonal indices
  const seasonalIndices = seasonalAverages.map(avg => avg / overallAverage);
  
  return seasonalIndices;
}

/**
 * Detect outliers in a dataset using the Z-score method
 * @param {Array} data - Array of data points
 * @param {number} threshold - Z-score threshold for outlier detection
 * @param {string} valueKey - Key to access the value in data objects
 * @returns {Array} - Indices of outliers
 */
function detectOutliers(data, threshold = 3, valueKey = 'amount') {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // Extract values
  const values = data.map(item => 
    typeof item === 'object' ? Number(item[valueKey]) || 0 : Number(item) || 0
  );
  
  // Calculate mean
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate standard deviation
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Find outliers
  const outliers = [];
  for (let i = 0; i < values.length; i++) {
    const zScore = Math.abs((values[i] - mean) / stdDev);
    if (zScore > threshold) {
      outliers.push(i);
    }
  }
  
  return outliers;
}

/**
 * Calculate growth rates between consecutive periods
 * @param {Array} data - Array of data points
 * @param {string} valueKey - Key to access the value in data objects
 * @returns {Array} - Growth rates
 */
function calculateGrowthRates(data, valueKey = 'amount') {
  if (!Array.isArray(data) || data.length < 2) {
    return [];
  }
  
  const growthRates = [];
  
  for (let i = 1; i < data.length; i++) {
    const currentValue = typeof data[i] === 'object' ? Number(data[i][valueKey]) || 0 : Number(data[i]) || 0;
    const previousValue = typeof data[i - 1] === 'object' ? Number(data[i - 1][valueKey]) || 0 : Number(data[i - 1]) || 0;
    
    let growthRate = 0;
    if (previousValue !== 0) {
      growthRate = (currentValue - previousValue) / previousValue;
    }
    
    const dataPoint = typeof data[i] === 'object' ? { ...data[i] } : { value: data[i] };
    
    growthRates.push({
      ...dataPoint,
      growthRate: growthRate
    });
  }
  
  return growthRates;
}

/**
 * Calculate cumulative sum for a dataset
 * @param {Array} data - Array of data points
 * @param {string} valueKey - Key to access the value in data objects
 * @returns {Array} - Cumulative sums
 */
function calculateCumulativeSum(data, valueKey = 'amount') {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const result = [];
  let cumulativeSum = 0;
  
  for (let i = 0; i < data.length; i++) {
    const value = typeof data[i] === 'object' ? Number(data[i][valueKey]) || 0 : Number(data[i]) || 0;
    cumulativeSum += value;
    
    const dataPoint = typeof data[i] === 'object' ? { ...data[i] } : { value: data[i] };
    
    result.push({
      ...dataPoint,
      cumulativeSum: cumulativeSum
    });
  }
  
  return result;
}

/**
 * Analyze trends in a dataset
 * @param {Array} data - Array of data points
 * @param {Object} options - Analysis options
 * @returns {Object} - Trend analysis results
 */
function analyzeTrends(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: 'Invalid or empty dataset'
    };
  }
  
  try {
    const {
      valueKey = 'amount',
      dateKey = 'date',
      movingAveragePeriod = 3,
      emaAlpha = 0.3,
      outlierThreshold = 3,
      seasonality = 12
    } = options;
    
    // Sort data by date if dateKey is provided
    let sortedData = [...data];
    if (dateKey && data[0] && data[0][dateKey]) {
      sortedData.sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
    }
    
    // Calculate various trend metrics
    const movingAverages = calculateMovingAverage(sortedData, movingAveragePeriod, valueKey);
    const ema = calculateExponentialMovingAverage(sortedData, emaAlpha, valueKey);
    const regression = calculateLinearRegression(sortedData, dateKey, valueKey);
    const growthRates = calculateGrowthRates(sortedData, valueKey);
    const outliers = detectOutliers(sortedData, outlierThreshold, valueKey);
    const cumulativeSum = calculateCumulativeSum(sortedData, valueKey);
    
    // Calculate seasonal indices if enough data
    let seasonalIndices = [];
    if (sortedData.length >= seasonality) {
      seasonalIndices = calculateSeasonalIndices(sortedData, seasonality, valueKey);
    }
    
    // Calculate overall growth rate
    let overallGrowthRate = 0;
    if (sortedData.length >= 2) {
      const firstValue = typeof sortedData[0] === 'object' ? Number(sortedData[0][valueKey]) || 0 : Number(sortedData[0]) || 0;
      const lastValue = typeof sortedData[sortedData.length - 1] === 'object' ? 
        Number(sortedData[sortedData.length - 1][valueKey]) || 0 : 
        Number(sortedData[sortedData.length - 1]) || 0;
      
      if (firstValue !== 0) {
        overallGrowthRate = (lastValue - firstValue) / firstValue;
      }
    }
    
    // Calculate average growth rate
    const avgGrowthRate = growthRates.length > 0 ?
      growthRates.reduce((sum, item) => sum + item.growthRate, 0) / growthRates.length :
      0;
    
    // Determine trend direction
    let trendDirection = 'stable';
    if (regression.slope > 0.05) {
      trendDirection = 'increasing';
    } else if (regression.slope < -0.05) {
      trendDirection = 'decreasing';
    }
    
    // Calculate volatility (standard deviation of growth rates)
    const growthRateValues = growthRates.map(item => item.growthRate);
    const growthRateMean = growthRateValues.reduce((sum, val) => sum + val, 0) / growthRateValues.length;
    const growthRateVariance = growthRateValues.reduce((sum, val) => sum + Math.pow(val - growthRateMean, 2), 0) / growthRateValues.length;
    const volatility = Math.sqrt(growthRateVariance);
    
    return {
      success: true,
      data: sortedData,
      metrics: {
        movingAverages,
        ema,
        regression,
        growthRates,
        outliers,
        cumulativeSum,
        seasonalIndices,
        overallGrowthRate,
        avgGrowthRate,
        trendDirection,
        volatility
      },
      summary: {
        trendDirection,
        overallGrowthRate,
        avgGrowthRate,
        volatility,
        outlierCount: outliers.length,
        r2: regression.slope,
        seasonality: seasonalIndices.length > 0
      }
    };
  } catch (error) {
    logError('Error analyzing trends:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export trend analysis functions
export {
  calculateMovingAverage,
  calculateExponentialMovingAverage,
  calculateLinearRegression,
  calculateSeasonalIndices,
  detectOutliers,
  calculateGrowthRates,
  calculateCumulativeSum,
  analyzeTrends
};

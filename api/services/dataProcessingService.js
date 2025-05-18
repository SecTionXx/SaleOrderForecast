/**
 * dataProcessingService.js - Server-side Data Processing Service
 * Handles critical business logic and data processing on the server side
 * for improved security and performance
 */

const config = require('../../js/config');

/**
 * Process raw sheet data into a structured format
 * @param {Array} rawData - Raw data from Google Sheets
 * @returns {Object} - Processed data object
 */
function processSheetData(rawData) {
  if (!rawData || !Array.isArray(rawData)) {
    throw new Error('Invalid data format');
  }

  try {
    // Extract headers from first row (assuming first row contains headers)
    const headers = rawData[0] || [];
    const dataRows = rawData.slice(1);
    
    // Convert rows to objects with column headers as keys
    const structuredData = dataRows.map(row => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });

    return {
      headers,
      rows: structuredData,
      totalRows: structuredData.length
    };
  } catch (error) {
    console.error('Error processing sheet data:', error);
    throw new Error(`Data processing failed: ${error.message}`);
  }
}

/**
 * Calculate sales forecasts based on historical data
 * @param {Array} salesData - Historical sales data
 * @param {Object} options - Forecast options
 * @returns {Object} - Forecast results
 */
function calculateSalesForecast(salesData, options = {}) {
  if (!salesData || !Array.isArray(salesData)) {
    throw new Error('Invalid sales data');
  }

  const {
    forecastPeriods = 3,
    confidenceLevel = 0.95,
    seasonalityPattern = 'auto',
    includeOutliers = false
  } = options;

  try {
    // Extract time series data
    const timeSeriesData = salesData.map(item => ({
      date: new Date(item.date),
      value: parseFloat(item.value) || 0
    })).filter(item => !isNaN(item.value));

    if (timeSeriesData.length < 3) {
      throw new Error('Insufficient data for forecasting');
    }

    // Sort by date
    timeSeriesData.sort((a, b) => a.date - b.date);

    // Remove outliers if needed
    const cleanedData = includeOutliers ? timeSeriesData : removeOutliers(timeSeriesData);

    // Detect seasonality if set to auto
    const seasonality = seasonalityPattern === 'auto' 
      ? detectSeasonality(cleanedData) 
      : seasonalityPattern;

    // Calculate trend using simple linear regression
    const trend = calculateTrend(cleanedData);

    // Generate forecast
    const forecast = generateForecast(cleanedData, trend, seasonality, forecastPeriods);

    // Calculate confidence intervals
    const forecastWithConfidence = addConfidenceIntervals(forecast, confidenceLevel);

    return {
      forecast: forecastWithConfidence,
      trend,
      seasonality,
      dataPoints: cleanedData.length,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating sales forecast:', error);
    throw new Error(`Forecast calculation failed: ${error.message}`);
  }
}

/**
 * Remove outliers from time series data
 * @param {Array} data - Time series data
 * @returns {Array} - Data with outliers removed
 */
function removeOutliers(data) {
  // Calculate quartiles and IQR
  const values = data.map(item => item.value).sort((a, b) => a - b);
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  
  // Define bounds
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  // Filter outliers
  return data.filter(item => item.value >= lowerBound && item.value <= upperBound);
}

/**
 * Detect seasonality in time series data
 * @param {Array} data - Time series data
 * @returns {Object} - Detected seasonality pattern
 */
function detectSeasonality(data) {
  // Simple seasonality detection
  // In a real implementation, this would use autocorrelation or spectral analysis
  
  // For demo purposes, check if there are enough data points for quarterly patterns
  if (data.length >= 12) {
    return {
      pattern: 'quarterly',
      period: 3
    };
  } else if (data.length >= 6) {
    return {
      pattern: 'monthly',
      period: 1
    };
  } else {
    return {
      pattern: 'none',
      period: 0
    };
  }
}

/**
 * Calculate trend using linear regression
 * @param {Array} data - Time series data
 * @returns {Object} - Trend parameters
 */
function calculateTrend(data) {
  // Convert dates to numeric values (days since first date)
  const firstDate = data[0].date;
  const xValues = data.map(item => (item.date - firstDate) / (1000 * 60 * 60 * 24));
  const yValues = data.map(item => item.value);
  
  // Calculate linear regression
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
  
  return {
    slope,
    intercept,
    firstDate
  };
}

/**
 * Generate forecast based on trend and seasonality
 * @param {Array} data - Historical data
 * @param {Object} trend - Trend parameters
 * @param {Object} seasonality - Seasonality parameters
 * @param {number} periods - Number of periods to forecast
 * @returns {Array} - Forecast data
 */
function generateForecast(data, trend, seasonality, periods) {
  const forecast = [];
  const lastDate = data[data.length - 1].date;
  
  // Calculate seasonal factors if applicable
  let seasonalFactors = [];
  if (seasonality.pattern !== 'none') {
    // In a real implementation, this would calculate actual seasonal factors
    // For demo purposes, use simple factors
    if (seasonality.pattern === 'quarterly') {
      seasonalFactors = [1.1, 0.9, 1.0, 1.2];
    } else if (seasonality.pattern === 'monthly') {
      seasonalFactors = [1.05, 0.95];
    }
  }
  
  // Generate forecast for each period
  for (let i = 1; i <= periods; i++) {
    // Calculate date for this forecast period
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(lastDate.getMonth() + i);
    
    // Calculate days since first date
    const daysSinceFirst = (forecastDate - trend.firstDate) / (1000 * 60 * 60 * 24);
    
    // Calculate trend component
    const trendValue = trend.intercept + trend.slope * daysSinceFirst;
    
    // Apply seasonal factor if applicable
    let forecastValue = trendValue;
    if (seasonality.pattern !== 'none') {
      const seasonalIndex = (data.length + i - 1) % seasonalFactors.length;
      forecastValue *= seasonalFactors[seasonalIndex];
    }
    
    forecast.push({
      date: forecastDate,
      value: forecastValue
    });
  }
  
  return forecast;
}

/**
 * Add confidence intervals to forecast
 * @param {Array} forecast - Forecast data
 * @param {number} confidenceLevel - Confidence level (0-1)
 * @returns {Array} - Forecast with confidence intervals
 */
function addConfidenceIntervals(forecast, confidenceLevel) {
  // Calculate z-score based on confidence level
  // For 95% confidence, z ≈ 1.96
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645; // Default to 90% if not 95%
  
  // Add confidence intervals to each forecast point
  // In a real implementation, this would calculate proper prediction intervals
  return forecast.map((point, index) => {
    // Increase uncertainty for further predictions
    const uncertainty = 0.05 * point.value * (1 + index * 0.5);
    
    return {
      ...point,
      lower: point.value - zScore * uncertainty,
      upper: point.value + zScore * uncertainty
    };
  });
}

/**
 * Analyze sales performance by category
 * @param {Array} salesData - Sales data
 * @returns {Object} - Analysis results
 */
function analyzeSalesByCategory(salesData) {
  if (!salesData || !Array.isArray(salesData)) {
    throw new Error('Invalid sales data');
  }

  try {
    // Group sales by category
    const categories = {};
    
    salesData.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = {
          totalSales: 0,
          count: 0,
          items: []
        };
      }
      
      const saleValue = parseFloat(item.value) || 0;
      categories[category].totalSales += saleValue;
      categories[category].count++;
      categories[category].items.push(item);
    });
    
    // Calculate statistics for each category
    const results = Object.keys(categories).map(category => {
      const categoryData = categories[category];
      const values = categoryData.items.map(item => parseFloat(item.value) || 0);
      
      // Calculate average
      const average = categoryData.totalSales / categoryData.count;
      
      // Calculate median
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues.length % 2 === 0
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
      
      // Calculate growth rate if dates are available
      let growthRate = null;
      if (categoryData.items[0].date) {
        const sortedByDate = [...categoryData.items].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstValue = parseFloat(sortedByDate[0].value) || 0;
        const lastValue = parseFloat(sortedByDate[sortedByDate.length - 1].value) || 0;
        
        if (firstValue > 0) {
          growthRate = (lastValue - firstValue) / firstValue * 100;
        }
      }
      
      return {
        category,
        totalSales: categoryData.totalSales,
        count: categoryData.count,
        average,
        median,
        growthRate,
        percentageOfTotal: 0 // Will calculate after all categories are processed
      };
    });
    
    // Calculate percentage of total
    const grandTotal = results.reduce((sum, item) => sum + item.totalSales, 0);
    results.forEach(item => {
      item.percentageOfTotal = (item.totalSales / grandTotal * 100).toFixed(2);
    });
    
    // Sort by total sales descending
    results.sort((a, b) => b.totalSales - a.totalSales);
    
    return {
      categories: results,
      totalSales: grandTotal,
      topCategory: results.length > 0 ? results[0].category : null,
      categoryCount: results.length,
      analysisDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing sales by category:', error);
    throw new Error(`Category analysis failed: ${error.message}`);
  }
}

module.exports = {
  processSheetData,
  calculateSalesForecast,
  analyzeSalesByCategory
};

/**
 * analyticsService.js - Analytics Service
 * Provides analytics and forecasting functionality for the application
 */

import { logDebug, logError } from '../utils/logger.js';
import { apiService } from '../utils/apiService.js';
import { 
  calculateMovingAverage,
  calculateExponentialMovingAverage,
  calculateLinearRegression,
  calculateSeasonalIndices,
  detectOutliers,
  calculateGrowthRates,
  calculateCumulativeSum,
  analyzeTrends
} from '../analytics/trendAnalysis.js';

import {
  movingAverageForecast,
  exponentialSmoothingForecast,
  linearRegressionForecast,
  seasonalForecast,
  weightedAverageForecast,
  ensembleForecast,
  forecastWithConfidenceIntervals,
  scenarioForecasting
} from '../analytics/predictiveForecasting.js';

/**
 * Analytics Service
 * Provides methods for data analysis and forecasting
 */
class AnalyticsService {
  constructor() {
    this.cachedData = null;
    this.lastFetchTime = null;
    this.cacheDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  /**
   * Fetch sales data for analysis
   * @param {Object} options - Fetch options
   * @param {boolean} options.forceFresh - Force fresh data fetch
   * @param {string} options.startDate - Start date for data range
   * @param {string} options.endDate - End date for data range
   * @param {string} options.groupBy - Grouping option (day, week, month, quarter, year)
   * @returns {Promise<Array>} - Sales data
   */
  async fetchSalesData(options = {}) {
    try {
      const { 
        forceFresh = false, 
        startDate = null, 
        endDate = null, 
        groupBy = 'month' 
      } = options;
      
      // Check if cached data is valid
      const now = new Date().getTime();
      if (
        !forceFresh && 
        this.cachedData && 
        this.lastFetchTime && 
        (now - this.lastFetchTime < this.cacheDuration)
      ) {
        logDebug('Using cached sales data');
        return this.cachedData;
      }
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      queryParams.append('groupBy', groupBy);
      
      // Fetch data from API
      const endpoint = `/api/sales/data?${queryParams.toString()}`;
      const response = await apiService.get(endpoint);
      
      if (response.success) {
        this.cachedData = response.data;
        this.lastFetchTime = now;
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch sales data');
      }
    } catch (error) {
      logError('Error fetching sales data:', error);
      throw error;
    }
  }

  /**
   * Analyze sales trends
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeSalesTrends(options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        groupBy = 'month',
        valueKey = 'amount',
        dateKey = 'date',
        movingAveragePeriod = 3,
        emaAlpha = 0.3,
        outlierThreshold = 3,
        seasonality = 12,
        forceFresh = false
      } = options;
      
      // Fetch sales data
      const salesData = await this.fetchSalesData({
        forceFresh,
        startDate,
        endDate,
        groupBy
      });
      
      if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
        return {
          success: false,
          error: 'No sales data available for analysis'
        };
      }
      
      // Analyze trends
      const analysisOptions = {
        valueKey,
        dateKey,
        movingAveragePeriod,
        emaAlpha,
        outlierThreshold,
        seasonality
      };
      
      const analysisResults = analyzeTrends(salesData, analysisOptions);
      
      return {
        success: true,
        data: salesData,
        analysis: analysisResults,
        options: {
          startDate,
          endDate,
          groupBy,
          ...analysisOptions
        }
      };
    } catch (error) {
      logError('Error analyzing sales trends:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate sales forecast
   * @param {Object} options - Forecast options
   * @returns {Promise<Object>} - Forecast results
   */
  async generateSalesForecast(options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        groupBy = 'month',
        valueKey = 'amount',
        dateKey = 'date',
        periods = 6,
        method = 'ensemble',
        confidenceLevel = 0.95,
        includeScenarios = true,
        forceFresh = false,
        ...methodOptions
      } = options;
      
      // Fetch sales data
      const salesData = await this.fetchSalesData({
        forceFresh,
        startDate,
        endDate,
        groupBy
      });
      
      if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
        return {
          success: false,
          error: 'No sales data available for forecasting'
        };
      }
      
      // Generate forecast with confidence intervals
      const forecastOptions = {
        method,
        confidenceLevel,
        ...methodOptions
      };
      
      const forecast = forecastWithConfidenceIntervals(
        salesData, 
        periods, 
        forecastOptions, 
        valueKey, 
        dateKey
      );
      
      // Generate scenario forecasts if requested
      let scenarios = null;
      if (includeScenarios) {
        const scenarioOptions = [
          { name: 'optimistic', growthFactor: 1.2 },
          { name: 'realistic', growthFactor: 1.0 },
          { name: 'pessimistic', growthFactor: 0.8 }
        ];
        
        scenarios = scenarioForecasting(
          salesData, 
          periods, 
          scenarioOptions, 
          valueKey, 
          dateKey
        );
      }
      
      return {
        success: true,
        data: salesData,
        forecast: forecast.forecast,
        scenarios: scenarios ? scenarios.scenarios : null,
        options: {
          startDate,
          endDate,
          groupBy,
          periods,
          method,
          confidenceLevel,
          ...methodOptions
        }
      };
    } catch (error) {
      logError('Error generating sales forecast:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Identify sales anomalies
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Anomaly detection results
   */
  async identifySalesAnomalies(options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        groupBy = 'month',
        valueKey = 'amount',
        dateKey = 'date',
        threshold = 2.5,
        forceFresh = false
      } = options;
      
      // Fetch sales data
      const salesData = await this.fetchSalesData({
        forceFresh,
        startDate,
        endDate,
        groupBy
      });
      
      if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
        return {
          success: false,
          error: 'No sales data available for anomaly detection'
        };
      }
      
      // Detect outliers
      const outlierIndices = detectOutliers(salesData, threshold, valueKey);
      
      // Extract outlier data points
      const anomalies = outlierIndices.map(index => ({
        ...salesData[index],
        anomalyIndex: index
      }));
      
      return {
        success: true,
        data: salesData,
        anomalies,
        anomalyCount: anomalies.length,
        options: {
          startDate,
          endDate,
          groupBy,
          threshold
        }
      };
    } catch (error) {
      logError('Error identifying sales anomalies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate performance metrics
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Performance metrics
   */
  async calculatePerformanceMetrics(options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        groupBy = 'month',
        valueKey = 'amount',
        dateKey = 'date',
        compareWithPrevious = true,
        previousPeriodCount = 1,
        forceFresh = false
      } = options;
      
      // Fetch sales data
      const salesData = await this.fetchSalesData({
        forceFresh,
        startDate,
        endDate,
        groupBy
      });
      
      if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
        return {
          success: false,
          error: 'No sales data available for performance metrics'
        };
      }
      
      // Sort data by date
      const sortedData = [...salesData].sort((a, b) => new Date(a[dateKey]) - new Date(b[dateKey]));
      
      // Calculate growth rates
      const growthRates = calculateGrowthRates(sortedData, valueKey);
      
      // Calculate cumulative sum
      const cumulativeData = calculateCumulativeSum(sortedData, valueKey);
      
      // Calculate regression for trend
      const regression = calculateLinearRegression(sortedData, null, valueKey);
      
      // Calculate period-over-period comparison if requested
      let periodComparison = null;
      if (compareWithPrevious && sortedData.length > previousPeriodCount) {
        const currentPeriod = sortedData.slice(-previousPeriodCount);
        const previousPeriod = sortedData.slice(-previousPeriodCount * 2, -previousPeriodCount);
        
        const currentTotal = currentPeriod.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
        const previousTotal = previousPeriod.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
        
        const changeAmount = currentTotal - previousTotal;
        const changePercent = previousTotal !== 0 ? (changeAmount / previousTotal) * 100 : 0;
        
        periodComparison = {
          currentPeriod: {
            data: currentPeriod,
            total: currentTotal
          },
          previousPeriod: {
            data: previousPeriod,
            total: previousTotal
          },
          change: {
            amount: changeAmount,
            percent: changePercent,
            direction: changeAmount > 0 ? 'increase' : (changeAmount < 0 ? 'decrease' : 'unchanged')
          }
        };
      }
      
      // Calculate overall metrics
      const totalValue = sortedData.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
      const avgValue = totalValue / sortedData.length;
      const minValue = Math.min(...sortedData.map(item => Number(item[valueKey] || 0)));
      const maxValue = Math.max(...sortedData.map(item => Number(item[valueKey] || 0)));
      
      // Calculate volatility (standard deviation)
      const squaredDiffs = sortedData.map(item => Math.pow(Number(item[valueKey] || 0) - avgValue, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / sortedData.length;
      const volatility = Math.sqrt(variance);
      
      return {
        success: true,
        data: sortedData,
        metrics: {
          total: totalValue,
          average: avgValue,
          minimum: minValue,
          maximum: maxValue,
          volatility,
          trend: regression.slope > 0.05 ? 'increasing' : (regression.slope < -0.05 ? 'decreasing' : 'stable'),
          trendStrength: Math.abs(regression.slope),
          growthRates,
          cumulativeData: cumulativeData.map(item => item.cumulativeSum)
        },
        periodComparison,
        options: {
          startDate,
          endDate,
          groupBy,
          compareWithPrevious,
          previousPeriodCount
        }
      };
    } catch (error) {
      logError('Error calculating performance metrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate performance report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - Performance report
   */
  async generatePerformanceReport(options = {}) {
    try {
      const { 
        startDate = null, 
        endDate = null, 
        groupBy = 'month',
        includeForecasts = true,
        includeTrends = true,
        includeAnomalies = true,
        forecastPeriods = 3,
        forceFresh = false
      } = options;
      
      // Calculate performance metrics
      const metrics = await this.calculatePerformanceMetrics({
        startDate,
        endDate,
        groupBy,
        forceFresh
      });
      
      if (!metrics.success) {
        return metrics;
      }
      
      // Add trend analysis if requested
      let trends = null;
      if (includeTrends) {
        trends = await this.analyzeSalesTrends({
          startDate,
          endDate,
          groupBy,
          forceFresh: false // Use already fetched data
        });
      }
      
      // Add forecasts if requested
      let forecasts = null;
      if (includeForecasts) {
        forecasts = await this.generateSalesForecast({
          startDate,
          endDate,
          groupBy,
          periods: forecastPeriods,
          forceFresh: false // Use already fetched data
        });
      }
      
      // Add anomalies if requested
      let anomalies = null;
      if (includeAnomalies) {
        anomalies = await this.identifySalesAnomalies({
          startDate,
          endDate,
          groupBy,
          forceFresh: false // Use already fetched data
        });
      }
      
      // Generate report summary
      const summary = {
        period: {
          start: startDate || metrics.data[0].date,
          end: endDate || metrics.data[metrics.data.length - 1].date,
          groupBy
        },
        performance: {
          total: metrics.metrics.total,
          average: metrics.metrics.average,
          trend: metrics.metrics.trend,
          changePercent: metrics.periodComparison ? metrics.periodComparison.change.percent : null
        },
        forecast: forecasts ? {
          nextPeriodValue: forecasts.forecast[0].amount,
          trend: forecasts.forecast[forecasts.forecast.length - 1].amount > forecasts.forecast[0].amount ? 'increasing' : 'decreasing'
        } : null,
        anomalies: anomalies ? {
          count: anomalies.anomalyCount,
          significant: anomalies.anomalyCount > 0
        } : null
      };
      
      return {
        success: true,
        summary,
        metrics,
        trends: trends && trends.success ? trends : null,
        forecasts: forecasts && forecasts.success ? forecasts : null,
        anomalies: anomalies && anomalies.success ? anomalies : null,
        options: {
          startDate,
          endDate,
          groupBy,
          includeForecasts,
          includeTrends,
          includeAnomalies,
          forecastPeriods
        }
      };
    } catch (error) {
      logError('Error generating performance report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;

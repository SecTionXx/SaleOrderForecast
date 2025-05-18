/**
 * ChartManager - Manages all charts in the application
 * Provides a centralized interface for creating, updating, and managing charts
 */

import { logDebug, logError } from '../utils/logger.js';
import { ForecastByMonthChart } from './ForecastByMonthChart.js';
import { ForecastByStageChart } from './ForecastByStageChart.js';
import { ForecastBySalesRepChart } from './ForecastBySalesRepChart.js';
import { ProbabilityDistributionChart } from './ProbabilityDistributionChart.js';

export class ChartManager {
  /**
   * Create a new ChartManager instance
   */
  constructor() {
    this.charts = new Map();
    this.initialized = false;
  }

  /**
   * Initialize all charts
   * @param {HTMLElement} container - The container element where charts should be rendered
   */
  initialize(container = document) {
    if (this.initialized) {
      logDebug('ChartManager already initialized');
      return;
    }

    try {
      // Create chart instances
      this.charts.set('forecastByMonth', new ForecastByMonthChart('forecastByMonthChart'));
      this.charts.set('forecastByStage', new ForecastByStageChart('forecastByStageChart'));
      this.charts.set('forecastBySalesRep', new ForecastBySalesRepChart('forecastBySalesRepChart'));
      this.charts.set('probabilityDistribution', new ProbabilityDistributionChart('probabilityDistributionChart'));

      // Set up responsive behavior
      this.setupResponsiveBehavior();
      
      this.initialized = true;
      logDebug('ChartManager initialized successfully');
    } catch (error) {
      logError('Error initializing ChartManager:', error);
    }
  }

  /**
   * Update all charts with new data
   * @param {Array} data - The data to update the charts with
   */
  updateCharts(data) {
    if (!this.initialized) {
      logError('ChartManager not initialized. Call initialize() first.');
      return;
    }

    if (!Array.isArray(data)) {
      logError('Invalid data provided to update charts');
      return;
    }

    try {
      // Update each chart with the new data
      this.charts.forEach((chart, chartId) => {
        try {
          if (chart.chart) {
            chart.update(data);
          } else {
            chart.create(data);
          }
          logDebug(`Updated chart: ${chartId}`);
        } catch (error) {
          logError(`Error updating chart ${chartId}:`, error);
        }
      });
    } catch (error) {
      logError('Error updating charts:', error);
    }
  }

  /**
   * Get a specific chart by ID
   * @param {string} chartId - The ID of the chart to get
   * @returns {BaseChart|undefined} - The chart instance, or undefined if not found
   */
  getChart(chartId) {
    return this.charts.get(chartId);
  }

  /**
   * Destroy all charts and clean up resources
   */
  destroy() {
    try {
      this.charts.forEach(chart => {
        try {
          if (chart.destroy) {
            chart.destroy();
          }
        } catch (error) {
          logError('Error destroying chart:', error);
        }
      });
      
      this.charts.clear();
      this.initialized = false;
      
      // Clean up event listeners
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeHandler = null;
      }
      
      logDebug('ChartManager destroyed');
    } catch (error) {
      logError('Error destroying ChartManager:', error);
    }
  }

  /**
   * Set up responsive behavior for charts
   * @private
   */
  setupResponsiveBehavior() {
    // Debounce the resize handler to improve performance
    let resizeTimeout;
    
    this.resizeHandler = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        try {
          this.charts.forEach(chart => {
            if (chart.chart && typeof chart.chart.resize === 'function') {
              chart.chart.resize();
            }
          });
          logDebug('Charts resized for new viewport');
        } catch (error) {
          logError('Error resizing charts:', error);
        }
      }, 250);
    };
    
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Export all charts as images
   * @param {string} [format='png'] - The image format (png, jpeg, webp)
   * @param {number} [quality=0.9] - The image quality (0-1)
   * @returns {Object} - Object with chart IDs as keys and data URLs as values
   */
  exportAllCharts(format = 'png', quality = 0.9) {
    const exports = {};
    
    this.charts.forEach((chart, chartId) => {
      try {
        if (chart.exportImage) {
          exports[chartId] = chart.exportImage(format, quality);
        }
      } catch (error) {
        logError(`Error exporting chart ${chartId}:`, error);
      }
    });
    
    return exports;
  }

  /**
   * Download all charts as images
   * @param {string} [prefix='chart'] - Prefix for the downloaded files
   * @param {string} [format='png'] - The image format (png, jpeg, webp)
   * @param {number} [quality=0.9] - The image quality (0-1)
   */
  downloadAllCharts(prefix = 'chart', format = 'png', quality = 0.9) {
    this.charts.forEach((chart, chartId) => {
      try {
        if (chart.downloadImage) {
          chart.downloadImage(`${prefix}_${chartId}`, format, quality);
        }
      } catch (error) {
        logError(`Error downloading chart ${chartId}:`, error);
      }
    });
  }
}

// Create a singleton instance
export const chartManager = new ChartManager();

export default chartManager;

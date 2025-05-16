/**
 * analyticsVisualizer.js - Analytics Visualization Component
 * Provides visualization capabilities for analytics data
 */

import { logError } from '../utils/logger.js';

/**
 * Analytics Visualizer Component
 * Renders charts and visualizations for analytics data
 */
class AnalyticsVisualizer {
  constructor(options = {}) {
    this.chartLibrary = options.chartLibrary || 'chart.js';
    this.container = null;
    this.charts = {};
    this.colorPalette = [
      '#4285F4', '#34A853', '#FBBC05', '#EA4335', // Primary colors
      '#137333', '#185ABC', '#A50E0E', '#E37400', // Secondary colors
      '#1A73E8', '#007B83', '#7627BB', '#B31412'  // Additional colors
    ];
  }

  /**
   * Initialize the visualizer
   * @param {string|HTMLElement} container - Container element or selector
   * @returns {boolean} - Success status
   */
  initialize(container) {
    try {
      if (typeof container === 'string') {
        this.container = document.querySelector(container);
      } else {
        this.container = container;
      }
      
      if (!this.container) {
        throw new Error('Container element not found');
      }
      
      // Check if chart library is loaded
      if (this.chartLibrary === 'chart.js' && !window.Chart) {
        console.warn('Chart.js not loaded. Loading from CDN...');
        return this._loadChartLibrary()
          .then(() => {
            console.log('Chart.js loaded successfully');
            return true;
          })
          .catch(error => {
            logError('Failed to load Chart.js', error);
            return false;
          });
      }
      
      return true;
    } catch (error) {
      logError('Error initializing analytics visualizer', error);
      return false;
    }
  }

  /**
   * Load chart library dynamically
   * @returns {Promise} - Promise that resolves when library is loaded
   * @private
   */
  _loadChartLibrary() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      script.integrity = 'sha256-+8RZJLOWWrKgwkHnO1aZYRCFu5Tl2hHHwS/MgNyJHc=';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Create a line chart
   * @param {string} id - Chart ID
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} - Chart instance
   */
  createLineChart(id, data, options = {}) {
    try {
      const chartContainer = this._createChartContainer(id);
      const ctx = chartContainer.getContext('2d');
      
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false
          },
          legend: {
            position: 'top',
          },
          title: {
            display: options.title ? true : false,
            text: options.title || ''
          }
        },
        scales: {
          x: {
            title: {
              display: options.xAxisTitle ? true : false,
              text: options.xAxisTitle || ''
            }
          },
          y: {
            title: {
              display: options.yAxisTitle ? true : false,
              text: options.yAxisTitle || ''
            },
            beginAtZero: options.beginAtZero !== undefined ? options.beginAtZero : true
          }
        },
        ...options
      };
      
      const chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: chartOptions
      });
      
      this.charts[id] = chart;
      return chart;
    } catch (error) {
      logError(`Error creating line chart: ${id}`, error);
      return null;
    }
  }

  /**
   * Create a bar chart
   * @param {string} id - Chart ID
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} - Chart instance
   */
  createBarChart(id, data, options = {}) {
    try {
      const chartContainer = this._createChartContainer(id);
      const ctx = chartContainer.getContext('2d');
      
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false
          },
          legend: {
            position: 'top',
          },
          title: {
            display: options.title ? true : false,
            text: options.title || ''
          }
        },
        scales: {
          x: {
            title: {
              display: options.xAxisTitle ? true : false,
              text: options.xAxisTitle || ''
            }
          },
          y: {
            title: {
              display: options.yAxisTitle ? true : false,
              text: options.yAxisTitle || ''
            },
            beginAtZero: options.beginAtZero !== undefined ? options.beginAtZero : true
          }
        },
        ...options
      };
      
      const chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: chartOptions
      });
      
      this.charts[id] = chart;
      return chart;
    } catch (error) {
      logError(`Error creating bar chart: ${id}`, error);
      return null;
    }
  }

  /**
   * Create a forecast chart with confidence intervals
   * @param {string} id - Chart ID
   * @param {Array} historicalData - Historical data points
   * @param {Array} forecastData - Forecast data points
   * @param {Object} options - Chart options
   * @returns {Object} - Chart instance
   */
  createForecastChart(id, historicalData, forecastData, options = {}) {
    try {
      const chartContainer = this._createChartContainer(id);
      const ctx = chartContainer.getContext('2d');
      
      // Extract data points
      const labels = [
        ...historicalData.map(d => d[options.dateKey || 'date']),
        ...forecastData.map(d => d[options.dateKey || 'date'])
      ];
      
      const historicalValues = historicalData.map(d => d[options.valueKey || 'amount']);
      const forecastValues = forecastData.map(d => d[options.valueKey || 'amount']);
      
      // Create datasets
      const datasets = [
        {
          label: options.historicalLabel || 'Historical Data',
          data: [...historicalValues, ...Array(forecastValues.length).fill(null)],
          borderColor: options.historicalColor || this.colorPalette[0],
          backgroundColor: options.historicalColor || this.colorPalette[0],
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: options.forecastLabel || 'Forecast',
          data: [...Array(historicalValues.length).fill(null), ...forecastValues],
          borderColor: options.forecastColor || this.colorPalette[1],
          backgroundColor: options.forecastColor || this.colorPalette[1],
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1
        }
      ];
      
      // Add confidence intervals if available
      if (forecastData[0].lower !== undefined && forecastData[0].upper !== undefined) {
        const lowerValues = forecastData.map(d => d.lower);
        const upperValues = forecastData.map(d => d.upper);
        
        datasets.push({
          label: options.confidenceLabel || 'Confidence Interval',
          data: [...Array(historicalValues.length).fill(null), ...forecastValues],
          borderColor: 'rgba(0, 0, 0, 0)',
          backgroundColor: options.confidenceColor || 'rgba(66, 133, 244, 0.2)',
          fill: '+1',
          pointRadius: 0
        });
        
        datasets.push({
          label: 'Upper Bound',
          data: [...Array(historicalValues.length).fill(null), ...upperValues],
          borderColor: 'rgba(0, 0, 0, 0)',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          pointRadius: 0,
          fill: false,
          hidden: true
        });
        
        datasets.push({
          label: 'Lower Bound',
          data: [...Array(historicalValues.length).fill(null), ...lowerValues],
          borderColor: 'rgba(0, 0, 0, 0)',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          pointRadius: 0,
          fill: false,
          hidden: true
        });
      }
      
      // Add scenarios if available
      if (options.scenarios) {
        Object.entries(options.scenarios).forEach(([name, data], index) => {
          const scenarioValues = data.map(d => d[options.valueKey || 'amount']);
          
          datasets.push({
            label: `${name.charAt(0).toUpperCase() + name.slice(1)} Scenario`,
            data: [...Array(historicalValues.length).fill(null), ...scenarioValues],
            borderColor: options.scenarioColors?.[name] || this.colorPalette[index + 2],
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 2,
            borderDash: [2, 2],
            tension: 0.1
          });
        });
      }
      
      const chartData = {
        labels,
        datasets
      };
      
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false
          },
          legend: {
            position: 'top',
          },
          title: {
            display: options.title ? true : false,
            text: options.title || ''
          },
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                xMin: historicalValues.length - 0.5,
                xMax: historicalValues.length - 0.5,
                borderColor: 'rgba(0, 0, 0, 0.2)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'Forecast Start',
                  position: 'start'
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: options.xAxisTitle ? true : false,
              text: options.xAxisTitle || ''
            }
          },
          y: {
            title: {
              display: options.yAxisTitle ? true : false,
              text: options.yAxisTitle || ''
            },
            beginAtZero: options.beginAtZero !== undefined ? options.beginAtZero : true
          }
        },
        ...options
      };
      
      const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
      });
      
      this.charts[id] = chart;
      return chart;
    } catch (error) {
      logError(`Error creating forecast chart: ${id}`, error);
      return null;
    }
  }

  /**
   * Create a trend analysis chart
   * @param {string} id - Chart ID
   * @param {Object} analysisResults - Trend analysis results
   * @param {Object} options - Chart options
   * @returns {Object} - Chart instance
   */
  createTrendAnalysisChart(id, analysisResults, options = {}) {
    try {
      const chartContainer = this._createChartContainer(id);
      const ctx = chartContainer.getContext('2d');
      
      const data = analysisResults.data;
      const metrics = analysisResults.metrics;
      
      // Extract data points
      const labels = data.map(d => d[options.dateKey || 'date']);
      const values = data.map(d => d[options.valueKey || 'amount']);
      
      // Create datasets
      const datasets = [
        {
          label: options.dataLabel || 'Actual Data',
          data: values,
          borderColor: options.dataColor || this.colorPalette[0],
          backgroundColor: options.dataColor || this.colorPalette[0],
          borderWidth: 2,
          tension: 0.1
        }
      ];
      
      // Add moving average if available
      if (metrics.movingAverages && metrics.movingAverages.length > 0) {
        const maValues = [];
        let maOffset = 0;
        
        // Handle offset for moving average
        if (options.movingAveragePeriod) {
          maOffset = Math.floor(options.movingAveragePeriod / 2);
        }
        
        // Fill with nulls for the first few points
        for (let i = 0; i < maOffset; i++) {
          maValues.push(null);
        }
        
        // Add moving average values
        metrics.movingAverages.forEach(ma => {
          maValues.push(ma.movingAverage);
        });
        
        // Fill with nulls for the last few points
        for (let i = maValues.length; i < values.length; i++) {
          maValues.push(null);
        }
        
        datasets.push({
          label: options.maLabel || 'Moving Average',
          data: maValues,
          borderColor: options.maColor || this.colorPalette[1],
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 2,
          tension: 0.1
        });
      }
      
      // Add trend line if available
      if (metrics.regression) {
        const { slope, intercept } = metrics.regression;
        const trendValues = values.map((_, i) => slope * i + intercept);
        
        datasets.push({
          label: options.trendLabel || 'Trend Line',
          data: trendValues,
          borderColor: options.trendColor || this.colorPalette[2],
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0
        });
      }
      
      // Mark outliers if available
      if (metrics.outliers && metrics.outliers.length > 0) {
        const outlierData = values.map((v, i) => 
          metrics.outliers.includes(i) ? v : null
        );
        
        datasets.push({
          label: options.outlierLabel || 'Outliers',
          data: outlierData,
          borderColor: 'rgba(0, 0, 0, 0)',
          backgroundColor: options.outlierColor || this.colorPalette[3],
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false
        });
      }
      
      const chartData = {
        labels,
        datasets
      };
      
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: 'index',
            intersect: false
          },
          legend: {
            position: 'top',
          },
          title: {
            display: options.title ? true : false,
            text: options.title || ''
          }
        },
        scales: {
          x: {
            title: {
              display: options.xAxisTitle ? true : false,
              text: options.xAxisTitle || ''
            }
          },
          y: {
            title: {
              display: options.yAxisTitle ? true : false,
              text: options.yAxisTitle || ''
            },
            beginAtZero: options.beginAtZero !== undefined ? options.beginAtZero : true
          }
        },
        ...options
      };
      
      const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
      });
      
      this.charts[id] = chart;
      return chart;
    } catch (error) {
      logError(`Error creating trend analysis chart: ${id}`, error);
      return null;
    }
  }

  /**
   * Create a chart container
   * @param {string} id - Chart ID
   * @returns {HTMLCanvasElement} - Canvas element
   * @private
   */
  _createChartContainer(id) {
    // Check if container already exists
    let canvas = document.getElementById(id);
    if (canvas) {
      // Clear existing chart
      if (this.charts[id]) {
        this.charts[id].destroy();
        delete this.charts[id];
      }
      return canvas;
    }
    
    // Create new canvas
    canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = 400;
    canvas.height = 200;
    
    this.container.appendChild(canvas);
    return canvas;
  }

  /**
   * Update chart data
   * @param {string} id - Chart ID
   * @param {Object} data - New chart data
   * @returns {boolean} - Success status
   */
  updateChart(id, data) {
    try {
      const chart = this.charts[id];
      if (!chart) {
        throw new Error(`Chart not found: ${id}`);
      }
      
      chart.data = data;
      chart.update();
      return true;
    } catch (error) {
      logError(`Error updating chart: ${id}`, error);
      return false;
    }
  }

  /**
   * Destroy a chart
   * @param {string} id - Chart ID
   * @returns {boolean} - Success status
   */
  destroyChart(id) {
    try {
      const chart = this.charts[id];
      if (!chart) {
        return false;
      }
      
      chart.destroy();
      delete this.charts[id];
      
      const canvas = document.getElementById(id);
      if (canvas) {
        canvas.remove();
      }
      
      return true;
    } catch (error) {
      logError(`Error destroying chart: ${id}`, error);
      return false;
    }
  }

  /**
   * Destroy all charts
   * @returns {boolean} - Success status
   */
  destroyAllCharts() {
    try {
      Object.keys(this.charts).forEach(id => {
        this.destroyChart(id);
      });
      return true;
    } catch (error) {
      logError('Error destroying all charts', error);
      return false;
    }
  }

  /**
   * Create a metrics dashboard
   * @param {Object} reportData - Performance report data
   * @param {string} containerId - Container ID
   * @returns {boolean} - Success status
   */
  createMetricsDashboard(reportData, containerId) {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container not found: ${containerId}`);
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create dashboard structure
      const dashboardHTML = `
        <div class="analytics-dashboard">
          <div class="dashboard-header">
            <h2>${reportData.summary.period.start} to ${reportData.summary.period.end}</h2>
          </div>
          <div class="metrics-summary">
            <div class="metric-card">
              <h3>Total Sales</h3>
              <div class="metric-value">${reportData.summary.performance.total.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <h3>Average</h3>
              <div class="metric-value">${reportData.summary.performance.average.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <h3>Trend</h3>
              <div class="metric-value ${reportData.summary.performance.trend}">${reportData.summary.performance.trend}</div>
            </div>
            ${reportData.summary.performance.changePercent !== null ? `
              <div class="metric-card">
                <h3>Change</h3>
                <div class="metric-value ${reportData.summary.performance.changePercent >= 0 ? 'positive' : 'negative'}">
                  ${reportData.summary.performance.changePercent >= 0 ? '+' : ''}${reportData.summary.performance.changePercent.toFixed(2)}%
                </div>
              </div>
            ` : ''}
          </div>
          <div class="chart-container">
            <div class="chart-row">
              <div class="chart-col">
                <div class="chart-wrapper">
                  <h3>Sales Trend</h3>
                  <canvas id="${containerId}-trend-chart"></canvas>
                </div>
              </div>
              ${reportData.forecasts ? `
                <div class="chart-col">
                  <div class="chart-wrapper">
                    <h3>Sales Forecast</h3>
                    <canvas id="${containerId}-forecast-chart"></canvas>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      container.innerHTML = dashboardHTML;
      
      // Initialize charts
      this.initialize(`#${containerId}`);
      
      // Create trend chart
      if (reportData.trends) {
        this.createTrendAnalysisChart(
          `${containerId}-trend-chart`,
          reportData.trends.analysis,
          {
            title: 'Sales Trend Analysis',
            xAxisTitle: 'Period',
            yAxisTitle: 'Amount',
            dateKey: 'date',
            valueKey: 'amount'
          }
        );
      } else {
        // Create simple line chart if trend analysis not available
        const labels = reportData.metrics.data.map(d => d.date);
        const values = reportData.metrics.data.map(d => d.amount);
        
        this.createLineChart(
          `${containerId}-trend-chart`,
          {
            labels,
            datasets: [{
              label: 'Sales',
              data: values,
              borderColor: this.colorPalette[0],
              backgroundColor: this.colorPalette[0],
              tension: 0.1
            }]
          },
          {
            title: 'Sales Trend',
            xAxisTitle: 'Period',
            yAxisTitle: 'Amount'
          }
        );
      }
      
      // Create forecast chart if available
      if (reportData.forecasts) {
        this.createForecastChart(
          `${containerId}-forecast-chart`,
          reportData.forecasts.data,
          reportData.forecasts.forecast,
          {
            title: 'Sales Forecast',
            xAxisTitle: 'Period',
            yAxisTitle: 'Amount',
            dateKey: 'date',
            valueKey: 'amount',
            scenarios: reportData.forecasts.scenarios
          }
        );
      }
      
      return true;
    } catch (error) {
      logError('Error creating metrics dashboard', error);
      return false;
    }
  }
}

// Export the AnalyticsVisualizer class
export default AnalyticsVisualizer;

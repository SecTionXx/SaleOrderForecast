/**
 * ForecastByMonthChart - Displays forecast data by month
 * Extends BaseChart to provide specific functionality for monthly forecast visualization
 */

import { BaseChart } from './BaseChart.js';
import { logDebug, logError } from '../utils/logger.js';
import { formatCurrency } from '../utils/formatters.js';

export class ForecastByMonthChart extends BaseChart {
  /**
   * Create a new ForecastByMonthChart instance
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} [options={}] - Chart options
   */
  constructor(canvasId, options = {}) {
    super(canvasId, {
      chartType: 'bar',
      responsive: true,
      maintainAspectRatio: true,
      ...options
    });
    
    // Ensure we have a valid chart type
    if (!this.defaultOptions.chartType) {
      this.defaultOptions.chartType = 'bar';
    }

    // Default color palette
    this.palette = {
      forecast: 'rgba(67, 97, 238, 0.8)',
      actual: 'rgba(34, 197, 94, 0.8)',
      hoverBackground: 'rgba(0, 0, 0, 0.1)'
    };
  }

  /**
   * Process data for the chart
   * @param {Array} data - The raw data to process
   * @returns {Object} Processed data for the chart
   * @private
   */
  _processData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { labels: [], forecastData: [], weightedData: [], total: 0 };
    }
    
    // Group data by month and calculate totals
    const monthlyData = {};
    
    data.forEach(item => {
      if (!item.expectedCloseDate) return;
      
      const date = new Date(item.expectedCloseDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      const amount = parseFloat(item.amount) || 0;
      const probability = parseFloat(item.probability) || 0;
      const weightedAmount = amount * (probability / 100);
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          forecastAmount: 0,
          weightedForecast: 0,
          count: 0
        };
      }
      
      monthlyData[monthYear].forecastAmount += amount;
      monthlyData[monthYear].weightedForecast += weightedAmount;
      monthlyData[monthYear].count++;
    });
    
    // Convert to arrays and sort by date
    const sortedData = Object.entries(monthlyData)
      .map(([monthYear, values]) => ({
        month: monthYear,
        ...values
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA - dateB;
      });
    
    // Extract data for chart
    const labels = sortedData.map(item => item.month);
    const forecastData = sortedData.map(item => item.forecastAmount);
    const weightedData = sortedData.map(item => item.weightedForecast);
    
    // Calculate totals
    const totalForecast = forecastData.reduce((sum, val) => sum + val, 0);
    const totalWeighted = weightedData.reduce((sum, val) => sum + val, 0);
    
    return {
      labels,
      forecastData,
      weightedData,
      total: totalWeighted,
      count: data.length
    };
  }
  
  /**
   * Update the chart with new data
   * @param {Array} data - The forecast data to display
   * @param {Object} options - Additional options
   * @param {boolean} [options.animate=true] - Whether to animate the update
   */
  update(data, { animate = true } = {}) {
    if (!this.chart) {
      this.showError('Chart not initialized');
      return;
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      this.showError('No data available');
      return;
    }
    
    this.setLoading(true, 'Updating chart...');
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      try {
        // Process the data
        const { labels, forecastData, weightedData, total, count } = this._processData(data);
        
        // Update chart data
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = forecastData;
        this.chart.data.datasets[1].data = weightedData;
        
        // Update y-axis max with some padding
        const maxValue = Math.max(...forecastData, ...weightedData) * 1.2;
        this.chart.options.scales.y.max = maxValue;
        
        // Update chart with animation if specified
        this.chart.update(animate ? 'active' : 'none');
        
        // Update summary
        this.updateSummary(`${count} deals • ${formatCurrency(total, 'USD', 'en-US')} weighted forecast`);
        
        // Hide any previous errors
        this.hideError();
        
        logDebug('ForecastByMonthChart updated with', count, 'deals');
      } catch (error) {
        const errorMsg = 'Failed to update forecast chart';
        logError(errorMsg, error);
        this.showError(errorMsg);
      } finally {
        this.setLoading(false);
      }
    });
  }

  /**
   * Initialize the forecast by month chart
   */
  initialize() {
    if (!this.ctx) {
      this.showError('Canvas context not available');
      return;
    }

    try {
      // Set initial loading state
      this.setLoading(true, 'Initializing chart...');
      
      // Create the chart instance
      this.chart = new Chart(this.ctx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Forecast Amount',
              data: [],
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
              categoryPercentage: 0.8,
              barPercentage: 0.9,
            },
            {
              label: 'Weighted Forecast',
              data: [],
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false,
              categoryPercentage: 0.8,
              barPercentage: 0.9,
            },
          ],
        },
        options: {
          ...this.options,
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Month',
                color: 'var(--text-secondary)',
                font: {
                  weight: '500',
                },
              },
              grid: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                color: 'var(--text-muted)',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Amount',
                color: 'var(--text-secondary)',
                font: {
                  weight: '500',
                },
              },
              beginAtZero: true,
              grid: {
                color: 'var(--border-color)',
                drawBorder: false,
              },
              ticks: {
                color: 'var(--text-muted)',
                callback: (value) => formatCurrency(value, 'USD', 'en-US').replace(/^\D+/, ''),
              },
            },
          },
          plugins: {
            legend: {
              display: false, // We'll use custom legend
            },
            tooltip: {
              backgroundColor: 'var(--bg-card)',
              titleColor: 'var(--text-primary)',
              bodyColor: 'var(--text-secondary)',
              borderColor: 'var(--border-color)',
              borderWidth: 1,
              padding: 12,
              usePointStyle: true,
              boxPadding: 6,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${formatCurrency(value, 'USD', 'en-US')}`;
                },
                labelColor: (context) => {
                  return {
                    borderColor: context.dataset.borderColor,
                    backgroundColor: context.dataset.backgroundColor,
                    borderWidth: 2,
                    borderRadius: 2,
                  };
                },
              },
            },
          },
          animation: {
            duration: 800,
            easing: 'easeInOutQuart',
          },
          transitions: {
            active: {
              animation: {
                duration: 0,
              },
            },
          },
        },
      });

      
      // Update initial legend
      this.updateLegend([
        { label: 'Forecast Amount', color: 'rgba(54, 162, 235, 1)' },
        { label: 'Weighted Forecast', color: 'rgba(75, 192, 192, 1)' },
      ]);
      
      // Update initial summary
      this.updateSummary('Hover over the chart for details');
      
      logDebug('ForecastByMonthChart initialized');
    } catch (error) {
      const errorMsg = 'Failed to initialize forecast chart';
      logError(errorMsg, error);
      this.showError(errorMsg);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Format a value for display in the chart
   * @param {number} value - The value to format
   * @returns {string} - The formatted value
   */
  formatValue(value) {
    return formatCurrency(value);
  }
}

export default ForecastByMonthChart;

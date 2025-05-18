import { 
  initChartContainer, 
  updateChartLegend, 
  updateChartSummary,
  setChartLoading,
  showChartError,
  hideChartError,
  exportChartAsImage
} from '../utils/chartUtils.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * BaseChart - Abstract base class for all chart types
 * Provides common functionality and interface for chart implementations
 */
export class BaseChart {
  /**
   * Create a new chart instance
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} options - Chart options
   */
  constructor(canvasId, options = {}) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.container = this.canvas?.closest('.chart-container');
    this.ctx = this.canvas?.getContext('2d');
    this.chart = null;
    this.isLoading = false;
    
    // Set default options
    this.defaultOptions = {
      chartType: 'bar',  // Default chart type
      responsive: true,
      maintainAspectRatio: false,
      ...options
    };
    
    // For backward compatibility
    this.options = this.defaultOptions;
    
    if (!this.ctx) {
      const errorMsg = `Canvas element with ID '${canvasId}' not found or not supported`;
      logError(errorMsg);
      if (this.container) {
        showChartError(this.container, 'Failed to initialize chart');
      }
      return;
    }
    
    // Initialize the chart container
    if (this.container) {
      initChartContainer(this.container, {
        onRefresh: () => this.refresh(),
        onExport: () => this.export()
      });
    }
    
    this.initialize();
  }

  /**
   * Initialize the chart
   * This method should be implemented by subclasses
   * @abstract
   */
  initialize() {
    throw new Error('Method "initialize" must be implemented by subclasses');
  }
  
  /**
   * Set loading state for the chart
   * @param {boolean} isLoading - Whether the chart is loading
   * @param {string} message - Optional loading message
   */
  setLoading(isLoading, message = 'Loading...') {
    if (!this.container) return;
    
    this.isLoading = isLoading;
    setChartLoading(this.container, isLoading, message);
    
    if (isLoading) {
      hideChartError(this.container);
    }
  }
  
  /**
   * Show an error message on the chart
   * @param {string} message - The error message to display
   * @param {Error} error - Optional error object for logging
   */
  showError(message, error = null) {
    if (error) {
      logError(message, error);
    } else {
      logError(message);
    }
    
    if (this.container) {
      showChartError(this.container, message);
    }
  }
  
  /**
   * Hide any error message on the chart
   */
  hideError() {
    if (this.container) {
      const errorElement = this.container.querySelector('.chart-error');
      if (errorElement) {
        errorElement.remove();
      }
    }
  }
  
  /**
   * Update the chart legend
   * @param {Array} legendData - Array of legend items with { label, color }
   */
  updateLegend(legendData) {
    if (!this.container) return;
    updateChartLegend(this.container, legendData);
  }
  
  /**
   * Update the chart summary
   * @param {string} summaryText - The summary text to display
   */
  updateSummary(summaryText) {
    if (!this.container) return;
    updateChartSummary(this.container, summaryText);
  }
  
  /**
   * Refresh the chart data
   * This method can be overridden by subclasses
   */
  async refresh() {
    this.setLoading(true, 'Refreshing data...');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (this.chart) {
        this.chart.update();
      }
    } catch (error) {
      this.showError('Failed to refresh chart', error);
    } finally {
      this.setLoading(false);
    }
  }
  
  /**
   * Export the chart as an image
   * @param {string} format - The image format (default: 'png')
   */
  export(format = 'png') {
    if (!this.canvas) return;
    
    const chartName = this.constructor.name.replace('Chart', '').toLowerCase();
    const filename = `chart-${chartName}-${new Date().toISOString().split('T')[0]}`;
    
    try {
      exportChartAsImage(this.canvas, filename, format);
    } catch (error) {
      logError('Failed to export chart:', error);
      this.showError('Failed to export chart');
    }
  }

  /**
   * Process data for the chart
   * @param {Array} data - The raw data to process
   * @returns {Object} - Processed data for the chart
   * @abstract
   */
  processData(data) {
    throw new Error('Method processData() must be implemented');
  }

  /**
   * Create the chart with the provided data
   * @param {Array} data - The data to create the chart with
   */
  create(data) {
    if (!Array.isArray(data)) {
      logError('Invalid data provided to create chart');
      return;
    }

    try {
      this.hideError();
      const chartData = this.processData(data);
      
      if (this.chart) {
        this.destroy();
      }

      if (!this.ctx) {
        throw new Error('Canvas context is not available');
      }

      const chartType = this.defaultOptions?.chartType || 'bar';
      this.chart = new Chart(this.ctx, {
        type: chartType,
        data: chartData,
        options: this.getChartOptions()
      });

      logDebug(`Created ${chartType} chart with ID: ${this.canvasId}`);
      return this.chart;
    } catch (error) {
      const errorMsg = `Error creating chart: ${error.message}`;
      this.showError(errorMsg, error);
      throw error;
    }
  }

  /**
   * Update the chart with new data
   * @param {Array} data - The new data to update the chart with
   */
  update(data) {
    if (!this.chart) {
      this.create(data);
      return;
    }

    try {
      const chartData = this.processData(data);
      
      // Update chart data
      this.chart.data = chartData;
      this.chart.update();
      
      logDebug(`Updated chart with ID: ${this.canvasId}`);
    } catch (error) {
      logError(`Error updating chart: ${error.message}`, error);
    }
  }

  /**
   * Get chart options
   * @returns {Object} - Chart options
   * @protected
   */
  getChartOptions() {
    return {
      responsive: this.defaultOptions.responsive,
      maintainAspectRatio: this.defaultOptions.maintainAspectRatio,
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 4,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
              return `${label}: ${this.formatValue(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            callback: (value) => this.formatValue(value)
          }
        }
      },
      elements: {
        bar: {
          borderRadius: 6,
          borderSkipped: false
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          hoverBorderWidth: 2
        },
        line: {
          tension: 0.3,
          borderWidth: 2,
          fill: false
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      onHover: (event, chartElement) => {
        if (this.chart) {
          this.chart.canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
        }
      }
    };
  }

  /**
   * Format a value for display
   * @param {number} value - The value to format
   * @returns {string} - The formatted value
   * @protected
   */
  formatValue(value) {
    // Default implementation - can be overridden by subclasses
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  }

  /**
   * Destroy the chart instance
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
      logDebug(`Destroyed chart with ID: ${this.canvasId}`);
    }
  }

  /**
   * Export the chart as an image
   * @param {string} [format='png'] - The image format (png, jpeg, webp)
   * @param {number} [quality=0.9] - The image quality (0-1)
   * @returns {string} - The data URL of the exported image
   */
  exportImage(format = 'png', quality = 0.9) {
    if (!this.chart) return '';
    
    const canvas = this.chart.canvas;
    const originalBackground = canvas.style.background;
    
    try {
      // Set white background for export
      canvas.style.background = '#fff';
      
      // Force a redraw to ensure the background is updated
      this.chart.render();
      
      // Return the data URL
      return canvas.toDataURL(`image/${format}`, quality);
    } catch (error) {
      logError('Error exporting chart as image:', error);
      return '';
    } finally {
      // Restore original background
      canvas.style.background = originalBackground;
      // Redraw with original background
      this.chart.render();
    }
  }

  /**
   * Download the chart as an image
   * @param {string} [fileName='chart'] - The name of the file (without extension)
   * @param {string} [format='png'] - The image format (png, jpeg, webp)
   * @param {number} [quality=0.9] - The image quality (0-1)
   */
  downloadImage(fileName = 'chart', format = 'png', quality = 0.9) {
    const dataUrl = this.exportImage(format, quality);
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${fileName}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default BaseChart;

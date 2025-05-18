/**
 * ForecastByStageChart - Displays forecast data by deal stage
 * Extends BaseChart to provide specific functionality for stage-based forecast visualization
 */

import { BaseChart } from './BaseChart.js';
import { logDebug, logError } from '../utils/logger.js';
import { formatCurrency } from '../utils/uiHelpers.js';

const STAGE_COLORS = {
  'Proposal Sent': 'rgba(59, 130, 246, 0.8)',
  'Negotiation': 'rgba(245, 158, 11, 0.8)',
  'Verbal Agreement': 'rgba(234, 179, 8, 0.8)',
  'Closed Won': 'rgba(34, 197, 94, 0.8)',
  'Closed Lost': 'rgba(239, 68, 68, 0.7)',
  'default': 'rgba(107, 114, 128, 0.7)'
};

export class ForecastByStageChart extends BaseChart {
  /**
   * Create a new ForecastByStageChart instance
   * @param {string} canvasId - The ID of the canvas element
   * @param {Object} [options={}] - Chart options
   */
  constructor(canvasId, options = {}) {
    super(canvasId, {
      chartType: 'doughnut', // Using doughnut chart for better visualization of parts to whole
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%', // For doughnut chart
      ...options
    });
    
    // Ensure we have a valid chart type
    if (!this.defaultOptions.chartType) {
      this.defaultOptions.chartType = 'doughnut';
    }

    // Default color palette
    this.palette = STAGE_COLORS;
  }

  /**
   * Process data for the forecast by stage chart
   * @param {Array} data - The raw data to process
   * @returns {Object} - Processed chart data
   */
  processData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      logDebug('No data provided to process for forecast by stage chart');
      return { labels: [], datasets: [] };
    }

    try {
      // Group by stage and sum weighted values
      const stageMap = {};
      
      // Process each deal
      data.forEach((deal) => {
        const stage = deal.dealStage || 'Unknown';
        const value = deal.weightedValue || 0;
        
        if (!stageMap[stage]) {
          stageMap[stage] = 0;
        }
        
        stageMap[stage] += value;
      });

      // Convert to arrays for chart.js
      const stages = Object.keys(stageMap);
      const values = stages.map(stage => stageMap[stage]);
      
      // Generate colors for each stage
      const backgroundColors = stages.map(stage => 
        this.palette[stage] || this.palette.default
      );

      // Calculate percentages for tooltips
      const total = values.reduce((sum, value) => sum + value, 0);
      const percentages = values.map(value => 
        total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%'
      );

      return {
        labels: stages.map((stage, index) => 
          `${stage} (${percentages[index]})`
        ),
        datasets: [{
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: '#fff',
          hoverOffset: 10,
          spacing: 2
        }]
      };
    } catch (error) {
      logError('Error processing forecast by stage data:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Get chart options specific to the forecast by stage chart
   * @returns {Object} - Chart options
   */
  getChartOptions() {
    const baseOptions = super.getChartOptions();
    
    return {
      ...baseOptions,
      cutout: this.options.cutout || '70%',
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: 'Forecast by Stage',
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        legend: {
          ...baseOptions.plugins.legend,
          position: 'right',
          align: 'center',
          labels: {
            ...baseOptions.plugins.legend.labels,
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            ...baseOptions.plugins.tooltip.callbacks,
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      },
      layout: {
        padding: 20
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        ...baseOptions.animation,
        animateScale: true,
        animateRotate: true
      },
      elements: {
        arc: {
          borderWidth: 2
        }
      }
    };
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

export default ForecastByStageChart;

/**
 * ForecastBySalesRepChart - Displays forecast data by sales representative
 * Extends BaseChart to provide specific functionality for sales rep-based forecast visualization
 */

import { BaseChart } from './BaseChart.js';
import { logDebug, logError } from '../utils/logger.js';
import { formatCurrency } from '../utils/uiHelpers.js';

export class ForecastBySalesRepChart extends BaseChart {
  /**
   * Create a new ForecastBySalesRepChart instance
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

    // Default color palette for sales reps
    this.palette = [
      'rgba(59, 130, 246, 0.8)',  // Blue
      'rgba(16, 185, 129, 0.8)',  // Green
      'rgba(245, 158, 11, 0.8)',  // Yellow
      'rgba(139, 92, 246, 0.8)',  // Purple
      'rgba(236, 72, 153, 0.8)',  // Pink
      'rgba(20, 184, 166, 0.8)',  // Teal
      'rgba(249, 115, 22, 0.8)',  // Orange
      'rgba(99, 102, 241, 0.8)'   // Indigo
    ];
    
    this.maxBars = 10; // Maximum number of sales reps to show
  }

  /**
   * Process data for the forecast by sales rep chart
   * @param {Array} data - The raw data to process
   * @returns {Object} - Processed chart data
   */
  processData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      logDebug('No data provided to process for forecast by sales rep chart');
      return { labels: [], datasets: [] };
    }

    try {
      // Group by sales rep and sum weighted values
      const repMap = {};
      
      // Process each deal
      data.forEach((deal) => {
        const rep = deal.salesRep || 'Unassigned';
        const value = deal.weightedValue || 0;
        
        if (!repMap[rep]) {
          repMap[rep] = 0;
        }
        
        repMap[rep] += value;
      });

      // Convert to array and sort by value (descending)
      let reps = Object.keys(repMap).map(rep => ({
        name: rep,
        value: repMap[rep]
      }));
      
      // Sort by value (descending)
      reps.sort((a, b) => b.value - a.value);
      
      // Limit to top N reps and group the rest as "Others"
      let displayReps = [];
      let othersValue = 0;
      
      if (reps.length > this.maxBars) {
        displayReps = reps.slice(0, this.maxBars - 1);
        othersValue = reps.slice(this.maxBars - 1).reduce((sum, rep) => sum + rep.value, 0);
        
        if (othersValue > 0) {
          displayReps.push({
            name: 'Others',
            value: othersValue
          });
        }
      } else {
        displayReps = reps;
      }
      
      // Extract labels and values
      const labels = displayReps.map(rep => rep.name);
      const values = displayReps.map(rep => rep.value);
      
      // Generate colors for each rep
      const backgroundColors = labels.map((_, index) => 
        this.palette[index % this.palette.length]
      );

      return {
        labels,
        datasets: [{
          label: 'Weighted Forecast',
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#fff',
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }]
      };
    } catch (error) {
      logError('Error processing forecast by sales rep data:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Get chart options specific to the forecast by sales rep chart
   * @returns {Object} - Chart options
   */
  getChartOptions() {
    const baseOptions = super.getChartOptions();
    
    return {
      ...baseOptions,
      indexAxis: 'y', // Horizontal bars
      scales: {
        ...baseOptions.scales,
        x: {
          ...baseOptions.scales.x,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount ($)',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          ...baseOptions.scales.y,
          grid: {
            display: false
          },
          title: {
            display: true,
            text: 'Sales Representative',
            font: {
              weight: 'bold'
            }
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0
          }
        }
      },
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: 'Forecast by Sales Representative',
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
          display: false // No need for legend with direct labels
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            ...baseOptions.plugins.tooltip.callbacks,
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              return `${label}: ${formatCurrency(value)}`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 10
        }
      },
      animation: {
        ...baseOptions.animation,
        duration: 1000,
        easing: 'easeInOutQuart'
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

export default ForecastBySalesRepChart;

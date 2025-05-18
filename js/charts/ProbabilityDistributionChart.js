/**
 * ProbabilityDistributionChart - Displays the distribution of deals by probability
 * Extends BaseChart to provide specific functionality for probability distribution visualization
 */

import { BaseChart } from './BaseChart.js';
import { logDebug, logError } from '../utils/logger.js';
import { formatCurrency } from '../utils/uiHelpers.js';

export class ProbabilityDistributionChart extends BaseChart {
  /**
   * Create a new ProbabilityDistributionChart instance
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

    // Color gradient for probability ranges
    this.probabilityRanges = [
      { min: 0, max: 20, color: 'rgba(239, 68, 68, 0.8)' },    // Red for low probability
      { min: 21, max: 50, color: 'rgba(245, 158, 11, 0.8)' },  // Orange for medium-low
      { min: 51, max: 80, color: 'rgba(234, 179, 8, 0.8)' },   // Yellow for medium-high
      { min: 81, max: 100, color: 'rgba(34, 197, 94, 0.8)' }   // Green for high probability
    ];
    
    this.bucketSize = 10; // Size of each probability bucket (e.g., 0-10%, 11-20%, etc.)
  }

  /**
   * Process data for the probability distribution chart
   * @param {Array} data - The raw data to process
   * @returns {Object} - Processed chart data
   */
  processData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      logDebug('No data provided to process for probability distribution chart');
      return { labels: [], datasets: [] };
    }

    try {
      // Initialize buckets for probability ranges
      const buckets = {};
      
      // Create buckets based on bucketSize
      for (let i = 0; i <= 100; i += this.bucketSize) {
        const rangeEnd = Math.min(i + this.bucketSize, 100);
        const rangeLabel = `${i}% - ${rangeEnd}%`;
        buckets[rangeLabel] = {
          count: 0,
          totalValue: 0,
          min: i,
          max: rangeEnd
        };
      }
      
      // Process each deal
      data.forEach((deal) => {
        const probability = parseFloat(deal.probability) || 0;
        const value = deal.totalValue || 0;
        
        // Find the appropriate bucket
        for (const [rangeLabel, bucket] of Object.entries(buckets)) {
          if (probability >= bucket.min && probability <= bucket.max) {
            bucket.count++;
            bucket.totalValue += value;
            break;
          }
        }
      });
      
      // Convert to arrays for chart.js
      const labels = [];
      const counts = [];
      const values = [];
      const backgroundColors = [];
      
      Object.entries(buckets).forEach(([rangeLabel, bucket]) => {
        if (bucket.count > 0) {
          labels.push(rangeLabel);
          counts.push(bucket.count);
          values.push(bucket.totalValue);
          
          // Determine color based on the middle of the range
          const midPoint = (bucket.min + bucket.max) / 2;
          const range = this.probabilityRanges.find(r => 
            midPoint >= r.min && midPoint <= r.max
          );
          backgroundColors.push(range ? range.color : 'rgba(107, 114, 128, 0.7)');
        }
      });

      // If no data, return empty dataset
      if (counts.length === 0) {
        return { labels: [], datasets: [] };
      }

      return {
        labels,
        datasets: [
          {
            label: 'Number of Deals',
            data: counts,
            backgroundColor: backgroundColors,
            borderColor: '#fff',
            borderWidth: 1,
            yAxisID: 'y',
            order: 2
          },
          {
            label: 'Total Value ($)',
            data: values,
            type: 'line',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            yAxisID: 'y1',
            order: 1
          }
        ]
      };
    } catch (error) {
      logError('Error processing probability distribution data:', error);
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Get chart options specific to the probability distribution chart
   * @returns {Object} - Chart options
   */
  getChartOptions() {
    const baseOptions = super.getChartOptions();
    
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        x: {
          ...baseOptions.scales.x,
          title: {
            display: true,
            text: 'Probability Range',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          ...baseOptions.scales.y,
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Number of Deals',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: true
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Total Value ($)',
            font: {
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: (value) => formatCurrency(value)
          }
        }
      },
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: 'Deal Probability Distribution',
          font: {
            size: 18,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          ...baseOptions.plugins.tooltip,
          callbacks: {
            ...baseOptions.plugins.tooltip.callbacks,
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              
              if (context.datasetIndex === 0) {
                // For count dataset
                return `${label}: ${value} deal${value !== 1 ? 's' : ''}`;
              } else {
                // For value dataset
                return `${label}: ${formatCurrency(value)}`;
              }
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

export default ProbabilityDistributionChart;

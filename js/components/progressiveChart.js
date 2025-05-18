/**
 * progressiveChart.js - Progressive Loading Chart Component
 * Provides a reusable component for displaying large datasets in charts
 * with progressive loading and data aggregation for improved performance
 */

import { progressiveChart } from '../utils/progressiveLoader.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Create a progressive loading chart using Chart.js
 * @param {string|HTMLElement} container - Container element or selector for the chart
 * @param {Object} options - Chart configuration options
 * @returns {Object} - Chart control methods
 */
export function createProgressiveChart(container, options = {}) {
  // Get container element
  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerEl) {
    logError('Progressive chart container not found:', container);
    return null;
  }
  
  const {
    type = 'line',              // Chart type (line, bar, etc.)
    data = [],                  // Chart data
    labels = [],                // X-axis labels
    title = '',                 // Chart title
    xAxisLabel = '',            // X-axis label
    yAxisLabel = '',            // Y-axis label
    colors = [                  // Chart colors
      '#4285F4', '#34A853', '#FBBC05', '#EA4335',
      '#8E24AA', '#D81B60', '#7CB342', '#FB8C00'
    ],
    height = '400px',           // Chart height
    responsive = true,          // Whether chart is responsive
    maintainAspectRatio = false, // Whether to maintain aspect ratio
    legend = true,              // Whether to show legend
    animation = true,           // Whether to animate chart
    tooltips = true,            // Whether to show tooltips
    initialPoints = 100,        // Number of points to show initially
    maxPoints = 1000,           // Maximum number of points to display
    xKey = 'date',              // Key for x-axis values
    yKey = 'value',             // Key for y-axis values
    seriesKey = 'series',       // Key for series name
    onProgress = null,          // Callback for progress updates
    onComplete = null,          // Callback when loading completes
    aggregationMethod = 'average', // Method for data aggregation (average, sum, min, max)
    showLoadingIndicator = true // Whether to show loading indicator
  } = options;
  
  // Ensure Chart.js is available
  if (!window.Chart) {
    logError('Chart.js is required for progressive charts');
    return null;
  }
  
  // Set container style
  containerEl.style.position = 'relative';
  containerEl.style.height = height;
  
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = containerEl.clientWidth;
  canvas.height = containerEl.clientHeight;
  containerEl.appendChild(canvas);
  
  // Custom data aggregation function
  function aggregateData(data, maxPoints) {
    if (data.length <= maxPoints) {
      return data;
    }
    
    // Group data by series if applicable
    const seriesMap = new Map();
    
    // Check if data has series
    const hasSeries = data.some(point => point[seriesKey] !== undefined);
    
    if (hasSeries) {
      // Group by series
      data.forEach(point => {
        const series = point[seriesKey] || 'default';
        
        if (!seriesMap.has(series)) {
          seriesMap.set(series, []);
        }
        
        seriesMap.get(series).push(point);
      });
      
      // Aggregate each series
      const aggregated = [];
      
      seriesMap.forEach((seriesData, series) => {
        const factor = Math.ceil(seriesData.length / maxPoints);
        
        for (let i = 0; i < seriesData.length; i += factor) {
          const chunk = seriesData.slice(i, i + factor);
          
          if (chunk.length === 0) continue;
          
          // Get x value (usually date) from first point in chunk
          const xValue = chunk[0][xKey];
          
          // Aggregate y values based on method
          let yValue;
          
          switch (aggregationMethod) {
            case 'sum':
              yValue = chunk.reduce((sum, point) => sum + Number(point[yKey] || 0), 0);
              break;
            case 'min':
              yValue = Math.min(...chunk.map(point => Number(point[yKey] || 0)));
              break;
            case 'max':
              yValue = Math.max(...chunk.map(point => Number(point[yKey] || 0)));
              break;
            case 'average':
            default:
              const sum = chunk.reduce((sum, point) => sum + Number(point[yKey] || 0), 0);
              yValue = sum / chunk.length;
              break;
          }
          
          aggregated.push({
            ...chunk[0],
            [yKey]: yValue,
            [seriesKey]: series,
            aggregated: true,
            pointCount: chunk.length
          });
        }
      });
      
      return aggregated;
    } else {
      // Simple aggregation without series
      const factor = Math.ceil(data.length / maxPoints);
      const aggregated = [];
      
      for (let i = 0; i < data.length; i += factor) {
        const chunk = data.slice(i, i + factor);
        
        if (chunk.length === 0) continue;
        
        // Get x value (usually date) from first point in chunk
        const xValue = chunk[0][xKey];
        
        // Aggregate y values based on method
        let yValue;
        
        switch (aggregationMethod) {
          case 'sum':
            yValue = chunk.reduce((sum, point) => sum + Number(point[yKey] || 0), 0);
            break;
          case 'min':
            yValue = Math.min(...chunk.map(point => Number(point[yKey] || 0)));
            break;
          case 'max':
            yValue = Math.max(...chunk.map(point => Number(point[yKey] || 0)));
            break;
          case 'average':
          default:
            const sum = chunk.reduce((sum, point) => sum + Number(point[yKey] || 0), 0);
            yValue = sum / chunk.length;
            break;
        }
        
        aggregated.push({
          ...chunk[0],
          [yKey]: yValue,
          aggregated: true,
          pointCount: chunk.length
        });
      }
      
      return aggregated;
    }
  }
  
  // Prepare chart data
  function prepareChartData(data) {
    // Check if data has series
    const hasSeries = data.some(point => point[seriesKey] !== undefined);
    
    if (hasSeries) {
      // Group by series
      const seriesMap = new Map();
      
      data.forEach(point => {
        const series = point[seriesKey] || 'default';
        
        if (!seriesMap.has(series)) {
          seriesMap.set(series, []);
        }
        
        seriesMap.get(series).push(point);
      });
      
      // Create datasets for each series
      const datasets = [];
      let i = 0;
      
      seriesMap.forEach((seriesData, series) => {
        const color = colors[i % colors.length];
        i++;
        
        datasets.push({
          label: series,
          data: seriesData.map(point => ({
            x: point[xKey],
            y: point[yKey]
          })),
          backgroundColor: type === 'line' ? color + '20' : color,
          borderColor: color,
          borderWidth: 2,
          pointRadius: seriesData.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
          fill: type === 'line'
        });
      });
      
      return {
        datasets
      };
    } else {
      // Single dataset
      return {
        labels: data.map(point => point[xKey]),
        datasets: [{
          label: title,
          data: data.map(point => point[yKey]),
          backgroundColor: type === 'line' ? colors[0] + '20' : colors,
          borderColor: type === 'line' ? colors[0] : colors,
          borderWidth: 2,
          pointRadius: data.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
          fill: type === 'line'
        }]
      };
    }
  }
  
  // Create chart renderer function
  function chartRenderer(container, data) {
    const chartData = prepareChartData(data);
    
    // Create chart
    const chart = new Chart(canvas, {
      type,
      data: chartData,
      options: {
        responsive,
        maintainAspectRatio,
        animation: {
          duration: animation ? 500 : 0
        },
        plugins: {
          legend: {
            display: legend
          },
          tooltip: {
            enabled: tooltips
          },
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          x: {
            title: {
              display: !!xAxisLabel,
              text: xAxisLabel
            }
          },
          y: {
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel
            },
            beginAtZero: true
          }
        }
      }
    });
    
    // Add update method
    chart.update = (newData) => {
      const newChartData = prepareChartData(newData);
      
      chart.data.labels = newChartData.labels;
      chart.data.datasets = newChartData.datasets;
      
      chart.update('none'); // Update without animation for performance
    };
    
    return chart;
  }
  
  // Create progressive chart
  const progressiveChartInstance = progressiveChart(containerEl, data, chartRenderer, {
    initialPoints,
    maxPoints,
    aggregationFn: aggregateData,
    xKey,
    yKey,
    onProgress,
    onComplete
  });
  
  // Return public API
  return {
    // Get chart instance
    getChart: () => progressiveChartInstance.getChart(),
    
    // Update data
    updateData: (newData) => {
      progressiveChartInstance.updateData(newData);
    },
    
    // Destroy chart
    destroy: () => {
      progressiveChartInstance.destroy();
    }
  };
}

/**
 * Create a line chart with progressive loading
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Array} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Object} - Chart control methods
 */
export function createLineChart(container, data, options = {}) {
  return createProgressiveChart(container, {
    type: 'line',
    data,
    ...options
  });
}

/**
 * Create a bar chart with progressive loading
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Array} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Object} - Chart control methods
 */
export function createBarChart(container, data, options = {}) {
  return createProgressiveChart(container, {
    type: 'bar',
    data,
    ...options
  });
}

/**
 * Create a pie chart with progressive loading
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Array} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Object} - Chart control methods
 */
export function createPieChart(container, data, options = {}) {
  return createProgressiveChart(container, {
    type: 'pie',
    data,
    ...options
  });
}

/**
 * Create a doughnut chart with progressive loading
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Array} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Object} - Chart control methods
 */
export function createDoughnutChart(container, data, options = {}) {
  return createProgressiveChart(container, {
    type: 'doughnut',
    data,
    ...options
  });
}

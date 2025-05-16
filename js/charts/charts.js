/**
 * charts.js - Charts Module
 * Handles chart initialization, configuration, and updates
 */

import { formatCurrency } from '../utils/uiHelpers.js';
import { logDebug, logError } from '../utils/logger.js';

// Chart instances
const charts = {};

// Chart colors
const enhancedPalette = {
  primary: [
    'rgba(67, 97, 238, 0.8)',
    'rgba(58, 86, 212, 0.8)',
    'rgba(72, 149, 239, 0.8)',
    'rgba(76, 201, 240, 0.8)'
  ],
  stage: {
    "Proposal Sent": "rgba(59, 130, 246, 0.8)",
    "Negotiation": "rgba(245, 158, 11, 0.8)",
    "Verbal Agreement": "rgba(234, 179, 8, 0.8)",
    "Closed Won": "rgba(34, 197, 94, 0.8)",
    "Closed Lost": "rgba(239, 68, 68, 0.7)",
    "default": "rgba(107, 114, 128, 0.7)"
  },
  salesRep: [
    "rgba(59, 130, 246, 0.7)",
    "rgba(16, 185, 129, 0.7)",
    "rgba(249, 115, 22, 0.7)",
    "rgba(139, 92, 246, 0.7)",
    "rgba(236, 72, 153, 0.7)"
  ]
};

/**
 * Initialize charts with data
 * @param {Array} data - The data to use for charts
 */
function initializeCharts(data) {
  if (!data || !data.length) {
    logError('No data provided for charts');
    return;
  }
  
  // Initialize each chart
  initializeForecastByMonthChart(data);
  initializeForecastByStageChart(data);
  initializeForecastBySalesRepChart(data);
  initializeProbabilityDistributionChart(data);
  
  // Make charts responsive
  window.addEventListener('resize', handleChartResize);
  
  logDebug('Charts initialized');
}

/**
 * Initialize Forecast by Month chart
 * @param {Array} data - The data to use for the chart
 */
function initializeForecastByMonthChart(data) {
  const chartCanvas = document.getElementById('forecast-by-month-chart');
  if (!chartCanvas) return;
  
  // Process data for the chart
  const { labels, forecastData, actualData } = processForecastByMonthData(data);
  
  // Create chart
  charts.forecastByMonth = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Forecast',
          data: forecastData,
          backgroundColor: enhancedPalette.primary[0],
          borderColor: enhancedPalette.primary[0],
          borderWidth: 1
        },
        {
          label: 'Actual',
          data: actualData,
          backgroundColor: enhancedPalette.primary[2],
          borderColor: enhancedPalette.primary[2],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        },
        datalabels: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value, 'USD', 0);
            }
          }
        }
      }
    }
  });
}

/**
 * Process data for Forecast by Month chart
 * @param {Array} data - The data to process
 * @returns {Object} - Processed data for the chart
 */
function processForecastByMonthData(data) {
  // Get unique months from the data
  const months = [];
  const monthData = {};
  
  // Get current date for comparison
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Look ahead 6 months
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(currentYear, currentMonth + i, 1);
    const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    months.push(monthKey);
    monthData[monthKey] = {
      label: monthLabel,
      forecast: 0,
      actual: 0
    };
  }
  
  // Process each deal
  data.forEach(deal => {
    if (!deal.expectedCloseDate) return;
    
    const closeDate = new Date(deal.expectedCloseDate);
    const monthKey = `${closeDate.getFullYear()}-${closeDate.getMonth() + 1}`;
    
    // Only include if it's in our range
    if (monthData[monthKey]) {
      // Calculate weighted forecast amount
      const weightedAmount = deal.forecastAmount * deal.probability;
      
      // Add to forecast
      monthData[monthKey].forecast += weightedAmount;
      
      // Add to actual if closed won
      if (deal.dealStage === 'Closed Won') {
        monthData[monthKey].actual += deal.forecastAmount;
      }
    }
  });
  
  // Prepare chart data
  const labels = months.map(month => monthData[month].label);
  const forecastData = months.map(month => monthData[month].forecast);
  const actualData = months.map(month => monthData[month].actual);
  
  return { labels, forecastData, actualData };
}

/**
 * Initialize Forecast by Stage chart
 * @param {Array} data - The data to use for the chart
 */
function initializeForecastByStageChart(data) {
  const chartCanvas = document.getElementById('forecast-by-stage-chart');
  if (!chartCanvas) return;
  
  // Process data for the chart
  const { labels, values, colors } = processForecastByStageData(data);
  
  // Create chart
  charts.forecastByStage = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: 'white',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        },
        datalabels: {
          color: 'white',
          font: {
            weight: 'bold'
          },
          formatter: function(value, context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return percentage + '%';
          }
        },
        doughnutlabel: {
          labels: [
            {
              text: 'Total',
              font: {
                size: '14px',
                family: 'Inter',
                weight: 'normal'
              },
              color: '#6b7280'
            },
            {
              text: formatCurrency(values.reduce((a, b) => a + b, 0)),
              font: {
                size: '20px',
                family: 'Inter',
                weight: 'bold'
              },
              color: '#1f2937'
            }
          ]
        }
      }
    }
  });
}

/**
 * Process data for Forecast by Stage chart
 * @param {Array} data - The data to process
 * @returns {Object} - Processed data for the chart
 */
function processForecastByStageData(data) {
  // Group by deal stage
  const stageData = {};
  
  // Process each deal
  data.forEach(deal => {
    const stage = deal.dealStage || 'Unknown';
    
    if (!stageData[stage]) {
      stageData[stage] = 0;
    }
    
    // Add weighted amount
    stageData[stage] += deal.forecastAmount * deal.probability;
  });
  
  // Prepare chart data
  const labels = Object.keys(stageData);
  const values = Object.values(stageData);
  const colors = labels.map(stage => enhancedPalette.stage[stage] || enhancedPalette.stage.default);
  
  return { labels, values, colors };
}

/**
 * Initialize Forecast by Sales Rep chart
 * @param {Array} data - The data to use for the chart
 */
function initializeForecastBySalesRepChart(data) {
  const chartCanvas = document.getElementById('forecast-by-rep-chart');
  if (!chartCanvas) return;
  
  // Process data for the chart
  const { labels, values, colors } = processForecastBySalesRepData(data);
  
  // Create chart
  charts.forecastBySalesRep = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Forecast Amount',
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Forecast: ${formatCurrency(context.raw)}`;
            }
          }
        },
        datalabels: {
          align: 'end',
          anchor: 'end',
          formatter: function(value) {
            return formatCurrency(value, 'USD', 0);
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value, 'USD', 0);
            }
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Process data for Forecast by Sales Rep chart
 * @param {Array} data - The data to process
 * @returns {Object} - Processed data for the chart
 */
function processForecastBySalesRepData(data) {
  // Group by sales rep
  const repData = {};
  
  // Process each deal
  data.forEach(deal => {
    const rep = deal.salesRep || 'Unknown';
    
    if (!repData[rep]) {
      repData[rep] = 0;
    }
    
    // Add weighted amount
    repData[rep] += deal.forecastAmount * deal.probability;
  });
  
  // Sort by amount descending
  const sortedReps = Object.keys(repData).sort((a, b) => repData[b] - repData[a]);
  
  // Prepare chart data
  const labels = sortedReps;
  const values = sortedReps.map(rep => repData[rep]);
  const colors = sortedReps.map((_, index) => enhancedPalette.salesRep[index % enhancedPalette.salesRep.length]);
  
  return { labels, values, colors };
}

/**
 * Initialize Probability Distribution chart
 * @param {Array} data - The data to use for the chart
 */
function initializeProbabilityDistributionChart(data) {
  const chartCanvas = document.getElementById('probability-distribution-chart');
  if (!chartCanvas) return;
  
  // Process data for the chart
  const { labels, values, colors } = processProbabilityDistributionData(data);
  
  // Create chart
  charts.probabilityDistribution = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: 'white',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value} deals (${percentage}%)`;
            }
          }
        },
        datalabels: {
          color: 'white',
          font: {
            weight: 'bold'
          },
          formatter: function(value, context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return percentage + '%';
          }
        }
      }
    }
  });
}

/**
 * Process data for Probability Distribution chart
 * @param {Array} data - The data to process
 * @returns {Object} - Processed data for the chart
 */
function processProbabilityDistributionData(data) {
  // Define probability ranges
  const ranges = [
    { min: 0, max: 0.25, label: '0-25%', color: 'rgba(239, 68, 68, 0.7)' },
    { min: 0.25, max: 0.5, label: '25-50%', color: 'rgba(245, 158, 11, 0.7)' },
    { min: 0.5, max: 0.75, label: '50-75%', color: 'rgba(59, 130, 246, 0.7)' },
    { min: 0.75, max: 1, label: '75-100%', color: 'rgba(34, 197, 94, 0.7)' }
  ];
  
  // Count deals in each range
  const rangeCounts = ranges.map(() => 0);
  
  // Process each deal
  data.forEach(deal => {
    const probability = deal.probability || 0;
    
    // Find which range this probability falls into
    for (let i = 0; i < ranges.length; i++) {
      if (probability > ranges[i].min && probability <= ranges[i].max) {
        rangeCounts[i]++;
        break;
      }
    }
  });
  
  // Prepare chart data
  const labels = ranges.map(range => range.label);
  const values = rangeCounts;
  const colors = ranges.map(range => range.color);
  
  return { labels, values, colors };
}

/**
 * Update charts with new data
 * @param {Array} data - The new data to update charts with
 */
function updateCharts(data) {
  if (!data || !data.length) {
    logError('No data provided for chart updates');
    return;
  }
  
  // Update each chart
  updateForecastByMonthChart(data);
  updateForecastByStageChart(data);
  updateForecastBySalesRepChart(data);
  updateProbabilityDistributionChart(data);
  
  logDebug('Charts updated');
}

/**
 * Update Forecast by Month chart
 * @param {Array} data - The data to use for the chart
 */
function updateForecastByMonthChart(data) {
  if (!charts.forecastByMonth) return;
  
  const { labels, forecastData, actualData } = processForecastByMonthData(data);
  
  charts.forecastByMonth.data.labels = labels;
  charts.forecastByMonth.data.datasets[0].data = forecastData;
  charts.forecastByMonth.data.datasets[1].data = actualData;
  charts.forecastByMonth.update();
}

/**
 * Update Forecast by Stage chart
 * @param {Array} data - The data to use for the chart
 */
function updateForecastByStageChart(data) {
  if (!charts.forecastByStage) return;
  
  const { labels, values, colors } = processForecastByStageData(data);
  
  charts.forecastByStage.data.labels = labels;
  charts.forecastByStage.data.datasets[0].data = values;
  charts.forecastByStage.data.datasets[0].backgroundColor = colors;
  charts.forecastByStage.update();
}

/**
 * Update Forecast by Sales Rep chart
 * @param {Array} data - The data to use for the chart
 */
function updateForecastBySalesRepChart(data) {
  if (!charts.forecastBySalesRep) return;
  
  const { labels, values, colors } = processForecastBySalesRepData(data);
  
  charts.forecastBySalesRep.data.labels = labels;
  charts.forecastBySalesRep.data.datasets[0].data = values;
  charts.forecastBySalesRep.data.datasets[0].backgroundColor = colors;
  charts.forecastBySalesRep.data.datasets[0].borderColor = colors;
  charts.forecastBySalesRep.update();
}

/**
 * Update Probability Distribution chart
 * @param {Array} data - The data to use for the chart
 */
function updateProbabilityDistributionChart(data) {
  if (!charts.probabilityDistribution) return;
  
  const { labels, values, colors } = processProbabilityDistributionData(data);
  
  charts.probabilityDistribution.data.labels = labels;
  charts.probabilityDistribution.data.datasets[0].data = values;
  charts.probabilityDistribution.data.datasets[0].backgroundColor = colors;
  charts.probabilityDistribution.update();
}

/**
 * Handle chart resize
 */
function handleChartResize() {
  // Resize all charts
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  });
}

// Export functions and variables
export {
  initializeCharts,
  updateCharts,
  charts,
  enhancedPalette
};

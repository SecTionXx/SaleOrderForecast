/**
 * advancedForecasting.js - Advanced Forecasting Module
 * Implements trend analysis, predictive forecasting, and what-if scenario modeling
 */

import { formatCurrency } from '../utils/uiHelpers.js';
import { logDebug, logError } from '../utils/logger.js';

/**
 * Initialize advanced forecasting features
 * @param {Array} historicalData - Historical deal data for analysis
 */
function initializeAdvancedForecasting(historicalData) {
  if (!historicalData || !historicalData.length) {
    logError('No historical data provided for advanced forecasting');
    return;
  }
  
  // Initialize UI components
  initializeTrendAnalysis();
  initializePredictiveForecasting();
  initializeScenarioModeling();
  
  // Perform initial analysis
  performTrendAnalysis(historicalData);
  
  logDebug('Advanced forecasting initialized');
}

/**
 * Initialize trend analysis UI
 */
function initializeTrendAnalysis() {
  const trendAnalysisContainer = document.getElementById('trend-analysis-container');
  if (!trendAnalysisContainer) return;
  
  // Create trend analysis chart
  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'trend-analysis-chart';
  trendAnalysisContainer.appendChild(chartCanvas);
  
  // Create trend metrics container
  const metricsContainer = document.createElement('div');
  metricsContainer.className = 'trend-metrics';
  metricsContainer.innerHTML = `
    <div class="metric-card">
      <h4>Growth Rate</h4>
      <p id="growth-rate-value">--</p>
    </div>
    <div class="metric-card">
      <h4>Seasonality</h4>
      <p id="seasonality-value">--</p>
    </div>
    <div class="metric-card">
      <h4>Forecast Accuracy</h4>
      <p id="forecast-accuracy-value">--</p>
    </div>
  `;
  trendAnalysisContainer.appendChild(metricsContainer);
}

/**
 * Initialize predictive forecasting UI
 */
function initializePredictiveForecasting() {
  const predictiveContainer = document.getElementById('predictive-forecasting-container');
  if (!predictiveContainer) return;
  
  // Create predictive forecasting chart
  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'predictive-forecasting-chart';
  predictiveContainer.appendChild(chartCanvas);
  
  // Create forecast period selector
  const periodSelector = document.createElement('div');
  periodSelector.className = 'forecast-period-selector';
  periodSelector.innerHTML = `
    <label for="forecast-period">Forecast Period:</label>
    <select id="forecast-period">
      <option value="3">3 Months</option>
      <option value="6" selected>6 Months</option>
      <option value="12">12 Months</option>
    </select>
  `;
  predictiveContainer.appendChild(periodSelector);
  
  // Add event listener for period change
  const periodSelect = periodSelector.querySelector('#forecast-period');
  if (periodSelect) {
    periodSelect.addEventListener('change', () => {
      const period = parseInt(periodSelect.value, 10);
      updatePredictiveForecasting(period);
    });
  }
}

/**
 * Initialize scenario modeling UI
 */
function initializeScenarioModeling() {
  const scenarioContainer = document.getElementById('scenario-modeling-container');
  if (!scenarioContainer) return;
  
  // Create scenario modeling UI
  scenarioContainer.innerHTML = `
    <div class="scenario-controls">
      <div class="scenario-form">
        <h4>What-If Scenario Parameters</h4>
        <div class="form-group">
          <label for="win-rate-adjustment">Win Rate Adjustment:</label>
          <input type="range" id="win-rate-adjustment" min="-50" max="50" value="0" step="5">
          <span id="win-rate-value">0%</span>
        </div>
        <div class="form-group">
          <label for="deal-size-adjustment">Deal Size Adjustment:</label>
          <input type="range" id="deal-size-adjustment" min="-50" max="50" value="0" step="5">
          <span id="deal-size-value">0%</span>
        </div>
        <div class="form-group">
          <label for="sales-cycle-adjustment">Sales Cycle Adjustment:</label>
          <input type="range" id="sales-cycle-adjustment" min="-50" max="50" value="0" step="5">
          <span id="sales-cycle-value">0%</span>
        </div>
        <button id="apply-scenario" class="btn btn-primary">Apply Scenario</button>
        <button id="reset-scenario" class="btn btn-secondary">Reset</button>
      </div>
      <div class="scenario-summary">
        <h4>Scenario Impact</h4>
        <div class="impact-metrics">
          <div class="metric-card">
            <h5>Forecast Change</h5>
            <p id="forecast-change-value">--</p>
          </div>
          <div class="metric-card">
            <h5>Time to Target</h5>
            <p id="time-to-target-value">--</p>
          </div>
          <div class="metric-card">
            <h5>Risk Level</h5>
            <p id="risk-level-value">--</p>
          </div>
        </div>
      </div>
    </div>
    <div class="scenario-chart-container">
      <canvas id="scenario-chart"></canvas>
    </div>
  `;
  
  // Add event listeners for scenario controls
  const winRateSlider = document.getElementById('win-rate-adjustment');
  const dealSizeSlider = document.getElementById('deal-size-adjustment');
  const salesCycleSlider = document.getElementById('sales-cycle-adjustment');
  
  if (winRateSlider) {
    winRateSlider.addEventListener('input', () => {
      document.getElementById('win-rate-value').textContent = `${winRateSlider.value}%`;
    });
  }
  
  if (dealSizeSlider) {
    dealSizeSlider.addEventListener('input', () => {
      document.getElementById('deal-size-value').textContent = `${dealSizeSlider.value}%`;
    });
  }
  
  if (salesCycleSlider) {
    salesCycleSlider.addEventListener('input', () => {
      document.getElementById('sales-cycle-value').textContent = `${salesCycleSlider.value}%`;
    });
  }
  
  // Apply scenario button
  const applyButton = document.getElementById('apply-scenario');
  if (applyButton) {
    applyButton.addEventListener('click', applyScenario);
  }
  
  // Reset scenario button
  const resetButton = document.getElementById('reset-scenario');
  if (resetButton) {
    resetButton.addEventListener('click', resetScenario);
  }
}

/**
 * Perform trend analysis on historical data
 * @param {Array} historicalData - Historical deal data for analysis
 */
function performTrendAnalysis(historicalData) {
  // Group data by month
  const monthlyData = groupDataByMonth(historicalData);
  
  // Calculate growth rate
  const growthRate = calculateGrowthRate(monthlyData);
  
  // Calculate seasonality
  const seasonality = detectSeasonality(monthlyData);
  
  // Calculate forecast accuracy
  const forecastAccuracy = calculateForecastAccuracy(historicalData);
  
  // Update UI with metrics
  updateTrendMetrics(growthRate, seasonality, forecastAccuracy);
  
  // Create trend analysis chart
  createTrendAnalysisChart(monthlyData);
}

/**
 * Group data by month
 * @param {Array} data - Deal data
 * @returns {Object} - Data grouped by month
 */
function groupDataByMonth(data) {
  const monthlyData = {};
  
  data.forEach(deal => {
    if (!deal.expectedCloseDate) return;
    
    const closeDate = new Date(deal.expectedCloseDate);
    const monthKey = `${closeDate.getFullYear()}-${closeDate.getMonth() + 1}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: new Date(closeDate.getFullYear(), closeDate.getMonth(), 1),
        totalAmount: 0,
        weightedAmount: 0,
        dealCount: 0,
        wonAmount: 0,
        wonCount: 0
      };
    }
    
    monthlyData[monthKey].totalAmount += deal.forecastAmount || 0;
    monthlyData[monthKey].weightedAmount += (deal.forecastAmount || 0) * (deal.probability || 0);
    monthlyData[monthKey].dealCount += 1;
    
    if (deal.dealStage === 'Closed Won') {
      monthlyData[monthKey].wonAmount += deal.forecastAmount || 0;
      monthlyData[monthKey].wonCount += 1;
    }
  });
  
  // Convert to array sorted by month
  return Object.values(monthlyData).sort((a, b) => a.month - b.month);
}

/**
 * Calculate growth rate from monthly data
 * @param {Array} monthlyData - Data grouped by month
 * @returns {number} - Growth rate percentage
 */
function calculateGrowthRate(monthlyData) {
  if (monthlyData.length < 2) return 0;
  
  // Calculate average month-over-month growth
  let totalGrowth = 0;
  let growthPoints = 0;
  
  for (let i = 1; i < monthlyData.length; i++) {
    const prevMonth = monthlyData[i - 1];
    const currentMonth = monthlyData[i];
    
    if (prevMonth.weightedAmount > 0) {
      const monthGrowth = (currentMonth.weightedAmount - prevMonth.weightedAmount) / prevMonth.weightedAmount;
      totalGrowth += monthGrowth;
      growthPoints++;
    }
  }
  
  // Calculate average growth rate
  const averageGrowth = growthPoints > 0 ? totalGrowth / growthPoints : 0;
  
  // Convert to percentage
  return averageGrowth * 100;
}

/**
 * Detect seasonality in monthly data
 * @param {Array} monthlyData - Data grouped by month
 * @returns {Object} - Seasonality information
 */
function detectSeasonality(monthlyData) {
  if (monthlyData.length < 12) {
    return { detected: false, pattern: 'Insufficient data' };
  }
  
  // Simple seasonality detection (this would be more sophisticated in a real implementation)
  const monthlyAverages = Array(12).fill(0);
  const monthCounts = Array(12).fill(0);
  
  // Calculate average for each month
  monthlyData.forEach(data => {
    const month = data.month.getMonth();
    monthlyAverages[month] += data.weightedAmount;
    monthCounts[month]++;
  });
  
  // Calculate average for each month
  for (let i = 0; i < 12; i++) {
    if (monthCounts[i] > 0) {
      monthlyAverages[i] /= monthCounts[i];
    }
  }
  
  // Find highest and lowest months
  let highestMonth = 0;
  let lowestMonth = 0;
  
  for (let i = 1; i < 12; i++) {
    if (monthlyAverages[i] > monthlyAverages[highestMonth]) {
      highestMonth = i;
    }
    if (monthlyAverages[i] < monthlyAverages[lowestMonth]) {
      lowestMonth = i;
    }
  }
  
  // Get month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    detected: true,
    highestMonth: monthNames[highestMonth],
    lowestMonth: monthNames[lowestMonth],
    pattern: 'Annual'
  };
}

/**
 * Calculate forecast accuracy based on historical data
 * @param {Array} historicalData - Historical deal data
 * @returns {number} - Forecast accuracy percentage
 */
function calculateForecastAccuracy(historicalData) {
  // Filter to only include deals with both forecast and actual values
  const closedDeals = historicalData.filter(deal => 
    deal.dealStage === 'Closed Won' || deal.dealStage === 'Closed Lost'
  );
  
  if (closedDeals.length === 0) return 0;
  
  let totalAccuracy = 0;
  
  closedDeals.forEach(deal => {
    const forecastAmount = deal.forecastAmount * deal.probability;
    const actualAmount = deal.dealStage === 'Closed Won' ? deal.forecastAmount : 0;
    
    // Calculate accuracy for this deal
    let accuracy = 0;
    if (forecastAmount === 0 && actualAmount === 0) {
      accuracy = 100; // Both zero is perfect accuracy
    } else if (forecastAmount === 0) {
      accuracy = 0; // Forecast zero but had actual value
    } else {
      // Calculate percentage accuracy
      accuracy = 100 - Math.min(100, Math.abs((forecastAmount - actualAmount) / forecastAmount * 100));
    }
    
    totalAccuracy += accuracy;
  });
  
  // Calculate average accuracy
  return totalAccuracy / closedDeals.length;
}

/**
 * Update trend metrics in the UI
 * @param {number} growthRate - Growth rate percentage
 * @param {Object} seasonality - Seasonality information
 * @param {number} forecastAccuracy - Forecast accuracy percentage
 */
function updateTrendMetrics(growthRate, seasonality, forecastAccuracy) {
  // Update growth rate
  const growthRateElement = document.getElementById('growth-rate-value');
  if (growthRateElement) {
    const formattedGrowthRate = growthRate.toFixed(1);
    const growthClass = growthRate >= 0 ? 'positive' : 'negative';
    growthRateElement.innerHTML = `<span class="${growthClass}">${formattedGrowthRate}%</span>`;
  }
  
  // Update seasonality
  const seasonalityElement = document.getElementById('seasonality-value');
  if (seasonalityElement) {
    if (seasonality.detected) {
      seasonalityElement.textContent = `${seasonality.pattern} (Peak: ${seasonality.highestMonth})`;
    } else {
      seasonalityElement.textContent = seasonality.pattern;
    }
  }
  
  // Update forecast accuracy
  const accuracyElement = document.getElementById('forecast-accuracy-value');
  if (accuracyElement) {
    accuracyElement.textContent = `${forecastAccuracy.toFixed(1)}%`;
  }
}

/**
 * Create trend analysis chart
 * @param {Array} monthlyData - Data grouped by month
 */
function createTrendAnalysisChart(monthlyData) {
  const chartCanvas = document.getElementById('trend-analysis-chart');
  if (!chartCanvas) return;
  
  // Prepare data for chart
  const labels = monthlyData.map(data => {
    const month = data.month;
    return month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });
  
  const forecastData = monthlyData.map(data => data.weightedAmount);
  const actualData = monthlyData.map(data => data.wonAmount);
  
  // Calculate trend line using linear regression
  const trendData = calculateTrendLine(monthlyData);
  
  // Create chart
  const trendChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Weighted Forecast',
          data: forecastData,
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderColor: 'rgba(67, 97, 238, 0.8)',
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Actual',
          data: actualData,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 0.8)',
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Trend',
          data: trendData,
          borderColor: 'rgba(239, 68, 68, 0.8)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
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
 * Calculate trend line using linear regression
 * @param {Array} monthlyData - Data grouped by month
 * @returns {Array} - Trend line data points
 */
function calculateTrendLine(monthlyData) {
  if (monthlyData.length < 2) return [];
  
  // Extract x (time) and y (weighted amount) values
  const xValues = monthlyData.map((_, index) => index);
  const yValues = monthlyData.map(data => data.weightedAmount);
  
  // Calculate linear regression
  const n = xValues.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumXX += xValues[i] * xValues[i];
  }
  
  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate trend line data points
  return xValues.map(x => slope * x + intercept);
}

/**
 * Update predictive forecasting with new period
 * @param {number} period - Forecast period in months
 */
function updatePredictiveForecasting(period) {
  // This would be implemented with actual forecasting algorithms
  logDebug(`Updating predictive forecast for ${period} months`);
  
  // For now, just show a placeholder message
  const predictiveContainer = document.getElementById('predictive-forecasting-container');
  if (predictiveContainer) {
    const messageElement = predictiveContainer.querySelector('.forecast-message') || document.createElement('div');
    messageElement.className = 'forecast-message';
    messageElement.textContent = `Forecasting for ${period} months ahead is being calculated...`;
    
    if (!predictiveContainer.querySelector('.forecast-message')) {
      predictiveContainer.appendChild(messageElement);
    }
  }
}

/**
 * Apply what-if scenario
 */
function applyScenario() {
  // Get scenario parameters
  const winRateAdjustment = parseInt(document.getElementById('win-rate-adjustment').value, 10) || 0;
  const dealSizeAdjustment = parseInt(document.getElementById('deal-size-adjustment').value, 10) || 0;
  const salesCycleAdjustment = parseInt(document.getElementById('sales-cycle-adjustment').value, 10) || 0;
  
  // Calculate impact (this would be more sophisticated in a real implementation)
  const forecastChange = calculateForecastChange(winRateAdjustment, dealSizeAdjustment);
  const timeToTarget = calculateTimeToTarget(salesCycleAdjustment);
  const riskLevel = calculateRiskLevel(winRateAdjustment, dealSizeAdjustment, salesCycleAdjustment);
  
  // Update UI
  updateScenarioImpact(forecastChange, timeToTarget, riskLevel);
  
  // Update scenario chart
  updateScenarioChart(winRateAdjustment, dealSizeAdjustment, salesCycleAdjustment);
  
  logDebug('Scenario applied', { winRateAdjustment, dealSizeAdjustment, salesCycleAdjustment });
}

/**
 * Calculate forecast change based on scenario parameters
 * @param {number} winRateAdjustment - Win rate adjustment percentage
 * @param {number} dealSizeAdjustment - Deal size adjustment percentage
 * @returns {number} - Forecast change percentage
 */
function calculateForecastChange(winRateAdjustment, dealSizeAdjustment) {
  // Simple calculation for demonstration
  // In a real implementation, this would use more sophisticated models
  const winRateImpact = winRateAdjustment * 0.7; // Win rate has 70% weight
  const dealSizeImpact = dealSizeAdjustment * 0.3; // Deal size has 30% weight
  
  return winRateImpact + dealSizeImpact;
}

/**
 * Calculate time to target based on sales cycle adjustment
 * @param {number} salesCycleAdjustment - Sales cycle adjustment percentage
 * @returns {number} - Time to target change in days
 */
function calculateTimeToTarget(salesCycleAdjustment) {
  // Assume average sales cycle is 60 days
  const averageSalesCycle = 60;
  
  // Calculate impact on sales cycle
  return Math.round(averageSalesCycle * salesCycleAdjustment / 100);
}

/**
 * Calculate risk level based on scenario parameters
 * @param {number} winRateAdjustment - Win rate adjustment percentage
 * @param {number} dealSizeAdjustment - Deal size adjustment percentage
 * @param {number} salesCycleAdjustment - Sales cycle adjustment percentage
 * @returns {string} - Risk level (Low, Medium, High)
 */
function calculateRiskLevel(winRateAdjustment, dealSizeAdjustment, salesCycleAdjustment) {
  // Calculate risk score
  const riskScore = Math.abs(winRateAdjustment) * 0.4 + 
                    Math.abs(dealSizeAdjustment) * 0.3 + 
                    Math.abs(salesCycleAdjustment) * 0.3;
  
  // Determine risk level
  if (riskScore < 10) {
    return 'Low';
  } else if (riskScore < 25) {
    return 'Medium';
  } else {
    return 'High';
  }
}

/**
 * Update scenario impact in the UI
 * @param {number} forecastChange - Forecast change percentage
 * @param {number} timeToTarget - Time to target change in days
 * @param {string} riskLevel - Risk level
 */
function updateScenarioImpact(forecastChange, timeToTarget, riskLevel) {
  // Update forecast change
  const forecastChangeElement = document.getElementById('forecast-change-value');
  if (forecastChangeElement) {
    const changeClass = forecastChange >= 0 ? 'positive' : 'negative';
    forecastChangeElement.innerHTML = `<span class="${changeClass}">${forecastChange.toFixed(1)}%</span>`;
  }
  
  // Update time to target
  const timeToTargetElement = document.getElementById('time-to-target-value');
  if (timeToTargetElement) {
    const timeClass = timeToTarget <= 0 ? 'positive' : 'negative';
    const sign = timeToTarget <= 0 ? '-' : '+';
    timeToTargetElement.innerHTML = `<span class="${timeClass}">${sign}${Math.abs(timeToTarget)} days</span>`;
  }
  
  // Update risk level
  const riskLevelElement = document.getElementById('risk-level-value');
  if (riskLevelElement) {
    let riskClass = '';
    switch (riskLevel) {
      case 'Low':
        riskClass = 'low-risk';
        break;
      case 'Medium':
        riskClass = 'medium-risk';
        break;
      case 'High':
        riskClass = 'high-risk';
        break;
    }
    
    riskLevelElement.innerHTML = `<span class="${riskClass}">${riskLevel}</span>`;
  }
}

/**
 * Update scenario chart
 * @param {number} winRateAdjustment - Win rate adjustment percentage
 * @param {number} dealSizeAdjustment - Deal size adjustment percentage
 * @param {number} salesCycleAdjustment - Sales cycle adjustment percentage
 */
function updateScenarioChart(winRateAdjustment, dealSizeAdjustment, salesCycleAdjustment) {
  const chartCanvas = document.getElementById('scenario-chart');
  if (!chartCanvas) return;
  
  // Generate forecast data
  const months = 6; // Forecast for 6 months
  const labels = [];
  const baselineData = [];
  const scenarioData = [];
  
  // Generate labels and baseline data
  const currentDate = new Date();
  for (let i = 0; i < months; i++) {
    const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    labels.push(forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Generate some baseline data (this would be real forecast data in a real implementation)
    const baseValue = 500000 + (i * 50000) + (Math.random() * 100000);
    baselineData.push(baseValue);
    
    // Apply scenario adjustments
    const winRateImpact = baseValue * (winRateAdjustment / 100);
    const dealSizeImpact = baseValue * (dealSizeAdjustment / 100);
    const salesCycleImpact = baseValue * (salesCycleAdjustment / -200); // Negative sales cycle is positive for forecast
    
    scenarioData.push(baseValue + winRateImpact + dealSizeImpact + salesCycleImpact);
  }
  
  // Create or update chart
  if (window.scenarioChart) {
    window.scenarioChart.data.labels = labels;
    window.scenarioChart.data.datasets[0].data = baselineData;
    window.scenarioChart.data.datasets[1].data = scenarioData;
    window.scenarioChart.update();
  } else {
    window.scenarioChart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Baseline Forecast',
            data: baselineData,
            borderColor: 'rgba(107, 114, 128, 0.8)',
            backgroundColor: 'rgba(107, 114, 128, 0.2)',
            borderWidth: 2,
            fill: true
          },
          {
            label: 'Scenario Forecast',
            data: scenarioData,
            borderColor: 'rgba(67, 97, 238, 0.8)',
            backgroundColor: 'rgba(67, 97, 238, 0.2)',
            borderWidth: 2,
            fill: true
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
}

/**
 * Reset scenario to default values
 */
function resetScenario() {
  // Reset sliders
  document.getElementById('win-rate-adjustment').value = 0;
  document.getElementById('deal-size-adjustment').value = 0;
  document.getElementById('sales-cycle-adjustment').value = 0;
  
  // Reset displayed values
  document.getElementById('win-rate-value').textContent = '0%';
  document.getElementById('deal-size-value').textContent = '0%';
  document.getElementById('sales-cycle-value').textContent = '0%';
  
  // Apply reset scenario
  applyScenario();
  
  logDebug('Scenario reset');
}

// Export functions
export {
  initializeAdvancedForecasting,
  performTrendAnalysis,
  updatePredictiveForecasting,
  applyScenario,
  resetScenario
};

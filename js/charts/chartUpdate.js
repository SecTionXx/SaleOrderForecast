/**
 * chartUpdate.js - Chart Update Module
 * Handles updating charts with new data
 */

import { charts, enhancedPalette } from './charts.js';
import { adaptiveChartOptimization } from './chartOptimization.js';
import { logDebug } from '../utils/logger.js';

/**
 * Update all charts with new data
 * @param {Array} filteredData - The filtered data to update charts with
 */
function updateCharts(filteredData) {
  if (!filteredData || !Array.isArray(filteredData)) {
    logDebug('No data provided for chart updates');
    return;
  }
  
  logDebug(`Updating charts with ${filteredData.length} data points`);
  
  // Apply adaptive chart optimization based on dataset size and device capabilities
  adaptiveChartOptimization(charts, filteredData);
  
  // Update individual charts
  updateForecastByMonthChart(filteredData);
  updateDealStageChart(filteredData);
  updateSalesRepChart(filteredData);
  updateProbabilityDistributionChart(filteredData);
  
  logDebug('Charts updated successfully');
}

/**
 * Update the Forecast by Month chart
 * @param {Array} filteredData - The filtered data to update the chart with
 */
function updateForecastByMonthChart(filteredData) {
  if (!charts.forecastByMonthChart) return;
  
  // Group by month (YYYY-MM), sum weightedValue and actual closed value
  const monthMap = {};

  // Ensure we cover at least 6 months for better visualization
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    monthMap[monthKey] = { forecast: 0, actual: 0 };
  }

  filteredData.forEach((deal) => {
    let month = "";
    if (
      deal.expectedCloseDate instanceof Date &&
      !isNaN(deal.expectedCloseDate.getTime())
    ) {
      month = deal.expectedCloseDate.toISOString().slice(0, 7);
    } else if (
      typeof deal.expectedCloseDate === "string" &&
      deal.expectedCloseDate.length >= 7
    ) {
      month = deal.expectedCloseDate.slice(0, 7);
    }
    if (!month) return;
    if (!monthMap[month]) monthMap[month] = { forecast: 0, actual: 0 };
    monthMap[month].forecast += deal.weightedValue || 0;
    if ((deal.dealStage || "").toLowerCase() === "closed won") {
      monthMap[month].actual += deal.totalValue || 0; // Use actual value for closed deals
    }
  });

  // Sort months for proper timeline display
  const months = Object.keys(monthMap).sort();

  charts.forecastByMonthChart.data.labels = months;
  charts.forecastByMonthChart.data.datasets = [
    {
      label: "Weighted Forecast",
      data: months.map((m) => monthMap[m].forecast),
      backgroundColor: enhancedPalette.primary[0],
      borderRadius: 6,
      barPercentage: 0.7,
      order: 2, // Draw bars below the line
    },
    {
      label: "Actual Closed",
      data: months.map((m) => monthMap[m].actual),
      type: "line",
      borderColor: enhancedPalette.stage["Closed Won"],
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      fill: false,
      tension: 0.2,
      borderWidth: 3,
      pointBackgroundColor: enhancedPalette.stage["Closed Won"],
      pointRadius: 5,
      pointHoverRadius: 7,
      order: 1, // Draw line above the bars
    },
  ];

  charts.forecastByMonthChart.update();
}

/**
 * Update the Deal Stage chart
 * @param {Array} filteredData - The filtered data to update the chart with
 */
function updateDealStageChart(filteredData) {
  if (!charts.dealStageChart) return;
  
  const stageMap = {};
  let totalDeals = 0;

  // Define stage order for consistent coloring
  const stageOrder = [
    "Proposal Sent",
    "Negotiation",
    "Verbal Agreement",
    "Closed Won",
    "Closed Lost",
    "Lead",
  ];

  // Initialize all standard stages with 0 to ensure they appear even if no deals
  stageOrder.forEach((stage) => {
    stageMap[stage] = 0;
  });

  // Count deals by stage
  filteredData.forEach((deal) => {
    const stage = deal.dealStage || "Unknown";
    stageMap[stage] = (stageMap[stage] || 0) + 1;
    totalDeals++;
  });

  // Get stages in the right order: first defined stages, then other stages
  const orderedStages = [
    ...stageOrder.filter((s) => stageMap[s] > 0),
    ...Object.keys(stageMap).filter(
      (s) => !stageOrder.includes(s) && stageMap[s] > 0
    ),
  ];

  // Map colors to stages
  const stageColors = orderedStages.map(
    (stage) => enhancedPalette.stage[stage] || enhancedPalette.stage.default
  );

  charts.dealStageChart.data.labels = orderedStages;
  charts.dealStageChart.data.datasets = [
    {
      label: "Deal Stage",
      data: orderedStages.map((s) => stageMap[s]),
      backgroundColor: stageColors,
      borderWidth: 2,
      borderColor: "#ffffff",
    },
  ];

  // Update the center label text if using doughnut label plugin
  if (charts.dealStageChart.options.plugins.doughnutlabel?.labels) {
    charts.dealStageChart.options.plugins.doughnutlabel.labels[1].text =
      totalDeals.toString(); // Update the second label (the number)
  }

  charts.dealStageChart.update();
}

/**
 * Update the Sales Rep chart
 * @param {Array} filteredData - The filtered data to update the chart with
 */
function updateSalesRepChart(filteredData) {
  if (!charts.salesRepChart) return;
  
  const repMap = {};

  // Add all sales reps with their total weighted value
  filteredData.forEach((deal) => {
    const rep = deal.salesRep || "Unknown";
    repMap[rep] = (repMap[rep] || 0) + (deal.weightedValue || 0);
  });

  // Sort sales reps by value for better visualization (desc)
  const sortedReps = Object.keys(repMap).sort((a, b) => repMap[b] - repMap[a]);

  // Create an array of colors for reps
  const repColors = sortedReps.map((rep, index) => {
    // Cycle through color palette
    return enhancedPalette.salesRep[index % enhancedPalette.salesRep.length];
  });

  charts.salesRepChart.data.labels = sortedReps;
  charts.salesRepChart.data.datasets = [
    {
      label: "Weighted Value",
      data: sortedReps.map((r) => repMap[r]),
      backgroundColor: repColors,
      borderRadius: 6,
      borderSkipped: false,
    },
  ];

  charts.salesRepChart.update();
}

/**
 * Update the Probability Distribution chart
 * @param {Array} filteredData - The filtered data to update the chart with
 */
function updateProbabilityDistributionChart(filteredData) {
  if (!charts.probabilityDistributionChart) return;
  
  // Group deals by probability ranges
  const probabilityRanges = {
    "0-20%": 0,
    "21-40%": 0,
    "41-60%": 0,
    "61-80%": 0,
    "81-100%": 0,
  };

  // Count deals in each probability range
  filteredData.forEach((deal) => {
    const probability = deal.probability || 0;
    
    if (probability <= 20) {
      probabilityRanges["0-20%"]++;
    } else if (probability <= 40) {
      probabilityRanges["21-40%"]++;
    } else if (probability <= 60) {
      probabilityRanges["41-60%"]++;
    } else if (probability <= 80) {
      probabilityRanges["61-80%"]++;
    } else {
      probabilityRanges["81-100%"]++;
    }
  });

  // Update chart data
  charts.probabilityDistributionChart.data.labels = Object.keys(probabilityRanges);
  charts.probabilityDistributionChart.data.datasets = [
    {
      label: "Number of Deals",
      data: Object.values(probabilityRanges),
      backgroundColor: enhancedPalette.primary,
      borderWidth: 1,
      borderColor: "#ffffff",
    },
  ];

  charts.probabilityDistributionChart.update();
}

// Export functions
export {
  updateCharts,
  updateForecastByMonthChart,
  updateDealStageChart,
  updateSalesRepChart,
  updateProbabilityDistributionChart
};

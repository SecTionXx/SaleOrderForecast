/**
 * chartOptimization.js - Chart Optimization Module
 * Provides chart rendering optimization for large datasets
 */

import { logDebug } from '../utils/logger.js';

/**
 * Optimizes chart rendering for large datasets
 * @param {Object} chart - The Chart.js chart instance to optimize
 * @param {Array} dataset - The dataset to be rendered
 * @param {number} threshold - The threshold for data point reduction (default: 100)
 * @returns {Array} - The optimized dataset
 */
function optimizeChartData(chart, dataset, threshold = 100) {
  // If dataset is smaller than threshold, return it as is
  if (!dataset || dataset.length <= threshold) {
    return dataset;
  }

  logDebug(`Optimizing chart data: ${dataset.length} points (threshold: ${threshold})`);
  
  // Determine the chart type and apply appropriate optimization
  const chartType = chart.config.type;
  
  switch (chartType) {
    case 'line':
    case 'area':
      return optimizeLineChartData(dataset, threshold);
    case 'bar':
    case 'horizontalBar':
      return optimizeBarChartData(dataset, threshold);
    case 'scatter':
      return optimizeScatterChartData(dataset, threshold);
    default:
      // For other chart types, use the default optimization
      return downsampleData(dataset, threshold);
  }
}

/**
 * Optimize line chart data using the Largest Triangle Three Buckets algorithm
 * This preserves visual trends while reducing points
 * @param {Array} data - The original dataset
 * @param {number} threshold - Target number of data points
 * @returns {Array} - Downsampled dataset
 */
function optimizeLineChartData(data, threshold) {
  // Implementation of Largest Triangle Three Buckets (LTTB) algorithm
  // This algorithm preserves the visual shape of the line chart
  
  if (data.length <= threshold) return data;
  
  const sampled = [];
  const bucketSize = data.length / threshold;
  
  // Always add the first point
  sampled.push(data[0]);
  
  // Add points based on LTTB algorithm
  for (let i = 1; i < threshold - 1; i++) {
    const avgRangeStart = Math.floor((i - 0.5) * bucketSize);
    const avgRangeEnd = Math.floor((i + 0.5) * bucketSize);
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    
    const pointAIndex = Math.floor((i - 1) * bucketSize);
    const pointBIndex = Math.floor(i * bucketSize);
    
    let maxArea = -1;
    let maxAreaIndex = pointAIndex;
    
    const pointA = data[pointAIndex];
    const pointB = data[pointBIndex];
    
    // Find the point that creates the largest triangle with pointA and pointB
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      const pointC = data[j];
      const area = Math.abs(
        (pointA.x - pointB.x) * (pointC.y - pointA.y) -
        (pointA.x - pointC.x) * (pointB.y - pointA.y)
      ) * 0.5;
      
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }
    
    sampled.push(data[maxAreaIndex]);
  }
  
  // Always add the last point
  sampled.push(data[data.length - 1]);
  
  return sampled;
}

/**
 * Optimize bar chart data by aggregating adjacent bars
 * @param {Array} data - The original dataset
 * @param {number} threshold - Target number of data points
 * @returns {Array} - Aggregated dataset
 */
function optimizeBarChartData(data, threshold) {
  if (data.length <= threshold) return data;
  
  const aggregated = [];
  const groupSize = Math.ceil(data.length / threshold);
  
  for (let i = 0; i < data.length; i += groupSize) {
    const chunk = data.slice(i, i + groupSize);
    
    // Aggregate values in the chunk
    const sum = chunk.reduce((acc, val) => acc + (val.y || val), 0);
    const avg = sum / chunk.length;
    
    // Create a representative data point
    if (typeof data[i] === 'object') {
      const label = `${chunk[0].x} - ${chunk[chunk.length - 1].x}`;
      aggregated.push({ x: label, y: avg });
    } else {
      aggregated.push(avg);
    }
  }
  
  return aggregated;
}

/**
 * Optimize scatter chart data using clustering
 * @param {Array} data - The original dataset
 * @param {number} threshold - Target number of data points
 * @returns {Array} - Clustered dataset
 */
function optimizeScatterChartData(data, threshold) {
  if (data.length <= threshold) return data;
  
  // Simple k-means clustering
  const clusters = [];
  const k = threshold;
  
  // Initialize clusters with random points from the dataset
  const indices = new Set();
  while (indices.size < k) {
    indices.add(Math.floor(Math.random() * data.length));
  }
  
  // Set initial centroids
  indices.forEach(index => {
    clusters.push({
      centroid: { x: data[index].x, y: data[index].y },
      points: []
    });
  });
  
  // Assign points to clusters
  for (let i = 0; i < data.length; i++) {
    let minDistance = Infinity;
    let closestCluster = 0;
    
    for (let j = 0; j < clusters.length; j++) {
      const distance = Math.sqrt(
        Math.pow(data[i].x - clusters[j].centroid.x, 2) +
        Math.pow(data[i].y - clusters[j].centroid.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = j;
      }
    }
    
    clusters[closestCluster].points.push(data[i]);
  }
  
  // Return cluster centroids
  return clusters.map(cluster => {
    if (cluster.points.length === 0) return null;
    
    // Calculate average of points in cluster
    const sumX = cluster.points.reduce((sum, p) => sum + p.x, 0);
    const sumY = cluster.points.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: sumX / cluster.points.length,
      y: sumY / cluster.points.length
    };
  }).filter(p => p !== null);
}

/**
 * General-purpose downsampling function that preserves min/max values
 * @param {Array} data - The original dataset
 * @param {number} threshold - Target number of data points
 * @returns {Array} - Downsampled dataset
 */
function downsampleData(data, threshold) {
  if (data.length <= threshold) return data;
  
  const result = [];
  const bucketSize = Math.ceil(data.length / threshold);
  
  for (let i = 0; i < threshold; i++) {
    const startIdx = i * bucketSize;
    const endIdx = Math.min(startIdx + bucketSize, data.length);
    
    if (startIdx >= data.length) break;
    
    // Find min and max values in the bucket
    let minVal = data[startIdx];
    let maxVal = data[startIdx];
    let minIdx = startIdx;
    let maxIdx = startIdx;
    
    for (let j = startIdx + 1; j < endIdx; j++) {
      const value = typeof data[j] === 'object' ? data[j].y : data[j];
      const compareVal = typeof minVal === 'object' ? minVal.y : minVal;
      
      if (value < compareVal) {
        minVal = data[j];
        minIdx = j;
      }
      
      if (value > (typeof maxVal === 'object' ? maxVal.y : maxVal)) {
        maxVal = data[j];
        maxIdx = j;
      }
    }
    
    // Add the point closest to the start of the bucket
    result.push(data[startIdx]);
    
    // Add min and max if they're different from the start point
    if (minIdx !== startIdx && minIdx !== endIdx - 1) {
      result.push(data[minIdx]);
    }
    
    if (maxIdx !== startIdx && maxIdx !== endIdx - 1 && maxIdx !== minIdx) {
      result.push(data[maxIdx]);
    }
    
    // Add the point closest to the end of the bucket if it's different
    if (endIdx - 1 !== startIdx) {
      result.push(data[endIdx - 1]);
    }
  }
  
  return result;
}

/**
 * Applies chart optimization to all charts in the dashboard
 * @param {Array} charts - Array of Chart.js instances
 * @param {Array} data - The dataset to be rendered
 * @param {number} threshold - The threshold for data point reduction
 */
function optimizeAllCharts(charts, data, threshold = 100) {
  if (!charts || !data) return;
  
  logDebug(`Optimizing ${Object.keys(charts).length} charts with ${data.length} data points`);
  
  // Apply optimization to each chart
  Object.keys(charts).forEach(chartKey => {
    const chart = charts[chartKey];
    if (!chart || !chart.data || !chart.data.datasets) return;
    
    // Optimize each dataset in the chart
    chart.data.datasets.forEach((dataset, i) => {
      if (!dataset.data || !dataset.data.length) return;
      
      // Skip optimization for small datasets
      if (dataset.data.length <= threshold) return;
      
      // Apply optimization based on chart type
      const optimizedData = optimizeChartData(chart, dataset.data, threshold);
      
      // Update the dataset with optimized data
      chart.data.datasets[i].data = optimizedData;
    });
    
    // Update the chart with optimized data
    chart.update();
  });
  
  logDebug('Chart optimization complete');
}

/**
 * Determines if chart optimization should be applied based on device capabilities
 * @returns {boolean} - True if optimization should be applied
 */
function shouldOptimizeCharts() {
  // Check for low-end devices or mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  
  // Check for slow connection
  const isSlowConnection = navigator.connection && 
    (navigator.connection.effectiveType === 'slow-2g' || 
     navigator.connection.effectiveType === '2g' ||
     navigator.connection.effectiveType === '3g');
  
  // Check for battery saving mode if available
  const isBatterySaving = navigator.getBattery && 
    navigator.getBattery().then(battery => battery.charging === false && battery.level < 0.2);
  
  // Apply optimization if any condition is met
  return isMobile || isLowEnd || hasLimitedMemory || isSlowConnection || isBatterySaving;
}

/**
 * Adaptive chart optimization based on device capabilities and dataset size
 * @param {Array} charts - Array of Chart.js instances
 * @param {Array} data - The dataset to be rendered
 */
function adaptiveChartOptimization(charts, data) {
  if (!charts || !data) return;
  
  // Determine threshold based on device capabilities and data size
  let threshold = 100; // Default threshold
  
  // Adjust threshold based on data size
  if (data.length > 1000) {
    threshold = 50;
  } else if (data.length > 500) {
    threshold = 75;
  } else if (data.length <= 200) {
    threshold = 200;
  }
  
  // Further adjust threshold based on device capabilities
  if (shouldOptimizeCharts()) {
    threshold = Math.floor(threshold * 0.5); // Reduce threshold for low-end devices
    logDebug('Using aggressive chart optimization for low-end device');
  }
  
  // Apply optimization with the determined threshold
  optimizeAllCharts(charts, data, threshold);
}

// Export functions
export {
  optimizeChartData,
  optimizeAllCharts,
  shouldOptimizeCharts,
  adaptiveChartOptimization
};

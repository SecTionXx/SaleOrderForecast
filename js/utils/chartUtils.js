/**
 * chartUtils.js - Utility functions for chart interactions
 * Handles chart events, tooltips, and other interactive elements
 */

import { logDebug, logError } from './logger.js';

/**
 * Initialize chart container with event listeners
 * @param {HTMLElement} container - The chart container element
 * @param {Object} options - Chart options
 * @param {Function} options.onRefresh - Callback when refresh is clicked
 * @param {Function} options.onExport - Callback when export is clicked
 */
export function initChartContainer(container, { onRefresh, onExport }) {
  try {
    if (!container) {
      logError('Chart container not found');
      return;
    }

    // Add refresh button handler
    const refreshBtn = container.querySelector('[data-action="refresh"]');
    if (refreshBtn && typeof onRefresh === 'function') {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const chartId = refreshBtn.dataset.chart;
        logDebug(`Refreshing chart: ${chartId}`);
        onRefresh(chartId);
      });
    }

    // Add export button handler
    const exportBtn = container.querySelector('[data-action="export"]');
    if (exportBtn && typeof onExport === 'function') {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const chartId = exportBtn.dataset.chart;
        logDebug(`Exporting chart: ${chartId}`);
        onExport(chartId);
      });
    }

    // Initialize tooltips if Bootstrap is available
    if (window.bootstrap && window.bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(
        container.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      
      tooltipTriggerList.forEach(tooltipTriggerEl => {
        new window.bootstrap.Tooltip(tooltipTriggerEl, {
          container: container
        });
      });
    }
  } catch (error) {
    logError('Error initializing chart container:', error);
  }
}

/**
 * Update chart legend with custom data
 * @param {HTMLElement} container - The chart container element
 * @param {Array} legendData - Array of legend items with { label, color }
 */
export function updateChartLegend(container, legendData = []) {
  try {
    const legendContainer = container.querySelector('.chart-legend');
    if (!legendContainer) return;

    if (!Array.isArray(legendData) || legendData.length === 0) {
      legendContainer.style.display = 'none';
      return;
    }

    legendContainer.style.display = 'flex';
    legendContainer.innerHTML = legendData
      .map(
        (item) => `
        <div class="legend-item">
          <span class="legend-color" style="background-color: ${item.color}"></span>
          <span class="legend-label">${item.label}</span>
        </div>
      `
      )
      .join('');
  } catch (error) {
    logError('Error updating chart legend:', error);
  }
}

/**
 * Update chart summary with custom text
 * @param {HTMLElement} container - The chart container element
 * @param {string} summaryText - The summary text to display
 */
export function updateChartSummary(container, summaryText = '') {
  try {
    const summaryElement = container.querySelector('.chart-summary');
    if (!summaryElement) return;

    if (!summaryText) {
      summaryElement.style.display = 'none';
      return;
    }

    summaryElement.style.display = 'block';
    summaryElement.textContent = summaryText;
  } catch (error) {
    logError('Error updating chart summary:', error);
  }
}

/**
 * Show loading state for a chart
 * @param {HTMLElement} container - The chart container element
 * @param {boolean} isLoading - Whether to show or hide loading state
 * @param {string} message - Optional loading message
 */
export function setChartLoading(container, isLoading = true, message = 'Loading...') {
  try {
    let loader = container.querySelector('.chart-loader');
    
    if (isLoading) {
      if (!loader) {
        loader = document.createElement('div');
        loader.className = 'chart-loader';
        loader.innerHTML = `
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">${message}</span>
          </div>
          <span class="ms-2">${message}</span>
        `;
        container.appendChild(loader);
      }
      loader.style.display = 'flex';
    } else if (loader) {
      loader.style.display = 'none';
    }
  } catch (error) {
    logError('Error setting chart loading state:', error);
  }
}

/**
 * Show error state for a chart
 * @param {HTMLElement} container - The chart container element
 * @param {string} message - Error message to display
 * @param {Error} error - Optional error object for logging
 */
export function showChartError(container, message = 'Failed to load chart', error = null) {
  try {
    if (error) {
      logError('Chart error:', error);
    }

    let errorElement = container.querySelector('.chart-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'chart-error';
      container.appendChild(errorElement);
    }
    
    errorElement.innerHTML = `
      <div class="alert alert-danger mb-0" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
      </div>
    `;
    errorElement.style.display = 'block';
    
    // Hide the canvas if it exists
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'none';
    }
  } catch (err) {
    logError('Error showing chart error state:', err);
  }
}

/**
 * Hide error state for a chart
 * @param {HTMLElement} container - The chart container element
 */
export function hideChartError(container) {
  try {
    const errorElement = container.querySelector('.chart-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    
    // Show the canvas if it exists
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
    }
  } catch (error) {
    logError('Error hiding chart error state:', error);
  }
}

/**
 * Export chart as an image
 * @param {HTMLCanvasElement} canvas - The chart canvas element
 * @param {string} filename - The filename to use for the exported image
 * @param {string} format - The image format (default: 'png')
 */
export function exportChartAsImage(canvas, filename = 'chart', format = 'png') {
  try {
    if (!canvas) {
      throw new Error('No canvas element provided');
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logDebug(`Chart exported as ${filename}.${format}`);
  } catch (error) {
    logError('Error exporting chart as image:', error);
    throw error;
  }
}

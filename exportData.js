// exportData.js - Handles data export functionality
import { exportToPDF, exportToPDFWithCharts } from './pdfExport.js';

/**
 * Exports the current filtered data to CSV format
 * @param {Array} data - The data to export
 * @param {String} filename - The filename to use for the export
 */
function exportToCSV(data, filename = 'order_forecast_export.csv') {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  try {
    // Define headers based on the first data object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => {
        let cell = item[header];
        
        // Format dates
        if (cell instanceof Date) {
          cell = cell.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
        
        // Handle values that need quotes (strings with commas, quotes, or newlines)
        if (typeof cell === 'string') {
          // Escape quotes by doubling them
          cell = cell.replace(/"/g, '""');
          
          // Wrap in quotes if the cell contains commas, quotes, or newlines
          if (/[",\n\r]/.test(cell)) {
            cell = `"${cell}"`;
          }
        }
        
        // Return empty string for null/undefined
        return cell != null ? cell : '';
      }).join(',');
      
      csvContent += row + '\n';
    });
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger the download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Data exported to ${filename}`);
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
}

/**
 * Exports the current filtered data to Excel format
 * @param {Array} data - The data to export
 * @param {String} filename - The filename to use for the export
 */
function exportToExcel(data, filename = 'order_forecast_export.xlsx') {
  // This is a simplified version that actually creates a CSV
  // For actual Excel export, you would need to use a library like SheetJS/xlsx
  return exportToCSV(data, filename.replace('.xlsx', '.csv'));
}

/**
 * Shows export options dialog
 * @param {Array} data - The data to export
 */
function showExportOptions(data) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  backdrop.style.zIndex = '1000';
  backdrop.style.display = 'flex';
  backdrop.style.justifyContent = 'center';
  backdrop.style.alignItems = 'center';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'export-modal';
  modal.style.backgroundColor = 'white';
  modal.style.borderRadius = '8px';
  modal.style.padding = '24px';
  modal.style.width = '400px';
  modal.style.maxWidth = '90%';
  modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  
  // Create modal header
  const header = document.createElement('div');
  header.style.marginBottom = '16px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  
  const title = document.createElement('h3');
  title.textContent = 'Export Data';
  title.style.margin = '0';
  title.style.fontSize = '1.25rem';
  title.style.fontWeight = '600';
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '1.5rem';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '0';
  closeButton.style.lineHeight = '1';
  closeButton.onclick = () => document.body.removeChild(backdrop);
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create modal body
  const body = document.createElement('div');
  body.style.marginBottom = '24px';
  
  const text = document.createElement('p');
  text.textContent = `Export ${data.length} records in the following format:`;
  text.style.marginBottom = '16px';
  
  const options = document.createElement('div');
  options.style.display = 'flex';
  options.style.flexDirection = 'column';
  options.style.gap = '12px';
  
  // CSV option
  const csvButton = document.createElement('button');
  csvButton.className = 'export-option-btn';
  csvButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Export as CSV';
  csvButton.style.display = 'flex';
  csvButton.style.alignItems = 'center';
  csvButton.style.gap = '8px';
  csvButton.style.padding = '12px 16px';
  csvButton.style.border = '1px solid #e5e7eb';
  csvButton.style.borderRadius = '6px';
  csvButton.style.backgroundColor = '#f9fafb';
  csvButton.style.cursor = 'pointer';
  csvButton.style.transition = 'all 0.2s';
  csvButton.style.fontWeight = '500';
  csvButton.onmouseover = () => {
    csvButton.style.backgroundColor = '#f3f4f6';
    csvButton.style.borderColor = '#d1d5db';
  };
  csvButton.onmouseout = () => {
    csvButton.style.backgroundColor = '#f9fafb';
    csvButton.style.borderColor = '#e5e7eb';
  };
  csvButton.onclick = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const success = exportToCSV(data, `order_forecast_${timestamp}.csv`);
    if (success) document.body.removeChild(backdrop);
  };
  
  // Excel option
  const excelButton = document.createElement('button');
  excelButton.className = 'export-option-btn';
  excelButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><rect x="8" y="12" width="8" height="2"></rect><rect x="8" y="16" width="8" height="2"></rect><path d="M10 8H8"></path></svg> Export as Excel (CSV)';
  excelButton.style.display = 'flex';
  excelButton.style.alignItems = 'center';
  excelButton.style.gap = '8px';
  excelButton.style.padding = '12px 16px';
  excelButton.style.border = '1px solid #e5e7eb';
  excelButton.style.borderRadius = '6px';
  excelButton.style.backgroundColor = '#f9fafb';
  excelButton.style.cursor = 'pointer';
  excelButton.style.transition = 'all 0.2s';
  excelButton.style.fontWeight = '500';
  excelButton.onmouseover = () => {
    excelButton.style.backgroundColor = '#f3f4f6';
    excelButton.style.borderColor = '#d1d5db';
  };
  excelButton.onmouseout = () => {
    excelButton.style.backgroundColor = '#f9fafb';
    excelButton.style.borderColor = '#e5e7eb';
  };
  excelButton.onclick = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const success = exportToExcel(data, `order_forecast_${timestamp}.xlsx`);
    if (success) document.body.removeChild(backdrop);
  };
  
  // PDF option
  const pdfButton = document.createElement('button');
  pdfButton.className = 'export-option-btn';
  pdfButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><rect x="8" y="12" width="8" height="2"></rect><rect x="8" y="16" width="8" height="2"></rect><path d="M10 8H8"></path></svg> Export as PDF';
  pdfButton.style.display = 'flex';
  pdfButton.style.alignItems = 'center';
  pdfButton.style.gap = '8px';
  pdfButton.style.padding = '12px 16px';
  pdfButton.style.border = '1px solid #e5e7eb';
  pdfButton.style.borderRadius = '6px';
  pdfButton.style.backgroundColor = '#f9fafb';
  pdfButton.style.cursor = 'pointer';
  pdfButton.style.transition = 'all 0.2s';
  pdfButton.style.fontWeight = '500';
  pdfButton.onmouseover = () => {
    pdfButton.style.backgroundColor = '#f3f4f6';
    pdfButton.style.borderColor = '#d1d5db';
  };
  pdfButton.onmouseout = () => {
    pdfButton.style.backgroundColor = '#f9fafb';
    pdfButton.style.borderColor = '#e5e7eb';
  };
  pdfButton.onclick = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    // Check if jsPDF is loaded
    if (typeof jsPDF === 'undefined') {
      // Show loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.textContent = 'Loading PDF generation library...';
      loadingMsg.style.marginTop = '16px';
      loadingMsg.style.textAlign = 'center';
      loadingMsg.style.color = '#4b5563';
      body.appendChild(loadingMsg);
      
      // Dynamically load jsPDF and its dependencies
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        // Load AutoTable plugin after jsPDF
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => {
          // Remove loading message
          body.removeChild(loadingMsg);
          
          // Get charts if available
          const charts = window.charts || {};
          
          // Generate PDF with charts
          const success = exportToPDFWithCharts(data, charts, `order_forecast_${timestamp}.pdf`, {
            summary: getSummaryData(),
            filters: getActiveFilters()
          });
          
          if (success) document.body.removeChild(backdrop);
        };
        document.head.appendChild(autoTableScript);
      };
      script.onerror = () => {
        loadingMsg.textContent = 'Failed to load PDF library. Please try again later.';
        loadingMsg.style.color = '#ef4444';
        setTimeout(() => {
          body.removeChild(loadingMsg);
        }, 3000);
      };
      document.head.appendChild(script);
    } else {
      // jsPDF is already loaded, generate PDF directly
      const charts = window.charts || {};
      const success = exportToPDFWithCharts(data, charts, `order_forecast_${timestamp}.pdf`, {
        summary: getSummaryData(),
        filters: getActiveFilters()
      });
      
      if (success) document.body.removeChild(backdrop);
    }
  };
  
  // PDF with charts option
  const pdfWithChartsButton = document.createElement('button');
  pdfWithChartsButton.className = 'export-option-btn';
  pdfWithChartsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Export as PDF with Charts';
  pdfWithChartsButton.style.display = 'flex';
  pdfWithChartsButton.style.alignItems = 'center';
  pdfWithChartsButton.style.gap = '8px';
  pdfWithChartsButton.style.padding = '12px 16px';
  pdfWithChartsButton.style.border = '1px solid #e5e7eb';
  pdfWithChartsButton.style.borderRadius = '6px';
  pdfWithChartsButton.style.backgroundColor = '#f9fafb';
  pdfWithChartsButton.style.cursor = 'pointer';
  pdfWithChartsButton.style.transition = 'all 0.2s';
  pdfWithChartsButton.style.fontWeight = '500';
  pdfWithChartsButton.onmouseover = () => {
    pdfWithChartsButton.style.backgroundColor = '#f3f4f6';
    pdfWithChartsButton.style.borderColor = '#d1d5db';
  };
  pdfWithChartsButton.onmouseout = () => {
    pdfWithChartsButton.style.backgroundColor = '#f9fafb';
    pdfWithChartsButton.style.borderColor = '#e5e7eb';
  };
  pdfWithChartsButton.onclick = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    // Check if jsPDF is loaded
    if (typeof jsPDF === 'undefined') {
      // Show loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.textContent = 'Loading PDF generation library...';
      loadingMsg.style.marginTop = '16px';
      loadingMsg.style.textAlign = 'center';
      loadingMsg.style.color = '#4b5563';
      body.appendChild(loadingMsg);
      
      // Dynamically load jsPDF and its dependencies
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        // Load AutoTable plugin after jsPDF
        const autoTableScript = document.createElement('script');
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
        autoTableScript.onload = () => {
          // Remove loading message
          body.removeChild(loadingMsg);
          
          // Get charts if available
          const charts = window.charts || {};
          
          // Generate PDF with charts
          const success = exportToPDFWithCharts(data, charts, `order_forecast_${timestamp}.pdf`, {
            summary: getSummaryData(),
            filters: getActiveFilters()
          });
          
          if (success) document.body.removeChild(backdrop);
        };
        document.head.appendChild(autoTableScript);
      };
      script.onerror = () => {
        loadingMsg.textContent = 'Failed to load PDF library. Please try again later.';
        loadingMsg.style.color = '#ef4444';
        setTimeout(() => {
          body.removeChild(loadingMsg);
        }, 3000);
      };
      document.head.appendChild(script);
    } else {
      // jsPDF is already loaded, generate PDF directly
      const charts = window.charts || {};
      const success = exportToPDFWithCharts(data, charts, `order_forecast_${timestamp}.pdf`, {
        summary: getSummaryData(),
        filters: getActiveFilters()
      });
      
      if (success) document.body.removeChild(backdrop);
    }
  };
  
  options.appendChild(csvButton);
  options.appendChild(excelButton);
  options.appendChild(pdfButton);
  options.appendChild(pdfWithChartsButton);
  
  body.appendChild(text);
  body.appendChild(options);
  
  // Create modal footer
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.border = '1px solid #e5e7eb';
  cancelButton.style.borderRadius = '6px';
  cancelButton.style.backgroundColor = 'white';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.transition = 'all 0.2s';
  cancelButton.onclick = () => document.body.removeChild(backdrop);
  
  footer.appendChild(cancelButton);
  
  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  
  // Add to document
  document.body.appendChild(backdrop);
}

/**
 * Get summary data for reports
 * @returns {Object} - Summary data
 */
function getSummaryData() {
  const summary = {};
  
  // Try to get summary values from the UI
  try {
    const totalValueEl = document.getElementById('summary-total-value');
    if (totalValueEl) summary['Total Forecast'] = totalValueEl.textContent;
    
    const totalDealsEl = document.getElementById('summary-total-deals');
    if (totalDealsEl) summary['Total Deals'] = totalDealsEl.textContent;
    
    const weightedValueEl = document.getElementById('summary-weighted-value');
    if (weightedValueEl) summary['Weighted Value'] = weightedValueEl.textContent;
  } catch (error) {
    console.error('Error getting summary data:', error);
  }
  
  return summary;
}

/**
 * Get active filters for reports
 * @returns {String} - Active filters as a string
 */
function getActiveFilters() {
  const filters = [];
  
  try {
    // Get sales rep filter
    const salesRepFilter = document.getElementById('sales-rep-filter');
    if (salesRepFilter && salesRepFilter.value !== 'all') {
      filters.push(`Sales Rep: ${salesRepFilter.options[salesRepFilter.selectedIndex].text}`);
    }
    
    // Get deal stage filter
    const dealStageFilter = document.getElementById('deal-stage-filter');
    if (dealStageFilter && dealStageFilter.value !== 'all') {
      filters.push(`Deal Stage: ${dealStageFilter.options[dealStageFilter.selectedIndex].text}`);
    }
    
    // Get date range filters
    const dateRangeFilter = document.getElementById('date-range-filter');
    if (dateRangeFilter && dateRangeFilter.value !== 'all') {
      filters.push(`Date Range: ${dateRangeFilter.options[dateRangeFilter.selectedIndex].text}`);
    }
  } catch (error) {
    console.error('Error getting active filters:', error);
  }
  
  return filters.join(', ');
}

export { exportToCSV, exportToExcel, showExportOptions, getSummaryData, getActiveFilters };

/**
 * Utility functions for exporting data to various formats
 */

export const exportToCSV = (data, filename = 'export.csv') => {
  try {
    // Convert array of objects to CSV string
    const csvContent = [
      Object.keys(data[0]).join(','), // Header row
      ...data.map(item => 
        Object.values(item)
          .map(value => 
            `"${String(value || '').replace(/"/g, '""')}"`
          )
          .join(',')
      )
    ].join('\n');

    // Create download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
};

export const exportToExcel = async (data, filename = 'export.xlsx') => {
  try {
    // Dynamic import of xlsx library to reduce bundle size
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs');
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const exportToJSON = (data, filename = 'export.json') => {
  try {
    // Convert data to JSON string with pretty printing
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return false;
  }
};

/**
 * Shows export options in a modal or dropdown
 * @param {HTMLElement} targetElement - The element to show the export options near
 * @param {Object} data - The data to export
 * @param {string} [defaultFilename='export'] - Default filename for the export
 */
export const showExportOptions = (targetElement, data, defaultFilename = 'export') => {
  try {
    // Create modal or dropdown element
    const exportMenu = document.createElement('div');
    exportMenu.className = 'export-menu';
    exportMenu.style.position = 'absolute';
    exportMenu.style.backgroundColor = 'white';
    exportMenu.style.border = '1px solid #ddd';
    exportMenu.style.borderRadius = '4px';
    exportMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    exportMenu.style.padding = '8px 0';
    exportMenu.style.zIndex = '1000';
    
    // Position near the target element
    const rect = targetElement.getBoundingClientRect();
    exportMenu.style.top = `${rect.bottom + window.scrollY}px`;
    exportMenu.style.left = `${rect.left + window.scrollX}px`;

    // Add export options
    const formats = [
      { name: 'CSV', handler: () => exportToCSV(data, `${defaultFilename}.csv`) },
      { name: 'Excel', handler: () => exportToExcel(data, `${defaultFilename}.xlsx`) },
      { name: 'JSON', handler: () => exportToJSON(data, `${defaultFilename}.json`) }
    ];

    formats.forEach(format => {
      const option = document.createElement('div');
      option.className = 'export-option';
      option.style.padding = '8px 16px';
      option.style.cursor = 'pointer';
      option.textContent = `Export as ${format.name}`;
      option.addEventListener('click', () => {
        format.handler();
        document.body.removeChild(exportMenu);
      });
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = '#f5f5f5';
      });
      option.addEventListener('mouseleave', () => {
        option.style.backgroundColor = 'transparent';
      });
      exportMenu.appendChild(option);
    });

    // Add to document
    document.body.appendChild(exportMenu);

    // Close on outside click
    const closeOnOutsideClick = (e) => {
      if (!exportMenu.contains(e.target) && e.target !== targetElement) {
        document.body.removeChild(exportMenu);
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    
    // Use setTimeout to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', closeOnOutsideClick);
    }, 0);

    return true;
  } catch (error) {
    console.error('Error showing export options:', error);
    return false;
  }
};

// Example usage:
// import { exportToCSV, exportToExcel, exportToJSON, showExportOptions } from './utils/exportData';
// showExportOptions(buttonElement, yourData, 'myData');

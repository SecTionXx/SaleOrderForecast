const { google } = require('googleapis');
require('dotenv').config();

class GoogleSheetsHelper {
  constructor() {
    this.SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    this.API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
    
    if (!this.SPREADSHEET_ID || !this.API_KEY) {
      throw new Error('Missing required environment variables: GOOGLE_SHEET_ID or GOOGLE_SHEETS_API_KEY');
    }
    
    // Initialize Google Sheets API with API key
    this.sheets = google.sheets({ 
      version: 'v4', 
      auth: this.API_KEY 
    });
  }

  // Helper function to clean and parse currency values
  cleanCurrency(value) {
    if (typeof value === 'string') {
      // Remove currency symbol (฿), commas, and any whitespace
      return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
    }
    return value || 0;
  }

  // Helper function to parse percentage values
  parsePercentage(value) {
    if (typeof value === 'string') {
      // Remove percentage sign and convert to number
      return parseFloat(value.replace('%', '')) || 0;
    }
    return value || 0;
  }

  // Helper function to convert date string to YYYY-MM-DD format
  formatDate(dateString) {
    if (!dateString) return '';
    // Handle different date formats (MM/DD/YYYY or YYYY-MM-DD)
    const parts = dateString.split(/[/-]/);
    let date;
    
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // Assume MM/DD/YYYY format
        date = new Date(parts[2], parts[0] - 1, parts[1]);
      } else {
        // Assume MM/DD/YY format (convert to YYYY)
        const year = parseInt(parts[2]) > 50 ? `19${parts[2]}` : `20${parts[2]}`;
        date = new Date(year, parts[0] - 1, parts[1]);
      }
    } else {
      // Try parsing as is
      date = new Date(dateString);
    }
    
    return isNaN(date.getTime()) ? dateString : date.toISOString().split('T')[0];
  }

  // Helper function to convert snake_case to camelCase
  toCamelCase(str) {
    if (!str) return '';
    return str.replace(/([-_][a-z])/g, group => 
      group.toUpperCase()
        .replace('-', '')
        .replace('_', '')
    );
  }

  // Main function to get rows from Google Sheets
  async getRows() {
    try {
      console.log('Fetching data from Google Sheets...');
      
      // First, get headers
      const headersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'A1:Z1', // Just headers
        valueRenderOption: 'FORMATTED_VALUE',
      });

      const headers = headersResponse.data.values ? headersResponse.data.values[0] : [];
      console.log('Headers found:', headers);

      if (headers.length === 0) {
        console.log('No headers found in the sheet.');
        return [];
      }

      // Then get data rows (skip header)
      const dataResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: 'A2:Z1000', // Data rows
        valueRenderOption: 'FORMATTED_VALUE',
      });

      const rows = dataResponse.data.values || [];
      console.log(`Found ${rows.length} data rows`);

      // Process data rows
      return rows.map((row, rowIndex) => {
        const item = {};
        
        headers.forEach((header, colIndex) => {
          if (header) { // Only process if header exists
            const value = row[colIndex] || '';
            const headerLower = header.toLowerCase();
            
            // Clean and format values based on header content
            if (headerLower.includes('date')) {
              item[header] = this.formatDate(value);
            } else if (headerLower.includes('value') || headerLower.includes('amount')) {
              item[header] = this.cleanCurrency(value);
            } else if (headerLower.includes('probability') && headerLower.includes('percent')) {
              item[header] = this.parsePercentage(value);
            } else {
              item[header] = value;
            }
          }
        });
        
        // Add a unique ID if not present
        if (!item.Deal_ID && rowIndex !== undefined) {
          item.Deal_ID = `ROW-${rowIndex + 2}`; // +2 because of 0-based index and header row
        }
        
        return item;
      });

    } catch (error) {
      console.error('Error in getRows:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new GoogleSheetsHelper();

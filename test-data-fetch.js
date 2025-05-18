require('dotenv').config();
const { google } = require('googleapis');

async function fetchData() {
  try {
    console.log('Fetching data from Google Sheets...');
    
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: process.env.GOOGLE_SHEETS_API_KEY 
    });

    // First, get headers
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A1:Z1',
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const headers = headersResponse.data.values ? headersResponse.data.values[0] : [];
    console.log('Headers:', headers.join(' | '));

    // Then get data rows (first 5 rows for testing)
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A2:Z6', // First 5 data rows
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = dataResponse.data.values || [];
    console.log(`\nFound ${rows.length} data rows:`);
    
    // Display each row with header mapping
    rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      const rowData = {};
      headers.forEach((header, i) => {
        rowData[header] = row[i] || '';
      });
      console.log(JSON.stringify(rowData, null, 2));
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

fetchData();

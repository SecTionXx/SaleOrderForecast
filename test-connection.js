require('dotenv').config();
const { google } = require('googleapis');

async function testConnection() {
  try {
    console.log('Testing Google Sheets connection...');
    console.log('Environment variables:');
    console.log(`- GOOGLE_SHEET_ID: ${process.env.GOOGLE_SHEET_ID ? 'Set' : 'Not set'}`);
    console.log(`- GOOGLE_SHEETS_API_KEY: ${process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set'}`);

    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SHEETS_API_KEY) {
      throw new Error('Missing required environment variables');
    }

    const sheets = google.sheets({ 
      version: 'v4', 
      auth: process.env.GOOGLE_SHEETS_API_KEY 
    });

    console.log('Fetching spreadsheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A1:Z1', // Just get headers for testing
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const headers = response.data.values ? response.data.values[0] : [];
    console.log('Success! Headers from Google Sheet:');
    console.log(headers.join(' | '));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testConnection();

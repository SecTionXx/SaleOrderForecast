require('dotenv').config();
const { google } = require('googleapis');

async function testSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json', // Path to your service account key file
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
    console.log('Testing Google Sheets connection...');
    console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:Z10', // First 10 rows for testing
      valueRenderOption: 'FORMATTED_VALUE',
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the sheet.');
      return;
    }
    
    console.log('Headers:', rows[0].join(' | '));
    console.log('First data row:', rows[1] ? rows[1].join(' | ') : 'No data');
    
  } catch (error) {
    console.error('Error testing Google Sheets:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSheets();

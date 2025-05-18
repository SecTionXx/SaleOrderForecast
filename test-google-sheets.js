const googleSheets = require('./googleSheets-clean');

async function testGoogleSheets() {
  try {
    console.log('Testing Google Sheets integration...');
    
    // Test getting rows
    const rows = await googleSheets.getRows();
    console.log(`\nSuccessfully retrieved ${rows.length} rows.`);
    
    if (rows.length > 0) {
      console.log('\nFirst row sample:');
      console.log(JSON.stringify(rows[0], null, 2));
      
      // Show column names from first row
      console.log('\nAvailable columns:');
      console.log(Object.keys(rows[0]));
    }
    
    return rows;
  } catch (error) {
    console.error('Test failed:', error.message);
    throw error;
  }
}

// Run the test
testGoogleSheets()
  .then(() => console.log('\nTest completed successfully!'))
  .catch(err => console.error('Test failed:', err));

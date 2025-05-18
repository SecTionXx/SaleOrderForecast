// data.js

// --- Use backend API endpoint ---
const BACKEND_API_URL = "/api/sheet-data"

/**
 * Converts a Google Sheet/Excel serial number date to a JavaScript Date object.
 */
function serialNumberToDate(serial) {
  if (typeof serial !== "number" || isNaN(serial) || serial <= 0) {
    return null
  }
  const daysToMilliseconds = 24 * 60 * 60 * 1000
  const epochAdjustment = serial > 60 ? 25569 : 25568
  const utcMilliseconds = (serial - epochAdjustment) * daysToMilliseconds
  return new Date(utcMilliseconds)
}

// --- Data Fetching Function ---
async function fetchDataFromSheet() {
  console.log("data.js: Fetching data from backend API:", BACKEND_API_URL)
  try {
    const response = await fetch(BACKEND_API_URL)
    const data = await response.json()
    console.log("data.js: Backend Response Status:", response.status)
    console.log("data.js: Response data:", data)

    if (!response.ok) {
      const errorMessage =
        data?.error || `HTTP error! Status: ${response.status}`
      console.error("data.js: Backend API Error:", errorMessage)
      throw new Error(errorMessage)
    }
    
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn("data.js: No data rows found in backend response.")
      return []
    }
    
    console.log(`data.js: Processing ${data.data.length} rows from backend.`)

    // --- Data Transformation ---
    console.log('Processing rows. First row sample:', JSON.stringify(data.data[0], null, 2));
    
    return data.data.map((row, index) => {
      console.log(`Processing row ${index}:`, JSON.stringify(row, null, 2));
      
      const totalValue = typeof row.Total_Value === 'number' ? row.Total_Value : 0;
      const probabilityPercent = typeof row.Probability_Percent === 'number' ? row.Probability_Percent : 0;
      const weightedValue = typeof row.Weighted_Value === 'number' ? row.Weighted_Value : (totalValue * probabilityPercent) / 100;
      
      console.log(`Row ${index} values - Total: ${totalValue}, Probability: ${probabilityPercent}%, Weighted: ${weightedValue}`);

      const processDateValue = (dateString, fieldName = '') => {
        try {
          if (!dateString) {
            console.log(`No date provided for ${fieldName}`);
            return null;
          }
          
          // If it's already a Date object, return it
          if (dateString instanceof Date) {
            if (isNaN(dateString.getTime())) {
              console.warn(`Invalid Date object for ${fieldName}:`, dateString);
              return null;
            }
            return dateString;
          }
          
          // If it's a number, treat it as a serial date
          if (typeof dateString === 'number' && dateString > 0) {
            const date = serialNumberToDate(dateString);
            if (!date) {
              console.warn(`Failed to convert serial date for ${fieldName}:`, dateString);
            }
            return date;
          }
          
          // Try parsing the date string (could be in various formats)
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            console.warn(`Failed to parse date string for ${fieldName}:`, dateString);
            return null;
          }
          return date;
        } catch (error) {
          console.error(`Error processing date for ${fieldName}:`, error);
          return null;
        }
      };

      const dateCreated = processDateValue(row.Date_Created, 'Date_Created');
      const expectedCloseDate = processDateValue(row.Expected_Close_Date, 'Expected_Close_Date');
      const lastUpdated = processDateValue(row.Last_Updated, 'Last_Updated');
      const actualCloseDate = processDateValue(
        row.actualCloseDate || row.Expected_Close_Date, 
        'actualCloseDate/Expected_Close_Date'
      );
      
      console.log(`Processed dates for row ${index}:`, {
        dateCreated,
        expectedCloseDate,
        lastUpdated,
        actualCloseDate
      });

      return {
        id: row.Deal_ID || `row-${index + 1}`,
        dateCreated,
        customerName: row.Customer_Name || "",
        projectName: row.Project_Name || "",
        totalValue,
        probabilityPercent,
        weightedValue,
        dealStage: row.Deal_Stage || "",
        expectedCloseDate,
        salesRep: row.Sales_Rep || "",
        lastUpdated,
        notes: row.Notes || "",
        actualCloseDate
      }
    })
  } catch (error) {
    console.error(
      "data.js: Failed to fetch or process data from backend:",
      error
    )
    throw error
  }
}

// --- Export ---
export { fetchDataFromSheet }

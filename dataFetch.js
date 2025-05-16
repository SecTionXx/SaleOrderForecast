// dataFetch.js - Improved version with better error handling and mock data support

// Flexible API URL that works both locally and in various deployment environments
const BASE_URL = window.location.origin;
const BACKEND_API_URL = `${BASE_URL}/api/getSheetData`;

// Default mock data as fallback
const DEFAULT_MOCK_DATA = {
  values: [
    ["DEAL-001", "2025-01-15", "Acme Corporation", "ERP Implementation", 150000, 90, 135000, "Negotiation", "2025-06-30", "Boworn", "2025-05-01", "Client is interested in full implementation", null, ""],
    ["DEAL-002", "2025-02-10", "TechSolutions Inc", "Cloud Migration", 85000, 75, 63750, "Proposal Sent", "2025-07-15", "Lalipas", "2025-05-05", "Waiting for client feedback", null, ""],
    ["DEAL-003", "2025-01-20", "Global Enterprises", "Security Audit", 45000, 95, 42750, "Closed Won", "2025-04-30", "Boworn", "2025-04-30", "Contract signed", "2025-04-30", "Competitive pricing"],
    ["DEAL-004", "2025-03-05", "Innovate Ltd", "Mobile App Development", 120000, 60, 72000, "Lead", "2025-08-15", "Lalipas", "2025-05-10", "Initial discussions", null, ""],
    ["DEAL-005", "2025-02-25", "DataCorp", "BI Dashboard", 95000, 80, 76000, "Negotiation", "2025-06-15", "Boworn", "2025-05-12", "Discussing contract terms", null, ""],
    ["DEAL-006", "2025-01-10", "SmartSystems", "IoT Platform", 200000, 40, 80000, "Proposal Sent", "2025-07-30", "Lalipas", "2025-05-02", "Sent detailed proposal", null, ""],
    ["DEAL-007", "2025-03-15", "EcoTech", "Sustainability Tracking", 75000, 85, 63750, "Negotiation", "2025-06-01", "Boworn", "2025-05-14", "Final price negotiations", null, ""],
    ["DEAL-008", "2025-02-05", "HealthPlus", "Patient Portal", 110000, 30, 33000, "Lead", "2025-09-15", "Lalipas", "2025-05-03", "Early discussions", null, ""],
    ["DEAL-009", "2025-01-30", "FinanceGroup", "Reporting System", 65000, 100, 65000, "Closed Won", "2025-04-15", "Boworn", "2025-04-15", "Implementation started", "2025-04-15", "Product features"],
    ["DEAL-010", "2025-03-20", "RetailOne", "Inventory Management", 130000, 20, 26000, "Lead", "2025-10-01", "Lalipas", "2025-05-08", "Initial requirements gathering", null, ""],
    ["DEAL-011", "2025-02-15", "LogisticsPro", "Fleet Tracking", 180000, 0, 0, "Closed Lost", "2025-05-15", "Boworn", "2025-05-15", "Client went with competitor", null, "Price too high"],
    ["DEAL-012", "2025-03-01", "MediaMax", "Content Platform", 95000, 70, 66500, "Proposal Sent", "2025-07-01", "Lalipas", "2025-05-11", "Awaiting client decision", null, ""]
  ]
};

// Try to load mock data dynamically
let mockDataJson = DEFAULT_MOCK_DATA;
try {
  fetch('./mockData.json')
    .then(response => response.json())
    .then(data => {
      if (data && data.values && Array.isArray(data.values)) {
        mockDataJson = data;
        console.log('Mock data loaded successfully');
      }
    })
    .catch(err => console.error('Error loading mock data:', err));
} catch (e) {
  console.warn('Could not load mock data:', e);
}

// Get the authentication token function
function getAuthToken() {
  return localStorage.getItem('orderforecast_auth_token');
}
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Convert Excel/Google Sheets serial number to JavaScript Date
function serialNumberToDate(serial) {
  if (typeof serial !== "number" || isNaN(serial) || serial <= 0) {
    return null
  }
  const daysToMilliseconds = 24 * 60 * 60 * 1000
  const epochAdjustment = serial > 60 ? 25569 : 25568 // Adjust for Excel epoch (1900-01-01)
  const utcMilliseconds = (serial - epochAdjustment) * daysToMilliseconds
  return new Date(utcMilliseconds)
}

// Helper function to delay execution (for retry logic)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to check if response is JSON
const isJsonResponse = (response) => {
  const contentType = response.headers.get("content-type")
  return contentType && contentType.includes("application/json")
}

// Helper function to get a user-friendly error message
const getUserFriendlyErrorMessage = (error, response) => {
  // Network errors
  if (!navigator.onLine) {
    return "You appear to be offline. Please check your internet connection and try again."
  }
  
  // API response errors
  if (response) {
    switch (response.status) {
      case 401:
      case 403:
        return "Authentication error. Please log out and log in again."
      case 404:
        return "API endpoint not found. Please check your deployment configuration."
      case 429:
        return "Too many requests. Please try again later."
      case 500:
      case 502:
      case 503:
      case 504:
        return "Server error. The system is currently unavailable. Please try again later."
      default:
        return `API error (${response.status}): ${error.message || 'Unknown error'}`
    }
  }
  
  // Generic error fallback
  return error.message || "An unexpected error occurred while loading data."
}

async function fetchDataFromSheet() {
  console.log("dataFetch.js: Fetching data from backend API:", BACKEND_API_URL);
  
  // Get authentication token
  const token = localStorage.getItem('orderforecast_auth_token');
  if (!token) {
    // Redirect to login page
    window.location.href = 'login.html';
    return [];
  }
  
  // If mock data is already loaded, use it for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Development environment detected, using mock data');
    if (mockDataJson && mockDataJson.values) {
      return mockDataJson.values.map((row, index) => processRowData(row, index));
    }
  }
  
  // Initialize variables
  let response = null
  let retryCount = 0
  let lastError = null
  let successfulUrl = null
  
  // Retry loop for resilience
  while (retryCount < MAX_RETRIES) {
    try {
      // First attempt: Try the current origin
      if (retryCount === 0) {
        console.log(`dataFetch.js: Attempt ${retryCount + 1} - Trying current origin`)
        response = await fetch(BACKEND_API_URL, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          successfulUrl = BACKEND_API_URL
          break
        }
      }
      
      // If current origin fails, try local development ports
      const localPorts = [3000, 3001]
      for (const port of localPorts) {
        try {
          const localUrl = `http://localhost:${port}/api/getSheetData`
          console.log(`dataFetch.js: Attempt ${retryCount + 1} - Trying local API at ${localUrl}`)
          response = await fetch(localUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            successfulUrl = localUrl
            break
          }
        } catch (e) {
          console.log(`dataFetch.js: Port ${port} failed:`, e.message)
          lastError = e
        }
      }
      
      // If we got a successful response, break out of retry loop
      if (response && response.ok) {
        break
      }
      
      // If we got a response but it's not OK, we might not want to retry certain status codes
      if (response) {
        const { status } = response
        // Don't retry for client errors except for 429 (too many requests)
        if (status >= 400 && status < 500 && status !== 429) {
          console.warn(`dataFetch.js: Client error ${status}, not retrying`)
          break
        }
      }
      
      // Increment retry count and delay before next attempt
      retryCount++
      console.log(`dataFetch.js: Retry ${retryCount}/${MAX_RETRIES} after delay...`)
      await delay(RETRY_DELAY * retryCount) // Exponential backoff
    } catch (error) {
      lastError = error
      console.error(`dataFetch.js: Fetch attempt ${retryCount + 1} failed:`, error)
      retryCount++
      if (retryCount < MAX_RETRIES) {
        await delay(RETRY_DELAY * retryCount)
      }
    }
  }
  
  // If all retries failed, use mock data instead of throwing an error
  if (!response || !response.ok) {
    const errorMessage = lastError ? getUserFriendlyErrorMessage(lastError, response) : 
      "Failed to connect to the server after multiple attempts. Using sample data instead.";
    console.warn("dataFetch.js: All fetch attempts failed:", errorMessage);
    console.info("dataFetch.js: Using mock data as fallback");
    
    // Use the default mock data we defined at the top of the file
    return mockDataJson.values.map((row, index) => processRowData(row, index));
  }
  
  console.log(`dataFetch.js: Successfully connected to ${successfulUrl}`)
  
  try {
    // Check if response is JSON before parsing
    if (!isJsonResponse(response)) {
      console.error("dataFetch.js: Backend did not return JSON. Content type:", response.headers.get("content-type"))
      // If we get a non-JSON response, try to show a more helpful error
      const textResponse = await response.text()
      console.error("dataFetch.js: Raw response:", textResponse.substring(0, 200) + "...")
      throw new Error("Backend API returned invalid format. Please check API configuration.")
    }

    const data = await response.json()
    console.log("dataFetch.js: Backend Response Status:", response.status)

    // Validate the data structure
    if (!data.values || !Array.isArray(data.values)) {
      console.warn("dataFetch.js: Invalid data structure in response.")
      throw new Error("The API returned data in an unexpected format. Expected 'values' array.")
    }
    
    if (data.values.length === 0) {
      console.warn("dataFetch.js: No data rows found in backend response.")
      return []
    }
    
    console.log(`dataFetch.js: Processing ${data.values.length} rows from backend.`)

    return data.values.map((row, index) => processRowData(row, index))
  } catch (error) {
    console.error("Error processing data:", error)
    throw error
  }
}

// Helper function to process row data consistently
// Process row data into a structured object
function processRowData(row, index) {
  const totalValue = parseFloat(row[4]) || 0;
  const probabilityPercent = parseFloat(row[5]) || 0;
  const weightedValue =
    parseFloat(row[6]) || (totalValue * probabilityPercent) / 100;

  const processDateValue = (rawValue) => {
    if (typeof rawValue === "number" && rawValue > 0)
      return serialNumberToDate(rawValue);
    if (typeof rawValue === "string" && rawValue.trim())
      return rawValue.trim();
    return null;
  };
  const dateCreated = processDateValue(row[1]);
  const expectedCloseDate = processDateValue(row[8]);
  const lastUpdated = processDateValue(row[10]);
  const actualCloseDate = processDateValue(row[12]);

  return {
    dealId: String(row[0] || `GEN-${index + 1}`).trim(),
    dateCreated,
    customerName: String(row[2] || "").trim(),
    projectName: String(row[3] || "").trim(),
    totalValue,
    probabilityPercent,
    weightedValue,
    dealStage: String(row[7] || "").trim(),
    expectedCloseDate,
    salesRep: String(row[9] || "").trim(),
    lastUpdated,
    notes: String(row[11] || "").trim(),
    actualCloseDate,
    lossReason: String(row[13] || "").trim(),
  };
}

// Cache mechanism to reduce API calls
const CACHE_KEY = 'orderforecast_data_cache'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds

function saveDataToCache(data) {
  try {
    const cacheItem = {
      timestamp: Date.now(),
      data: data
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheItem))
    console.log('dataFetch.js: Data saved to cache')
  } catch (error) {
    console.warn('dataFetch.js: Failed to save data to cache:', error)
    // Clear cache if saving fails (might be due to quota exceeded)
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (e) {
      // Ignore errors on removal
    }
  }
}

function getDataFromCache() {
  try {
    const cacheItem = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (!cacheItem) return null
    
    // Check if cache is expired
    const now = Date.now()
    if (now - cacheItem.timestamp > CACHE_EXPIRY) {
      console.log('dataFetch.js: Cache expired')
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    console.log('dataFetch.js: Using cached data from', new Date(cacheItem.timestamp).toLocaleTimeString())
    return cacheItem.data
  } catch (error) {
    console.warn('dataFetch.js: Error reading from cache:', error)
    return null
  }
}

// Wrapper function that uses cache when available
async function fetchDataWithCaching(forceFresh = false) {
  // Check for cached data first, unless forceFresh is true
  if (!forceFresh) {
    const cachedData = getDataFromCache()
    if (cachedData) {
      return cachedData
    }
  }
  
  // If no cache or forceFresh, fetch from API
  const freshData = await fetchDataFromSheet()
  
  // Save the fresh data to cache
  saveDataToCache(freshData)
  
  return freshData
}

export { fetchDataFromSheet, fetchDataWithCaching, serialNumberToDate }

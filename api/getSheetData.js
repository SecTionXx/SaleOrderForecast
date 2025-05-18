// api/getSheetData.js
// (Serverless API for Vercel/Netlify)

// Using node-fetch v2 for compatibility
const fetch = require("node-fetch")

// Load environment variables securely
require("dotenv").config()

// Import secure environment handler and config
const env = require("../js/utils/envHandler")
const config = require("../js/config")

// Import validation and sanitization utilities
const { sanitizeInputs, setSecurityHeaders } = require("../js/utils/inputValidationMiddleware")

// Import caching service
const { cacheStore, generateCacheKey } = require("./services/cacheService")

// Import data processing service
const dataProcessingService = require("./services/dataProcessingService")

// --- Get Environment Variables Securely ---
// Using getSensitiveEnv for API key to prevent accidental logging
const apiKey = env.getSensitiveEnv("GOOGLE_API_KEY")
const sheetId = env.getEnv("GOOGLE_SHEET_ID")
const sheetName = env.getEnv("SHEET_NAME", "Sheet1")
const sheetRange = env.getEnv("SHEET_RANGE", "A2:N")

// --- Serverless Function Handler ---
module.exports = async (req, res) => {
  console.log("Backend: /api/getSheetData invoked...")
  
  // Start timing for performance monitoring
  const startTime = Date.now()

  // Debug environment for troubleshooting (safely masks sensitive values)
  console.log("Backend: Environment Check:", {
    nodeEnv: env.getEnv("NODE_ENV"),
    hasApiKey: !!apiKey,
    hasSheetId: !!sheetId,
    // Only show prefix of API key for debugging, never the full key
    apiKeyPrefix: apiKey ? apiKey.substring(0, 4) + "..." : "undefined",
    // Don't show full sheet ID in logs
    sheetIdPrefix: sheetId ? sheetId.substring(0, 8) + "..." : "undefined",
    sheetName,
    sheetRange,
  })

  // --- Security: Validate Environment Variables ---
  if (!apiKey || !sheetId) {
    console.error(
      "Backend Error: Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID environment variables."
    )
    res
      .status(500)
      .json({ error: "Server configuration error. Please check logs." })
    return
  }

  // --- CORS Headers ---
  // Use a more restrictive CORS policy in production
  const allowedOrigin = env.getEnv("NODE_ENV") === 'production' 
    ? env.getEnv("ALLOWED_ORIGIN", 'https://yourproductiondomain.com')
    : "*" // For development
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // --- Handle CORS Preflight (OPTIONS) Request ---
  if (req.method === "OPTIONS") {
    console.log("Backend: Handling OPTIONS preflight request.")
    res.status(200).end()
    return
  }
  
  // --- Check Cache First ---
  // Generate cache key based on query parameters and sheet configuration
  const cacheKey = generateCacheKey(`sheets-${sheetId}-${sheetName}-${sheetRange}`, req.query);
  
  // Skip cache if explicitly requested with cache=false query parameter
  const skipCache = req.query.cache === 'false';
  
  if (!skipCache && config.googleSheets.cacheEnabled) {
    const cachedData = cacheStore.get(cacheKey);
    
    if (cachedData) {
      console.log(`Backend: Cache hit for Google Sheets data. Returning cached data.`);
      
      // Add cache metadata to response
      const responseWithMeta = {
        ...cachedData,
        _metadata: {
          fromCache: true,
          cacheTime: new Date().toISOString(),
          responseTime: Date.now() - startTime
        }
      };
      
      res.status(200).json(responseWithMeta);
      return;
    }
    
    console.log(`Backend: Cache miss for Google Sheets data. Fetching from API.`);
  } else if (skipCache) {
    console.log(`Backend: Cache skip requested. Fetching fresh data from API.`);
  }

  // --- Handle Incorrect Method ---
  if (req.method !== "GET") {
    console.warn(`Backend: Method ${req.method} not allowed.`)
    res.setHeader("Allow", ["GET", "OPTIONS"])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
    return
  }

  // --- Validate and sanitize query parameters ---
  const queryParams = {};
  if (req.query) {
    // Sanitize all query parameters
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      if (typeof value === 'string') {
        // Apply sanitization to prevent injection attacks
        queryParams[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;')
          .replace(/`/g, '&#96;');
      } else {
        queryParams[key] = value;
      }
    });
  }
  
  // --- Prepare Google Sheets API Request ---
  // Use sanitized parameters for range construction
  const sanitizedSheetName = sheetName.replace(/[^\w\s]/gi, '');
  const sanitizedSheetRange = sheetRange.replace(/[^\w\d:]/gi, '');
  const range = `${sanitizedSheetName}!${sanitizedSheetRange}`
  
  // Build URL with sensitive data handled securely
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`
  
  // Create URL parameters - API key is sensitive and should be handled carefully
  const params = new URLSearchParams({
    key: apiKey, // This is sensitive but required for the API call
    majorDimension: "ROWS",
    valueRenderOption: "UNFORMATTED_VALUE",
  })
  
  // Final API URL - never log this full URL as it contains the API key
  const apiUrl = `${baseUrl}?${params}`
  
  // Log safe version of URL (without API key) for debugging
  const safeLogUrl = `${baseUrl}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&key=[REDACTED]`
  console.log(`Backend: Fetching Google Sheets data from: ${safeLogUrl}`)

  console.log(`Backend: Fetching Google Sheets data from range: ${range}...`)
  
  // Apply rate limiting to prevent abuse
  const requestsPerMinute = env.getNumEnv("API_REQUESTS_PER_MINUTE", 60)
  const currentTime = Date.now()
  
  // Simple in-memory rate limiting (would use Redis or similar in production)
  if (global.lastRequestTime && (currentTime - global.lastRequestTime) < (60000 / requestsPerMinute)) {
    console.warn("Rate limit exceeded for Google Sheets API")
    res.status(429).json({ error: "Too many requests. Please try again later." })
    return
  }
  
  // Update last request time
  global.lastRequestTime = currentTime

  try {
    // --- Make the API Call ---
    const googleResponse = await fetch(apiUrl)
    const data = await googleResponse.json()

    console.log("Backend: Google Sheets API Status:", googleResponse.status)

    // --- Handle Google API Errors ---
    if (!googleResponse.ok) {
      const errorMessage = data?.error?.message || `Google Sheets API error! Status: ${googleResponse.status}`;
      const errorCode = data?.error?.code || `GOOGLE_API_ERROR_${googleResponse.status}`;
      const errorDetails = data?.error?.details || null;
      
      console.error(
        "Backend: Google Sheets API Error Response:",
        JSON.stringify(data?.error || {}, null, 2)
      );
      
      // Return standardized error response
      res.status(googleResponse.status || 500).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // --- Success: Send Data to Frontend ---
    console.log(
      `Backend: Successfully fetched ${
        data.values ? data.values.length : 0
      } rows.`
    )
    
    // Sanitize the response data to prevent XSS
    let sanitizedValues = [];
    if (data.values && Array.isArray(data.values)) {
      sanitizedValues = data.values.map(row => {
        if (Array.isArray(row)) {
          return row.map(cell => {
            // Sanitize string values to prevent XSS
            if (typeof cell === 'string') {
              return cell
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .replace(/`/g, '&#96;');
            }
            return cell;
          });
        }
        return row;
      });
    }
    
    // Process data using server-side business logic
    const processedData = dataProcessingService.processSheetData(sanitizedValues);
    
    // Prepare response data
    const responseData = {
      success: true,
      data: {
        values: sanitizedValues || [],
        processed: processedData,
        rowCount: sanitizedValues.length,
        timestamp: new Date().toISOString(),
        source: 'google_sheets'
      },
      message: 'Data retrieved successfully',
      _metadata: {
        fromCache: false,
        responseTime: Date.now() - startTime
      }
    };
    
    // Store in cache if caching is enabled
    if (config.googleSheets.cacheEnabled && !skipCache) {
      // Calculate TTL based on data size and configuration
      const dataSize = JSON.stringify(responseData).length;
      const sizeFactor = dataSize > 1000000 ? 0.5 : 1; // Reduce TTL for large responses
      const cacheTTL = config.googleSheets.cacheTTL * sizeFactor;
      
      cacheStore.set(cacheKey, responseData, cacheTTL);
      console.log(`Backend: Cached Google Sheets data with TTL ${cacheTTL}ms`);
    }
    
    // Return standardized success response
    res.status(200).json(responseData)
  } catch (error) {
    // --- Handle Network or Other Unexpected Errors ---
    console.error(
      "Backend: Error fetching/processing Google Sheet data:",
      error
    )
    
    // Determine error type and code
    let errorCode = 'SERVER_ERROR';
    let statusCode = 500;
    
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
      errorCode = 'TIMEOUT_ERROR';
      statusCode = 504; // Gateway Timeout
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorCode = 'CONNECTION_ERROR';
      statusCode = 503; // Service Unavailable
    } else if (error.message && error.message.includes('rate limit')) {
      errorCode = 'RATE_LIMIT_ERROR';
      statusCode = 429; // Too Many Requests
    }
    
    // Return standardized error response
    res.status(statusCode).json({
      success: false,
      error: 'Failed to fetch data from Google Sheets',
      code: errorCode,
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while processing your request' 
        : `Internal Server Error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

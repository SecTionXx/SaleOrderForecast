/**
 * forecast.js - Sales Forecasting API Endpoint
 * Provides server-side forecasting capabilities using the data processing service
 */

// Using node-fetch v2 for compatibility
const fetch = require("node-fetch");

// Load environment variables securely
require("dotenv").config();

// Import secure environment handler and config
const env = require("../js/utils/envHandler");
const config = require("../js/config");
const { authenticate, authorize } = require('../js/auth/authMiddleware');
const { sanitizeInputs, setSecurityHeaders } = require("../js/utils/inputValidationMiddleware");

// Import data processing service
const dataProcessingService = require('./services/dataProcessingService');

// --- Serverless Function Handler ---
module.exports = async (req, res) => {
  console.log("Backend: /api/forecast invoked...");

  // --- Security: Set Headers ---
  setSecurityHeaders(res);

  // --- CORS Headers ---
  // Use a more restrictive CORS policy in production
  const allowedOrigin = env.getEnv("NODE_ENV") === 'production' 
    ? env.getEnv("ALLOWED_ORIGIN", 'https://yourproductiondomain.com')
    : "*"; // For development
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // --- Handle CORS Preflight (OPTIONS) Request ---
  if (req.method === "OPTIONS") {
    console.log("Backend: Handling OPTIONS preflight request.");
    res.status(200).end();
    return;
  }

  // --- Handle Incorrect Method ---
  if (req.method !== "POST") {
    console.warn(`Backend: Method ${req.method} not allowed.`);
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    res.status(405).json({ 
      success: false,
      error: `Method ${req.method} Not Allowed`,
      code: 'METHOD_NOT_ALLOWED',
      message: 'This endpoint only accepts POST requests',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // --- Authentication & Authorization ---
  try {
    // Verify JWT token
    const user = await authenticate(req, res);
    if (!user) {
      return; // Response already sent by authenticate middleware
    }

    // Check if user has permission to access forecasting
    const hasPermission = await authorize(user, 'forecasting:read');
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Access Denied',
        code: 'FORBIDDEN',
        message: 'You do not have permission to access forecasting features',
        timestamp: new Date().toISOString()
      });
      return;
    }
  } catch (authError) {
    console.error("Backend: Authentication error:", authError);
    res.status(401).json({
      success: false,
      error: 'Authentication Failed',
      code: 'UNAUTHORIZED',
      message: 'Please log in to access this resource',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // --- Validate and sanitize request body ---
  try {
    // Ensure request has a body
    if (!req.body || !req.body.salesData) {
      res.status(400).json({
        success: false,
        error: 'Missing Required Data',
        code: 'VALIDATION_ERROR',
        message: 'Request must include salesData array',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Sanitize input data
    const sanitizedBody = sanitizeInputs(req.body);
    const { salesData, options = {} } = sanitizedBody;

    // Validate data format
    if (!Array.isArray(salesData)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Data Format',
        code: 'VALIDATION_ERROR',
        message: 'salesData must be an array',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Apply rate limiting to prevent abuse
    const requestsPerMinute = env.getNumEnv("API_REQUESTS_PER_MINUTE", 60);
    const currentTime = Date.now();
    
    // Simple in-memory rate limiting (would use Redis or similar in production)
    if (global.lastForecastTime && (currentTime - global.lastForecastTime) < (60000 / requestsPerMinute)) {
      console.warn("Rate limit exceeded for forecast API");
      res.status(429).json({
        success: false,
        error: 'Rate Limit Exceeded',
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Update last request time
    global.lastForecastTime = currentTime;

    // --- Process the forecast request ---
    try {
      console.log(`Backend: Processing forecast request with ${salesData.length} data points`);
      
      // Calculate forecast using server-side business logic
      const forecastResults = dataProcessingService.calculateSalesForecast(salesData, options);
      
      // Return successful response with forecast data
      res.status(200).json({
        success: true,
        data: forecastResults,
        message: 'Forecast generated successfully'
      });
    } catch (processingError) {
      console.error("Backend: Error processing forecast:", processingError);
      
      res.status(422).json({
        success: false,
        error: 'Forecast Processing Error',
        code: 'PROCESSING_ERROR',
        message: processingError.message || 'Error generating forecast',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // --- Handle Unexpected Errors ---
    console.error("Backend: Unexpected error in forecast API:", error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred while processing your request' 
        : `Error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
};

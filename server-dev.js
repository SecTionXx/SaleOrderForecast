// server-dev.js - Development server entry point
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { google } = require('googleapis');
const googleSheets = require('./googleSheets');

// Ensure logs directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Create a write stream to log file
const logStream = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' });

// Override console.log to also write to file
const originalConsoleLog = console.log;
console.log = function() {
  const message = Array.from(arguments).join(' ');
  logStream.write(`[${new Date().toISOString()}] ${message}\n`);
  originalConsoleLog.apply(console, arguments);
};

// Override console.error
const originalConsoleError = console.error;
console.error = function() {
  const message = Array.from(arguments).join(' ');
  logStream.write(`[${new Date().toISOString()}] ERROR: ${message}\n`);
  originalConsoleError.apply(console, arguments);
};

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT from environment or default to 3000

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set MIME types for static files
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.set('Content-Type', 'application/javascript; charset=UTF-8');
  } else if (req.path.endsWith('.css')) {
    res.set('Content-Type', 'text/css; charset=UTF-8');
  } else if (req.path.endsWith('.html')) {
    res.set('Content-Type', 'text/html; charset=UTF-8');
  } else if (req.path.endsWith('.json')) {
    res.set('Content-Type', 'application/json; charset=UTF-8');
  } else if (req.path.endsWith('.svg')) {
    res.set('Content-Type', 'image/svg+xml');
  }
  next();
});

// Serve static files from the root directory
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    // Cache static assets for 1 day
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || 
        filePath.endsWith('.png') || filePath.endsWith('.jpg') || 
        filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || 
        filePath.endsWith('.svg') || filePath.endsWith('.ico') || 
        filePath.endsWith('.woff') || filePath.endsWith('.woff2') || 
        filePath.endsWith('.ttf') || filePath.endsWith('.eot')) {
      res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    } else {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
}));

// API Routes - Must come before static file serving
app.get('/api/sheet-data', async (req, res) => {
  try {
    console.log('\n=== /api/sheet-data endpoint called ===');
    console.log('Environment variables:');
    console.log(`- GOOGLE_SHEET_ID: ${process.env.GOOGLE_SHEET_ID ? 'Set' : 'Not set'}`);
    console.log(`- GOOGLE_SHEETS_API_KEY: ${process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set'}`);
    
    console.log('\nFetching data from Google Sheets...');
    const data = await googleSheets.getRows();
    
    console.log(`\nSuccessfully fetched ${data.length} rows`);
    if (data.length > 0) {
      console.log('Sample row:', JSON.stringify(data[0], null, 2));
    }
    
    res.json({
      success: true,
      data: data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('\nError in /api/sheet-data endpoint:', error);
    if (error.response) {
      console.error('Google Sheets API response error:');
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch data from Google Sheets',
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint to get sheet data
app.get('/api/getSheetData', async (req, res) => {
  try {
    console.log('Received request to /api/getSheetData');
    const rows = await googleSheets.getRows();
    
    console.log('Raw data from getRows():', JSON.stringify(rows, null, 2));
    
    if (!Array.isArray(rows)) {
      console.error('Error: getRows() did not return an array:', rows);
      return res.status(500).json({ error: 'Invalid data format from Google Sheets' });
    }
    
    // Transform data to match frontend's expected format
    const values = rows.map((row, index) => {
      const transformed = {
        0: row.dealId || `DEAL-${index + 1}`,
        1: row.dateCreated || '',
        2: row.customerName || 'N/A',
        3: row.projectName || 'N/A',
        4: parseFloat(row.totalValue) || 0,
        5: parseInt(row.probabilityPercent) || 0,
        6: parseFloat(row.weightedValue) || 0,
        7: row.dealStage || 'Unknown',
        8: row.expectedCloseDate || '',
        9: row.salesRep || 'Unknown',
        10: row.lastUpdated || new Date().toISOString().split('T')[0],
        11: row.notes || '',
        12: row.actualCloseDate || ''
      };
      
      // Calculate weighted value if not provided
      if ((!transformed[6] || transformed[6] === 0) && transformed[4] && transformed[5]) {
        transformed[6] = (transformed[4] * transformed[5]) / 100;
      }
      
      return transformed;
    });
    
    console.log(`Sending ${values.length} rows of data`);
    console.log('Sample transformed data:', JSON.stringify(values[0], null, 2));
    
    // Return in the format expected by the frontend
    res.json({ values });
  } catch (error) {
    console.error('Error in /api/getSheetData:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sheet data',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve loading states demo page
app.get('/loading-demo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'loading-demo.html'));
});

// Fallback route - must be after all other routes
app.use((req, res) => {
  const url = req.originalUrl;
  
  // Log the 404 for debugging
  console.log(`404 Not Found: ${url}`);
  
  // Special handling for JavaScript module imports
  if (url.endsWith('.js')) {
    // For module imports, check if the file exists in a different location
    const possiblePaths = [
      path.join(__dirname, url),
      path.join(__dirname, url.replace('/js/', '/js/utils/')),
      path.join(__dirname, url.replace('/js/', '/js/components/')),
      path.join(__dirname, url.replace('/js/', '/js/core/')),
      path.join(__dirname, url.replace('/js/', '/js/auth/')),
      path.join(__dirname, 'node_modules', url)
    ];
    
    // Try each possible path
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`Found module at: ${filePath}`);
        return res.sendFile(filePath);
      }
    }
    
    // If module not found, return a proper JavaScript error
    res.type('application/javascript');
    return res.status(404).send(`console.error('Module not found: ${url}');`);
  }
  
  // For HTML requests, serve the index.html (SPA behavior)
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  
  // For API or other requests, return JSON error
  res.status(404).json({ error: 'Not found', path: url });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Log configuration
  console.log('Application configuration:', {
    api: {
      baseUrl: process.env.API_BASE_URL || '/api',
      timeout: process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT) : 60000
    },
    auth: {
      enabled: process.env.AUTH_ENABLED === 'true',
      tokenExpiry: process.env.JWT_EXPIRY || '2h',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    }
  });
  
  // Test the Google Sheets connection
  console.log('Testing Google Sheets connection...');
  googleSheets.getRows()
    .then(rows => {
      console.log(`Successfully connected to Google Sheets. Found ${rows.length} rows.`);
      if (rows.length > 0) {
        console.log('Sample row:', JSON.stringify(rows[0], null, 2));
      }
    })
    .catch(error => {
      console.error('Error connecting to Google Sheets:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    });
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// server.js - Local development server
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// Use Express's built-in JSON and URL-encoded parsers instead of body-parser
require('dotenv').config();

// Import authentication routes and middleware
const authRoutes = require('./api/auth');
const { authenticate, authorize, rateLimit, cors: corsMiddleware } = require('./js/auth/authMiddleware');
const config = require('./js/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true, // Allow the origin that made the request
  credentials: true // Allow cookies to be sent
}));
app.use(express.json()); // Use Express's built-in JSON parser
app.use(express.urlencoded({ extended: true })); // Use Express's built-in URL-encoded parser
app.use(cookieParser()); // Parse cookies

// Set MIME types for JavaScript files
const setJavaScriptMimeType = (req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.set('Content-Type', 'application/javascript; charset=UTF-8');
  }
  next();
};

// Apply MIME type middleware
app.use(setJavaScriptMimeType);

// Serve static files
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript; charset=UTF-8');
    }
    // Set Cache-Control headers for better performance
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  }
}));

// Rate limiting for API requests
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
}));

// Authentication routes
app.use('/api/auth', authRoutes);

// Mock data for the demo
let mockData;
try {
  mockData = require('./mockData.json');
} catch (error) {
  console.warn('mockData.json not found, creating an empty mock data object');
  mockData = { values: [] };
}

// API endpoint to get sheet data (now protected with authentication)
app.get('/api/getSheetData', authenticate, (req, res) => {
  try {
    // In a real app, this would fetch data from Google Sheets
    // For demo, we'll return mock data
    res.json(mockData);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
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
  // Check if the request is for an HTML page
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Return error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'server_error' : err.stack
  });
});

app.listen(PORT, () => {
  console.log(`
Server running at http://localhost:${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/getSheetData`);
  console.log(`Authentication endpoint available at http://localhost:${PORT}/api/auth/login`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

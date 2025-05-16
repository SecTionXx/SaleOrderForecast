// server.js - Local development server
const express = require('express');
const path = require('path');
const cors = require('cors');
// Use Express's built-in JSON and URL-encoded parsers instead of body-parser
require('dotenv').config();

// Import authentication routes and middleware
const authRoutes = require('./auth/authRoutes');
const { authenticate } = require('./auth/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Use Express's built-in JSON parser
app.use(express.urlencoded({ extended: true })); // Use Express's built-in URL-encoded parser

// Serve static files with proper MIME types for ES modules
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path, stat) => {
    // Set the correct MIME type for JavaScript modules
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript; charset=UTF-8');
    }
    // Set Cache-Control headers for better performance
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  }
}));

// Middleware to set proper MIME types for all JavaScript files
app.use(function(req, res, next) {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// Specific routes for JavaScript module files that were causing errors
app.get('/dealForm.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'dealForm.js'));
});

app.get('/historyTracker.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'historyTracker.js'));
});

app.get('/emailReports.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'emailReports.js'));
});

app.get('/exportData.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'exportData.js'));
});

app.get('/dataFetch.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'dataFetch.js'));
});

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

// Serve index.html for all other routes (except for API routes)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
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

app.listen(PORT, () => {
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/getSheetData`);
  console.log(`Authentication endpoint available at http://localhost:${PORT}/api/auth/login`);
});

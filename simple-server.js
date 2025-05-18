/**
 * simple-server.js - A lightweight Express server for local development
 * This server bypasses the problematic authentication services while they're being fixed
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware for setting proper MIME types
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript; charset=UTF-8');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css; charset=UTF-8');
  } else if (req.path.endsWith('.json')) {
    res.type('application/json; charset=UTF-8');
  } else if (req.path.endsWith('.svg')) {
    res.type('image/svg+xml');
  }
  next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    // Set proper MIME types for different file extensions
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filePath.endsWith('.css')) {
      res.set('Content-Type', 'text/css; charset=UTF-8');
    } else if (filePath.endsWith('.html')) {
      res.set('Content-Type', 'text/html; charset=UTF-8');
    } else if (filePath.endsWith('.json')) {
      res.set('Content-Type', 'application/json; charset=UTF-8');
    } else if (filePath.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
  }
}));

// Mock API endpoint for authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock authentication
  if (email && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: 1,
        name: 'Demo User',
        email: email,
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Mock API endpoint for token verification
app.post('/api/auth/verify', (req, res) => {
  res.json({
    success: true,
    valid: true
  });
});

// Mock API endpoint for getting sheet data
app.get('/api/getSheetData', (req, res) => {
  try {
    // Try to read the mockData.json file
    const mockDataPath = path.join(__dirname, 'mockData.json');
    if (fs.existsSync(mockDataPath)) {
      const mockData = require(mockDataPath);
      res.json(mockData);
    } else {
      // If file doesn't exist, return empty data
      res.json({ values: [] });
    }
  } catch (error) {
    console.error('Error serving mock data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/loading-demo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'loading-demo.html'));
});

// Special handling for JavaScript module imports
app.use((req, res, next) => {
  const url = req.originalUrl;
  
  if (url.endsWith('.js')) {
    // For module imports, check if the file exists in a different location
    const possiblePaths = [
      path.join(__dirname, url),
      path.join(__dirname, url.replace('/js/', '/js/utils/')),
      path.join(__dirname, url.replace('/js/', '/js/components/')),
      path.join(__dirname, url.replace('/js/', '/js/core/')),
      path.join(__dirname, url.replace('/js/', '/js/auth/')),
      path.join(__dirname, url.replace('/js/', '/js/charts/')),
      path.join(__dirname, 'node_modules', url)
    ];
    
    // Try each possible path
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`Found module at: ${filePath}`);
        return res.sendFile(filePath);
      }
    }
  }
  
  next();
});

// Fallback route for SPA
app.use((req, res) => {
  // For HTML requests, serve the index.html
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found', path: req.originalUrl });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`SaleOrderForecast server running at http://localhost:${PORT}`);
  console.log('Ready to serve your SaleOrderForecast app!');
  console.log('Press Ctrl+C to stop the server');
});

# SaleOrderForecast Debugging Guide

This guide provides comprehensive instructions for debugging and troubleshooting common issues in the SaleOrderForecast application.

## Table of Contents

1. [Common Issues and Solutions](#common-issues-and-solutions)
2. [Using the Debug Console](#using-the-debug-console)
3. [Authentication Troubleshooting](#authentication-troubleshooting)
4. [API and Data Fetching Issues](#api-and-data-fetching-issues)
5. [Chart Rendering Problems](#chart-rendering-problems)
6. [Performance Optimization](#performance-optimization)
7. [Browser Compatibility](#browser-compatibility)

## Common Issues and Solutions

### Application Not Loading

**Symptoms**: Blank screen, loading indicator never disappears, or JavaScript errors in console.

**Solutions**:

1. **Clear Browser Cache and Cookies**:
   - In Chrome: Settings → Privacy and Security → Clear browsing data
   - In Firefox: Options → Privacy & Security → Cookies and Site Data → Clear Data

2. **Check JavaScript Console for Errors**:
   - Open browser developer tools (F12 or Ctrl+Shift+I)
   - Go to the Console tab to view errors

3. **Enable Debug Mode**:
   - Add `?debug=true` to the URL (e.g., `http://localhost:3000/?debug=true`)
   - Or run `localStorage.setItem('debug_mode', 'true')` in the browser console

4. **Reset Application State**:
   - Run `localStorage.clear()` in the browser console (will log you out)
   - Refresh the page

### Authentication Issues

**Symptoms**: Continuous redirects to login page, "Unauthorized" errors, or session expiration.

**Solutions**:

1. **Clear Authentication Data**:
   ```javascript
   localStorage.removeItem('orderforecast_auth_token');
   localStorage.removeItem('orderforecast_user');
   ```

2. **Check Token Format**:
   - Valid JWT tokens should have three parts separated by dots
   - Run this in console to check: `console.log(localStorage.getItem('orderforecast_auth_token'))`

3. **Verify Server Authentication Endpoints**:
   - Ensure `/api/auth/verify` and `/api/auth/refresh` endpoints are working
   - Check network requests in browser developer tools

### Data Loading Issues

**Symptoms**: Empty charts, "Failed to fetch" errors, or data not displaying.

**Solutions**:

1. **Check API Responses**:
   - Look for network requests to `/api/getSheetData` in browser developer tools
   - Verify the response status and content

2. **Clear Data Cache**:
   ```javascript
   localStorage.removeItem('orderforecast_data_cache');
   ```

3. **Verify Google Sheets API Configuration**:
   - Check that environment variables are set correctly:
     - `GOOGLE_API_KEY`
     - `GOOGLE_SHEET_ID`
     - `SHEET_NAME`
     - `SHEET_RANGE`

4. **Force Fresh Data Fetch**:
   - Add `?cache=false` to the URL (e.g., `http://localhost:3000/?cache=false`)

## Using the Debug Console

The SaleOrderForecast application includes a built-in debug console to help troubleshoot issues.

### Enabling Debug Mode

1. **Via URL Parameter**:
   - Add `?debug=true` to the URL (e.g., `http://localhost:3000/?debug=true`)

2. **Via Local Storage**:
   - Run `localStorage.setItem('debug_mode', 'true')` in the browser console
   - Refresh the page

3. **Via Keyboard Shortcut**:
   - Press `Ctrl+Shift+D` when the application is loaded

### Using the Debug Console

1. **Viewing Debug Information**:
   - Click on different tabs to view different categories of debug information
   - API calls, errors, authentication events, etc.

2. **Accessing Debug Tools**:
   - In the browser console, you can access debug tools via `window._debugTool`
   - Example: `window._debugTool.showConsole()`

3. **Available Debug Commands**:
   - `window._debugTool.enable()` - Enable debug mode
   - `window._debugTool.disable()` - Disable debug mode
   - `window._debugTool.clear()` - Clear debug information
   - `window._debugTool.log(category, message, data)` - Add debug entry
   - `window._debugTool.getInfo()` - Get all debug information
   - `window._debugTool.showConsole()` - Show debug console

## Authentication Troubleshooting

### Token Validation

JWT tokens should have three parts separated by dots. You can decode and inspect the token using the browser console:

```javascript
// Get the token
const token = localStorage.getItem('orderforecast_auth_token');

// Split the token into parts
const parts = token.split('.');

// Decode the payload (middle part)
const payload = JSON.parse(atob(parts[1]));

// Check expiration time
const expiryDate = new Date(payload.exp * 1000);
const isExpired = expiryDate < new Date();

console.log('Token payload:', payload);
console.log('Expiry date:', expiryDate);
console.log('Is expired:', isExpired);
```

### Authentication Flow

The authentication flow works as follows:

1. User logs in → Token stored in `localStorage`
2. On page load → Token validated via `/api/auth/verify`
3. If token invalid → Attempt refresh via `/api/auth/refresh`
4. If refresh fails → Redirect to login page

Common issues in this flow:

- Missing or invalid refresh token
- Server-side token validation errors
- CORS issues with authentication endpoints

## API and Data Fetching Issues

### Google Sheets API Troubleshooting

1. **Check API Key Permissions**:
   - Ensure the API key has access to Google Sheets API
   - Verify there are no restrictions on the API key

2. **Verify Sheet Access**:
   - The Google Sheet must be publicly accessible or shared with the service account
   - Test the API manually using a tool like Postman or cURL

3. **API Quotas and Limits**:
   - Google Sheets API has usage limits
   - Check for quota errors in the API response

### Data Processing Issues

If data is fetched but not displayed correctly:

1. **Check Data Format**:
   - Data should be in a tabular format with headers in the first row
   - Required columns: date, amount, stage, salesRep

2. **Data Type Conversion**:
   - Dates should be in a recognizable format (YYYY-MM-DD recommended)
   - Amounts should be numbers without currency symbols
   - Probability values should be between 0 and 1 (or 0-100%)

3. **Empty or Null Values**:
   - The application handles empty values, but too many might cause issues
   - Check for null or undefined values in the data

## Chart Rendering Problems

### Chart.js Troubleshooting

1. **Library Loading Issues**:
   - Ensure Chart.js is properly loaded before any chart initialization
   - Check for script loading errors in the console

2. **Canvas Rendering**:
   - Charts require HTML5 Canvas support
   - Verify that canvas elements exist and are properly sized

3. **Data Format for Charts**:
   - Charts expect specific data structures
   - Use the debug console to inspect the data being passed to charts

### Common Chart Errors

1. **"Failed to create chart: can't acquire context"**:
   - Canvas element not found or not properly rendered
   - Check that the chart container exists in the DOM

2. **"No data to display"**:
   - Data is empty or not in the expected format
   - Verify that data processing is working correctly

3. **"Uncaught TypeError: Cannot read property 'length' of undefined"**:
   - Data structure is missing expected properties
   - Check the data transformation process

## Performance Optimization

If the application is slow or unresponsive:

1. **Reduce Data Size**:
   - Limit the range of data fetched from Google Sheets
   - Implement pagination for large datasets

2. **Optimize Chart Rendering**:
   - Use the chart optimization features
   - Reduce the number of data points displayed

3. **Browser Resource Usage**:
   - Check memory usage in browser task manager
   - Look for memory leaks using the Performance tab in developer tools

## Browser Compatibility

The SaleOrderForecast application requires:

- Modern browser with ES6 support
- localStorage support
- Fetch API support
- Canvas support for charts

If you encounter issues in specific browsers:

1. **Check Browser Version**:
   - Ensure you're using the latest version of Chrome, Firefox, Edge, or Safari

2. **Feature Detection**:
   - The application includes feature detection for critical features
   - Warning banners will appear for unsupported features

3. **Polyfills**:
   - For older browsers, you may need to add polyfills
   - Consider adding core-js or similar polyfill library

## Advanced Debugging Techniques

### Network Request Inspection

1. **Capture Network Logs**:
   - In browser developer tools, go to the Network tab
   - Filter by "XHR" or "Fetch" to see API requests
   - Look for failed requests (red) or slow requests

2. **Request Headers**:
   - Check that Authorization headers are being sent correctly
   - Verify Content-Type headers for POST requests

3. **Response Analysis**:
   - Examine response bodies for error messages
   - Check HTTP status codes for errors

### JavaScript Error Tracking

1. **Unhandled Exceptions**:
   - The application logs unhandled exceptions
   - Check the "errors" tab in the debug console

2. **Promise Rejections**:
   - Unhandled promise rejections are tracked
   - Look for "Unhandled promise rejection" in the console

3. **Stack Traces**:
   - Error stack traces can help pinpoint the source of errors
   - The debug console preserves stack traces for errors

## Getting Help

If you continue to experience issues:

1. Check the project documentation for updates
2. Collect debug information using the debug console
3. Include specific error messages and steps to reproduce when seeking help

---

This debugging guide is a living document and will be updated as new issues and solutions are identified.

Last updated: May 18, 2025

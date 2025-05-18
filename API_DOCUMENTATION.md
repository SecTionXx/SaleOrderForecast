# SaleOrderForecast API Documentation

This document provides comprehensive information about the SaleOrderForecast API endpoints, their usage, parameters, and response formats.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [Get Sheet Data](#get-sheet-data)
   - [Sales Forecast](#sales-forecast)
   - [Category Analysis](#category-analysis)
3. [Error Handling](#error-handling)
4. [Caching Strategy](#caching-strategy)
5. [Rate Limiting](#rate-limiting)
6. [Security Considerations](#security-considerations)

## Authentication

All API endpoints require authentication using JSON Web Tokens (JWT).

### Obtaining a Token

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 7200
}
```

### Using the Token

Include the token in the Authorization header for all API requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refreshing the Token

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## API Endpoints

### Get Sheet Data

Retrieves data from Google Sheets with caching support.

```
GET /api/getSheetData
```

**Query Parameters:**
- `cache` (optional): Set to "false" to bypass cache and fetch fresh data

**Response:**
```json
{
  "success": true,
  "data": {
    "values": [...],
    "processed": {
      "headers": [...],
      "rows": [...],
      "totalRows": 42
    },
    "rowCount": 42,
    "timestamp": "2025-05-17T01:23:45.678Z",
    "source": "google_sheets"
  },
  "message": "Data retrieved successfully",
  "_metadata": {
    "fromCache": false,
    "responseTime": 235
  }
}
```

### Sales Forecast

Generates sales forecasts based on historical data using server-side business logic.

```
POST /api/forecast
```

**Request Body:**
```json
{
  "salesData": [
    { "date": "2025-01-01", "value": 1000, "category": "Product A" },
    { "date": "2025-02-01", "value": 1200, "category": "Product A" },
    { "date": "2025-03-01", "value": 1150, "category": "Product A" }
  ],
  "options": {
    "forecastPeriods": 3,
    "confidenceLevel": 0.95,
    "seasonalityPattern": "auto",
    "includeOutliers": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "date": "2025-04-01T00:00:00.000Z",
        "value": 1250,
        "lower": 1150,
        "upper": 1350
      },
      {
        "date": "2025-05-01T00:00:00.000Z",
        "value": 1300,
        "lower": 1150,
        "upper": 1450
      },
      {
        "date": "2025-06-01T00:00:00.000Z",
        "value": 1350,
        "lower": 1150,
        "upper": 1550
      }
    ],
    "trend": {
      "slope": 75,
      "intercept": 975,
      "firstDate": "2025-01-01T00:00:00.000Z"
    },
    "seasonality": {
      "pattern": "monthly",
      "period": 1
    },
    "dataPoints": 3,
    "generatedAt": "2025-05-17T01:23:45.678Z"
  },
  "message": "Forecast generated successfully"
}
```

### Category Analysis

Analyzes sales data by category using server-side business logic.

```
POST /api/categoryAnalysis
```

**Request Body:**
```json
{
  "salesData": [
    { "date": "2025-01-01", "value": 1000, "category": "Product A" },
    { "date": "2025-02-01", "value": 1200, "category": "Product A" },
    { "date": "2025-01-01", "value": 800, "category": "Product B" },
    { "date": "2025-02-01", "value": 850, "category": "Product B" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Product A",
        "totalSales": 2200,
        "count": 2,
        "average": 1100,
        "median": 1100,
        "growthRate": 20,
        "percentageOfTotal": "72.13"
      },
      {
        "category": "Product B",
        "totalSales": 1650,
        "count": 2,
        "average": 825,
        "median": 825,
        "growthRate": 6.25,
        "percentageOfTotal": "27.87"
      }
    ],
    "totalSales": 3850,
    "topCategory": "Product A",
    "categoryCount": 2,
    "analysisDate": "2025-05-17T01:23:45.678Z"
  },
  "message": "Category analysis completed successfully"
}
```

## Error Handling

All API endpoints use standardized error responses:

```json
{
  "success": false,
  "error": "Error Type",
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "timestamp": "2025-05-17T01:23:45.678Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `PROCESSING_ERROR`: Error processing the request
- `SERVER_ERROR`: Internal server error

## Caching Strategy

The API implements a sophisticated caching strategy to reduce unnecessary calls to external services:

- GET requests are cached by default
- Cache keys are generated based on endpoint and query parameters
- Cache TTL (Time To Live) is configurable and adjusts based on data size
- Cache can be bypassed with `cache=false` query parameter
- Cache metadata is included in responses

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- Default: 60 requests per minute per IP address
- When rate limit is exceeded, the API returns a 429 status code
- Rate limits are configurable in the server configuration

## Security Considerations

The API implements several security measures:

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Security headers (Content-Security-Policy, X-XSS-Protection, etc.)
- Rate limiting
- Secure environment variable handling

For more detailed information about security, please refer to the [SECURITY_GUIDE.md](SECURITY_GUIDE.md) document.

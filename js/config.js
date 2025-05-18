/**
 * config.js - Application Configuration
 * Centralizes configuration settings for the entire application
 * Uses secure environment variable handling to protect sensitive data
 */

const env = require('./utils/envHandler');

// Initialize environment variables securely
const config = {
  // API configuration
  api: {
    baseUrl: env.getEnv('API_BASE_URL', '/api'),
    timeout: env.getNumEnv('API_TIMEOUT', 30000), // 30 seconds
    retryAttempts: env.getNumEnv('API_RETRY_ATTEMPTS', 3),
    retryDelay: env.getNumEnv('API_RETRY_DELAY', 1000), // 1 second
    cacheEnabled: env.getBoolEnv('API_CACHE_ENABLED', true),
    cacheTTL: env.getNumEnv('API_CACHE_TTL', 5 * 60 * 1000), // 5 minutes in milliseconds
    requestLogging: env.getEnv('NODE_ENV') !== 'production',
    errorLogging: true,
    rateLimiting: {
      enabled: env.getBoolEnv('API_RATE_LIMIT_ENABLED', true),
      maxRequests: env.getNumEnv('API_RATE_LIMIT', 100),
      windowMs: env.getNumEnv('API_RATE_LIMIT_WINDOW_MS', 60000) // 1 minute
    }
  },
  
  // Authentication configuration
  auth: {
    // Use getSensitiveEnv for secrets to prevent logging
    jwtSecret: env.getSensitiveEnv('JWT_SECRET', 'development-jwt-secret-do-not-use-in-production', true),
    refreshSecret: env.getSensitiveEnv('REFRESH_SECRET', 'development-refresh-secret-do-not-use-in-production', true),
    tokenExpiry: env.getEnv('TOKEN_EXPIRY', '2h'), // 2 hours
    refreshTokenExpiry: env.getNumEnv('REFRESH_TOKEN_EXPIRY', 7 * 24 * 60 * 60), // 7 days in seconds
    sessionTimeout: env.getNumEnv('SESSION_TIMEOUT', 30 * 60 * 1000), // 30 minutes of inactivity
    maxSessionsPerUser: env.getNumEnv('MAX_SESSIONS_PER_USER', 5),
    passwordMinLength: env.getNumEnv('PASSWORD_MIN_LENGTH', 8),
    passwordRequireUppercase: env.getBoolEnv('PASSWORD_REQUIRE_UPPERCASE', true),
    passwordRequireNumbers: env.getBoolEnv('PASSWORD_REQUIRE_NUMBERS', true),
    passwordRequireSpecial: env.getBoolEnv('PASSWORD_REQUIRE_SPECIAL', true),
    // Security enhancements
    passwordMaxAttempts: env.getNumEnv('PASSWORD_MAX_ATTEMPTS', 5),
    passwordLockoutTime: env.getNumEnv('PASSWORD_LOCKOUT_TIME', 15 * 60 * 1000) // 15 minutes
  },
  
  // Google Sheets API configuration
  googleSheets: {
    // Use getSensitiveEnv for API keys to prevent logging
    apiKey: env.getSensitiveEnv('GOOGLE_API_KEY'),
    spreadsheetId: env.getEnv('GOOGLE_SHEET_ID'),
    sheetName: env.getEnv('SHEET_NAME', 'Sheet1'),
    sheetRange: env.getEnv('SHEET_RANGE', 'A2:N'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    cacheEnabled: env.getBoolEnv('GOOGLE_SHEETS_CACHE_ENABLED', true),
    cacheTTL: env.getNumEnv('GOOGLE_SHEETS_CACHE_TTL', 5 * 60 * 1000) // 5 minutes in milliseconds
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    logFilePath: './logs/app.log',
    maxLogFileSize: 5 * 1024 * 1024, // 5 MB
    maxLogFiles: 5,
    enableRemoteLogging: process.env.NODE_ENV === 'production',
    remoteLoggingEndpoint: process.env.REMOTE_LOGGING_ENDPOINT
  },
  
  // UI configuration
  ui: {
    theme: 'light',
    animationsEnabled: true,
    defaultPageSize: 20,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    currencyFormat: {
      locale: 'en-US',
      currency: 'USD'
    },
    toastDuration: 3000, // 3 seconds
    modalTransitionDuration: 300 // 300 milliseconds
  },
  
  // Feature flags
  features: {
    enableDataExport: true,
    enableAdvancedFiltering: true,
    enableUserManagement: process.env.ENABLE_USER_MANAGEMENT !== 'false',
    enableNotifications: true,
    enableOfflineMode: false,
    enableDarkMode: true
  },
  
  // Performance settings
  performance: {
    enableLazyLoading: true,
    debounceDelay: 300, // 300 milliseconds
    throttleDelay: 100, // 100 milliseconds
    maxItemsPerPage: 100,
    infiniteScrollThreshold: 200, // 200 pixels
    enableVirtualScrolling: true
  },
  
  // Server configuration (for local development)
  server: {
    port: env.getNumEnv('PORT', 3000),
    host: env.getEnv('HOST', 'localhost'),
    cors: {
      origin: env.getEnv('ALLOWED_ORIGIN', env.getEnv('NODE_ENV') === 'production' ? 'https://your-production-domain.com' : '*'),
      methods: env.getEnv('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
      allowedHeaders: env.getEnv('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization')
    },
    rateLimiting: {
      enabled: env.getBoolEnv('RATE_LIMIT_ENABLED', true),
      maxRequests: env.getNumEnv('RATE_LIMIT_MAX_REQUESTS', 100), // 100 requests
      windowMs: env.getNumEnv('RATE_LIMIT_WINDOW_MS', 60 * 1000) // 1 minute
    },
    // Security enhancements
    security: {
      helmet: env.getBoolEnv('USE_HELMET', true),
      xssProtection: env.getBoolEnv('XSS_PROTECTION', true),
      noSniff: env.getBoolEnv('CONTENT_TYPE_NOSNIFF', true),
      hsts: env.getBoolEnv('USE_HSTS', env.getEnv('NODE_ENV') === 'production')
    }
  }
};

/**
 * Safe configuration export function that prevents exposure of sensitive data
 * @returns {Object} - Configuration with sensitive data masked for logging
 */
function getSafeConfig() {
  // Create a deep copy of the config
  const safeCopy = JSON.parse(JSON.stringify(config));
  
  // Mask sensitive fields
  if (safeCopy.auth) {
    safeCopy.auth.jwtSecret = '********';
    safeCopy.auth.refreshSecret = '********';
  }
  
  if (safeCopy.googleSheets) {
    safeCopy.googleSheets.apiKey = safeCopy.googleSheets.apiKey ? '********' : null;
  }
  
  return safeCopy;
}

// Export the configuration and safe access methods
module.exports = config;
module.exports.getSafeConfig = getSafeConfig;

// Log safe configuration in development mode
if (env.getEnv('NODE_ENV') !== 'production') {
  console.log('Application configuration loaded (sensitive data masked):', getSafeConfig());
}

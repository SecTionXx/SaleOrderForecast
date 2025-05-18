/**
 * Browser Compatibility Utilities
 * Provides feature detection and polyfills for cross-browser compatibility
 */

import { logWarn, logError } from './logger.js';

// Minimum supported browser versions
const MIN_BROWSER_VERSIONS = {
  chrome: 80,
  firefox: 74,
  safari: 13.1,
  edge: 80,
  ie: 11, // With polyfills
  opera: 67,
  samsung: 12.1,
  'mobile safari': 13.4
};

// Required browser features
const REQUIRED_FEATURES = [
  'Promise',
  'fetch',
  'Map',
  'Set',
  'URL',
  'URLSearchParams',
  'IntersectionObserver',
  'requestAnimationFrame',
  'localStorage',
  'sessionStorage',
  'performance',
  'customElements',
  'ResizeObserver',
  'Intl',
  'Proxy',
  'Reflect'
];

// Optional features (with fallbacks)
const OPTIONAL_FEATURES = {
  'WebGL': '3D visualizations will be disabled',
  'WebRTC': 'Video/audio calls will be unavailable',
  'WebSocket': 'Real-time updates will be disabled',
  'ServiceWorker': 'Offline functionality will be limited',
  'Notification': 'Desktop notifications will be unavailable',
  'PushManager': 'Push notifications will be unavailable',
  'Blob': 'File uploads will be limited',
  'FileReader': 'File processing will be limited'
};

/**
 * Detect browser information
 * @returns {Object} Browser name, version, and platform
 */
function detectBrowser() {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let version = '0';
  let platform = 'Unknown';
  
  // Detect platform
  if (/Android/i.test(userAgent)) {
    platform = 'Android';
  } else if (/iPad|iPhone|iPod/.test(userAgent)) {
    platform = 'iOS';
  } else if (/Mac/i.test(userAgent)) {
    platform = 'macOS';
  } else if (/Win/i.test(userAgent)) {
    platform = 'Windows';
  } else if (/Linux/i.test(userAgent)) {
    platform = 'Linux';
  }
  
  // Detect browser
  if ((/edg\//i.test(userAgent)) || /edg/i.test(userAgent)) {
    name = 'edge';
    version = userAgent.match(/(edg|edge|edga|edgios|edg)\/?\s*(\d+)/i)[2];
  } else if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) {
    name = 'opera';
    version = userAgent.match(/(?:opr|opera|opios|opera\s+mini)\/(\d+)/i)[1];
  } else if (/chrome|chromium|crios/i.test(userAgent)) {
    name = 'chrome';
    version = userAgent.match(/(?:chrome|chromium|crios)\/(\d+)/i)[1];
  } else if (/firefox|fxios/i.test(userAgent)) {
    name = 'firefox';
    version = userAgent.match(/(?:firefox|fxios)\/(\d+)/i)[1];
  } else if (/safari/i.test(userAgent)) {
    name = 'safari';
    version = userAgent.match(/version\/(\d+)/i)[1];
  } else if (/msie|trident/i.test(userAgent)) {
    name = 'ie';
    version = userAgent.match(/(?:msie |rv:)(\d+)/i)[1];
  } else if (/samsungbrowser/i.test(userAgent)) {
    name = 'samsung';
    version = userAgent.match(/samsungbrowser\/(\d+)/i)[1];
  }
  
  // Handle mobile browsers
  if ((/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) || 
      (platform === 'iOS' && name === 'safari')) {
    name = 'mobile safari';
  }
  
  return {
    name: name.toLowerCase(),
    version: parseFloat(version) || 0,
    platform: platform.toLowerCase(),
    userAgent: userAgent
  };
}

/**
 * Check if the current browser is supported
 * @returns {{supported: boolean, message: string, browser: Object}} Compatibility info
 */
function checkBrowserCompatibility() {
  const browser = detectBrowser();
  let supported = true;
  let message = 'Your browser is fully supported';
  
  // Check minimum version
  const minVersion = MIN_BROWSER_VERSIONS[browser.name] || 0;
  if (browser.version < minVersion) {
    supported = false;
    message = `Your browser (${browser.name} ${browser.version}) is outdated. ` +
             `Please update to version ${minVersion} or later.`;
    return { supported, message, browser };
  }
  
  // Check required features
  const missingFeatures = [];
  for (const feature of REQUIRED_FEATURES) {
    if (!(feature in window)) {
      missingFeatures.push(feature);
    }
  }
  
  if (missingFeatures.length > 0) {
    supported = false;
    message = `Your browser is missing required features: ${missingFeatures.join(', ')}. ` +
             'Please update your browser or use a different one.';
    return { supported, message, browser };
  }
  
  // Check optional features
  const unsupportedFeatures = [];
  for (const [feature, warning] of Object.entries(OPTIONAL_FEATURES)) {
    if (!(feature in window)) {
      unsupportedFeatures.push({ feature, warning });
    }
  }
  
  if (unsupportedFeatures.length > 0) {
    message = 'Some features may not be available: ' +
              unsupportedFeatures.map(f => f.feature).join(', ');
    logWarn(message);
    
    // Log each warning
    unsupportedFeatures.forEach(({ feature, warning }) => {
      logWarn(`${feature} is not supported: ${warning}`);
    });
  }
  
  return { supported: true, message, browser };
}

/**
 * Apply polyfills for missing features
 */
async function applyPolyfills() {
  const polyfills = [];
  
  // Only load polyfills if needed
  if (typeof Promise === 'undefined') {
    polyfills.push(import('core-js/stable/promise'));
  }
  
  if (typeof fetch === 'undefined') {
    polyfills.push(import('whatwg-fetch'));
  }
  
  if (typeof Object.assign !== 'function') {
    polyfills.push(import('core-js/stable/object/assign'));
  }
  
  if (typeof Array.from === 'undefined') {
    polyfills.push(import('core-js/stable/array/from'));
  }
  
  if (typeof IntersectionObserver === 'undefined') {
    polyfills.push(import('intersection-observer'));
  }
  
  if (typeof ResizeObserver === 'undefined') {
    // Load a ResizeObserver polyfill if needed
    polyfills.push(import('@juggle/resize-observer'));
  }
  
  try {
    await Promise.all(polyfills);
    logInfo('Polyfills loaded successfully');
  } catch (error) {
    logError('Failed to load polyfills', error);
    throw new Error('Failed to load required polyfills');
  }
}

/**
 * Initialize browser compatibility checks
 * @returns {Promise<boolean>} Whether the browser is compatible
 */
async function initializeCompatibility() {
  const { supported, message, browser } = checkBrowserCompatibility();
  
  logInfo(`Browser detected: ${browser.name} ${browser.version} on ${browser.platform}`);
  
  if (!supported) {
    logError(`Browser not supported: ${message}`);
    return false;
  }
  
  // Apply any necessary polyfills
  try {
    await applyPolyfills();
    return true;
  } catch (error) {
    logError('Failed to apply polyfills', error);
    return false;
  }
}

export {
  detectBrowser,
  checkBrowserCompatibility,
  applyPolyfills,
  initializeCompatibility
};

// For debugging
if (typeof window !== 'undefined') {
  window.browserCompatibility = {
    detectBrowser,
    checkCompatibility: checkBrowserCompatibility,
    applyPolyfills
  };
}

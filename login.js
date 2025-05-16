// login.js - Server-side authentication with JWT
const AUTH_TOKEN_KEY = 'orderforecast_auth_token';
const AUTH_USER_KEY = 'orderforecast_user';
const REDIRECT_FLAG_KEY = 'orderforecast_redirect_flag';

// Use the DEBUG utility for logging
function logAuthDebug(message, data = null) {
  if (window.DEBUG && DEBUG.debug) {
    DEBUG.debug('Auth', message, data);
  } else {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [Auth] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [Auth] ${message}`);
    }
  }
}

// Check if we're on the login page
function isLoginPage() {
  return window.location.pathname.endsWith('login.html');
}

// Check if we're on the main dashboard
function isDashboardPage() {
  return window.location.pathname.endsWith('index.html') || 
         window.location.pathname === '/' || 
         window.location.pathname === '';
}

// Main initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  logAuthDebug('Page loaded: ' + window.location.href);
  
  // Clear any redirect flags to prevent loops
  const redirectFlag = sessionStorage.getItem(REDIRECT_FLAG_KEY);
  if (redirectFlag) {
    logAuthDebug('Found redirect flag, clearing it', redirectFlag);
    sessionStorage.removeItem(REDIRECT_FLAG_KEY);
  }
  
  if (isLoginPage()) {
    logAuthDebug('Login page detected');
    
    // Setup login form
    setupLoginForm();
    
    // Add helper text for development
    addHelperText();
    
    // Only check token if we haven't just been redirected here
    if (redirectFlag !== 'to_login') {
      // If we're on login page and already have a valid token, redirect to dashboard
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        logAuthDebug('Token found on login page, verifying...');
        verifyAndRedirect(token);
      }
    }
  } else if (isDashboardPage()) {
    logAuthDebug('Dashboard page detected');
    
    // Only redirect if we haven't just been redirected here
    if (redirectFlag !== 'to_dashboard') {
      // If we're on dashboard and don't have a token, redirect to login
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        logAuthDebug('No token found on dashboard, redirecting to login');
        sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
        window.location.href = 'login.html';
      } else {
        // Verify token is still valid
        verifyToken(token);
      }
    }
  }
});

// Verify token and redirect to dashboard if valid
function verifyAndRedirect(token) {
  const baseUrl = window.location.origin;
  
  logAuthDebug('Verifying token before redirect');
  
  fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      logAuthDebug('Token valid, redirecting to dashboard');
      // Set redirect flag to prevent loops
      sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_dashboard');
      window.location.href = 'index.html';
    } else {
      logAuthDebug('Token invalid, staying on login page');
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  })
  .catch(error => {
    logAuthDebug('Token verification error', error);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  });
}

// Verify token without redirect
function verifyToken(token) {
  const baseUrl = window.location.origin;
  
  logAuthDebug('Verifying token on dashboard');
  
  fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  })
  .then(response => response.json())
  .then(data => {
    if (!data.success) {
      logAuthDebug('Token invalid on dashboard, redirecting to login');
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      // Set redirect flag to prevent loops
      sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
      window.location.href = 'login.html';
    } else {
      logAuthDebug('Token valid on dashboard');
    }
  })
  .catch(error => {
    logAuthDebug('Token verification error on dashboard', error);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    // Set redirect flag to prevent loops
    sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_login');
    window.location.href = 'login.html';
  });
}

// Setup login form event handlers
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) {
    logAuthDebug('Login form not found');
    return;
  }
  
  const errorDiv = document.getElementById('login-error');
  const loginButton = document.querySelector('.login-btn');
  
  logAuthDebug('Setting up login form handler');
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    logAuthDebug('Login form submitted');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate input
    if (!username || !password) {
      errorDiv.textContent = 'Username and password are required';
      errorDiv.style.display = 'block';
      return;
    }
    
    // Clear previous error
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    
    // Disable login button and show loading state
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    try {
      // Get the base URL (handles both direct and proxy access)
      const baseUrl = window.location.origin;
      
      logAuthDebug('Sending login request to: ' + baseUrl + '/api/auth/login');
      
      // Send login request to server
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      logAuthDebug('Login response received', data);
      
      if (!response.ok || !data.success) {
        // Show error message
        errorDiv.textContent = data.message || 'Invalid username or password.';
        errorDiv.style.display = 'block';
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
        return;
      }
      
      // Login successful, store token and user info
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      
      logAuthDebug('Login successful, redirecting to dashboard');
      
      // Set redirect flag to prevent loops
      sessionStorage.setItem(REDIRECT_FLAG_KEY, 'to_dashboard');
      
      // Redirect to dashboard
      window.location.href = 'index.html';
      
    } catch (error) {
      logAuthDebug('Login error:', error);
      errorDiv.textContent = 'An error occurred during login. Please try again.';
      errorDiv.style.display = 'block';
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  });
}

// Add helper text to show default credentials during development
function addHelperText() {
  const loginContainer = document.querySelector('.login-container');
  if (!loginContainer) {
    logAuthDebug('Login container not found');
    return;
  }
  
  const helperText = document.createElement('div');
  helperText.className = 'login-helper';
  helperText.innerHTML = `
    <p style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: #6b7280;">
      Default credentials:<br>
      Username: <strong>admin</strong><br>
      Password: <strong>admin123</strong>
    </p>
  `;
  
  loginContainer.appendChild(helperText);
  logAuthDebug('Helper text added to login page');
}

// Import authentication service
import { login, checkAuthentication, AUTH_EVENTS, onAuthEvent } from './js/auth/clientAuthService.js';
import { showToast } from './js/components/toast.js';
import { logDebug, logError } from './js/utils/logger.js';

// Initialize login component when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already authenticated
  const isAuthenticated = await checkAuthentication();
  
  if (isAuthenticated) {
    // User is already authenticated, redirect to dashboard
    logDebug('User is already authenticated, redirecting to dashboard');
    window.location.href = '/';
    return;
  }
  
  // Set up login form
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginButton = loginForm.querySelector('button[type="submit"]');
  
  // Remember username if available
  const rememberedUsername = localStorage.getItem('remember_username');
  if (rememberedUsername) {
    usernameInput.value = rememberedUsername;
  }
  
  // Add remember me checkbox if it doesn't exist
  if (!document.getElementById('remember-me')) {
    const rememberMeDiv = document.createElement('div');
    rememberMeDiv.className = 'remember-me-container';
    rememberMeDiv.innerHTML = `
      <label>
        <input type="checkbox" id="remember-me" name="remember-me" ${rememberedUsername ? 'checked' : ''}>
        Remember me
      </label>
    `;
    loginButton.parentNode.insertBefore(rememberMeDiv, loginButton);
  }
  
  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const rememberMe = document.getElementById('remember-me')?.checked || false;
      
      // Validate inputs
      if (!username || !password) {
        showLoginError('Username and password are required');
        return;
      }
      
      // Show loading state
      setLoading(true);
      
      try {
        logDebug('Attempting login with username:', username);
        
        // Call login function from auth service
        const result = await login(username, password);
        
        if (result.success) {
          logDebug('Login successful');
          
          // Store remember me preference
          if (rememberMe) {
            localStorage.setItem('remember_username', username);
          } else {
            localStorage.removeItem('remember_username');
          }
          
          // Show success message
          showToast({
            type: 'success',
            message: `Welcome back, ${result.user.name || result.user.username}!`,
            duration: 3000
          });
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
        } else {
          logError('Login failed:', result.message);
          showLoginError(result.message || 'Invalid username or password');
        }
      } catch (error) {
        logError('Login error:', error);
        showLoginError(error.message || 'An error occurred during login');
      } finally {
        // Hide loading state
        setLoading(false);
      }
    });
  }
  
  // Listen for authentication events
  onAuthEvent(AUTH_EVENTS.LOGIN, (data) => {
    logDebug('Login event received:', data);
    window.location.href = '/';
  });
  
  // Function to show login error
  function showLoginError(message) {
    if (loginError) {
      loginError.textContent = message;
      loginError.style.display = 'block';
      
      // Add shake animation
      loginForm.classList.add('shake');
      setTimeout(() => {
        loginForm.classList.remove('shake');
      }, 500);
    }
  }
  
  // Function to set loading state
  function setLoading(isLoading) {
    if (loginButton) {
      if (isLoading) {
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner"></span> Logging in...';
      } else {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
      }
    }
  }
});
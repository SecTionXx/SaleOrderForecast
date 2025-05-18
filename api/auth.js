/**
 * auth.js - Authentication API Endpoints
 * Provides server-side authentication endpoints for login, logout, token refresh, and user management
 */

const express = require('express');
const router = express.Router();
const authService = require('../js/auth/serverAuthService');
const { authenticate, authorize } = require('../js/auth/authMiddleware');
const { logDebug, logError, logInfo } = require('../js/utils/logger');
const config = require('../js/config');
const { validateRequest, sanitizeInputs, setSecurityHeaders } = require('../js/utils/inputValidationMiddleware');
const { required, minLength, email, pattern } = require('../js/utils/validator');

// Validation patterns for input validation
const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  PHONE: /^\+?[0-9]{10,15}$/
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', sanitizeInputs(), validateRequest({
  body: {
    username: [required('Username is required')],
    password: [required('Password is required')]
  }
}), (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Get IP and user agent
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    
    // Authenticate user
    const result = authService.authenticateUser(username, password, ip, userAgent);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message || 'Invalid credentials'
      });
    }
    
    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.auth.refreshTokenExpiry * 1000
    });
    
    // Return success with token and user info
    return res.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt,
      user: result.user
    });
  } catch (error) {
    logError('Login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user / invalidate token
 * @access Private
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    
    // Invalidate session
    const result = authService.invalidateSession(token);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logError('Logout error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', sanitizeInputs(), validateRequest({
  body: {
    refreshToken: [required('Refresh token is required')]
  }
}), (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Get token from header if available
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      token = authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    // Refresh token
    const result = authService.refreshToken(token, refreshToken);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message || 'Invalid or expired token'
      });
    }
    
    // Set new refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.auth.refreshTokenExpiry * 1000
    });
    
    // Return success with new token and user info
    return res.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt,
      user: result.user
    });
  } catch (error) {
    logError('Token refresh error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route GET /api/auth/user
 * @desc Get current user info
 * @access Private
 */
router.get('/user', authenticate, (req, res) => {
  try {
    // User info is already in req.user from authenticate middleware
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logError('Get user error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route PUT /api/auth/user
 * @desc Update user profile
 * @access Private
 */
router.put('/user', authenticate, sanitizeInputs(), validateRequest({
  body: {
    name: [minLength(2, 'Name must be at least 2 characters')],
    email: [email('Invalid email format')]
  }
}), (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Update user
    const result = authService.updateUser(req.user.id, {
      name,
      email
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to update user'
      });
    }
    
    return res.json({
      success: true,
      user: result.user
    });
  } catch (error) {
    logError('Update user error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticate, sanitizeInputs(), validateRequest({
  body: {
    currentPassword: [required('Current password is required')],
    newPassword: [
      required('New password is required'),
      minLength(config.auth.passwordMinLength, `Password must be at least ${config.auth.passwordMinLength} characters long`),
      pattern(VALIDATION_PATTERNS.PASSWORD, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    ]
  }
}), (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Validate password strength
    if (newPassword.length < config.auth.passwordMinLength) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${config.auth.passwordMinLength} characters long`
      });
    }
    
    // Change password
    const result = authService.changePassword(req.user.id, currentPassword, newPassword);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to change password'
      });
    }
    
    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logError('Change password error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route GET /api/auth/sessions
 * @desc Get user sessions
 * @access Private
 */
router.get('/sessions', authenticate, (req, res) => {
  try {
    // Get user sessions
    const sessions = authService.getUserSessions(req.user.id);
    
    // Mark current session
    const currentSessionId = req.user.sessionId;
    const formattedSessions = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }));
    
    return res.json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    logError('Get sessions error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route POST /api/auth/invalidate-other-sessions
 * @desc Invalidate all other user sessions
 * @access Private
 */
router.post('/invalidate-other-sessions', authenticate, (req, res) => {
  try {
    // Invalidate other sessions
    const result = authService.invalidateOtherSessions(req.user.id, req.user.sessionId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to invalidate sessions'
      });
    }
    
    return res.json({
      success: true,
      count: result.count,
      message: `Successfully invalidated ${result.count} session(s)`
    });
  } catch (error) {
    logError('Invalidate sessions error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Private (Admin only)
 */
router.post('/register', authenticate, authorize('admin'), sanitizeInputs(), validateRequest({
  body: {
    username: [required('Username is required'), minLength(3, 'Username must be at least 3 characters')],
    password: [
      required('Password is required'),
      minLength(config.auth.passwordMinLength, `Password must be at least ${config.auth.passwordMinLength} characters long`),
      pattern(VALIDATION_PATTERNS.PASSWORD, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    ],
    name: [minLength(2, 'Name must be at least 2 characters')],
    email: [email('Invalid email format')],
    role: [pattern(/^(admin|editor|viewer)$/, 'Role must be admin, editor, or viewer')]
  }
}), (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Validate password strength
    if (password.length < config.auth.passwordMinLength) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${config.auth.passwordMinLength} characters long`
      });
    }
    
    // Create user
    const result = authService.createUser({
      username,
      password,
      name,
      email,
      role: role || 'viewer'
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to create user'
      });
    }
    
    return res.status(201).json({
      success: true,
      user: result.user
    });
  } catch (error) {
    logError('Register error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route GET /api/auth/users
 * @desc Get all users
 * @access Private (Admin only)
 */
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    
    // Get all users
    const users = authService.getUsers();
    
    // Filter users
    let filteredUsers = users;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Calculate pagination
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get paginated users
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    // Remove sensitive data
    const sanitizedUsers = paginatedUsers.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      created: user.created,
      lastLogin: user.lastLogin
    }));
    
    return res.json({
      success: true,
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages
      }
    });
  } catch (error) {
    logError('Get users error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route GET /api/auth/users/:id
 * @desc Get user by ID
 * @access Private (Admin only)
 */
router.get('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user
    const result = authService.getUserById(userId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.json({
      success: true,
      user: result.user
    });
  } catch (error) {
    logError('Get user error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route PUT /api/auth/users/:id
 * @desc Update user
 * @access Private (Admin only)
 */
router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const userId = req.params.id;
    const { username, name, email, role, status, password } = req.body;
    
    // Update user
    const result = authService.updateUser(userId, {
      username,
      name,
      email,
      role,
      status,
      password
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to update user'
      });
    }
    
    return res.json({
      success: true,
      user: result.user
    });
  } catch (error) {
    logError('Update user error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route DELETE /api/auth/users/:id
 * @desc Delete user
 * @access Private (Admin only)
 */
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    // Delete user
    const result = authService.deleteUser(userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to delete user'
      });
    }
    
    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logError('Delete user error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Apply security headers to all routes
router.use(setSecurityHeaders());

module.exports = router;

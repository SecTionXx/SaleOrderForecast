// authRoutes.js - Authentication routes for Express

const express = require('express');
const router = express.Router();
const authService = require('./authService');
const { authenticate, authorize, requirePermission, requirePermissions } = require('./authMiddleware');
const { ROLES, getPermissionsForRole } = require('./roleBasedAccess');

// Initialize users file
authService.initUsersFile();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Get client information for session tracking
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Authenticate user
  const result = authService.authenticateUser(username, password, ip, userAgent);
  
  if (!result.success) {
    return res.status(401).json(result);
  }
  
  // Set refresh token as HTTP-only cookie for better security
  if (result.refreshToken) {
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Don't send refresh token in the response body
    delete result.refreshToken;
  }
  
  // Return token and user info
  res.json(result);
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Admin only
 */
router.post('/register', authenticate, requirePermission('manage:users'), (req, res) => {
  const { username, password, name, email, role } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Validate role
  if (role && !ROLES[role]) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  
  // Create user with additional fields
  const result = authService.createUser({
    username,
    password,
    name,
    email,
    role,
    status: 'active',
    created: new Date().toISOString()
  });
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  // Return user info
  res.status(201).json(result);
});

/**
 * @route GET /api/auth/users
 * @desc Get all users
 * @access Admin only
 */
router.get('/users', authenticate, requirePermission('manage:users'), (req, res) => {
  const users = authService.getUsers().map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    status: user.status,
    created: user.created
  }));
  
  res.json({ success: true, users });
});

/**
 * @route GET /api/auth/users/:id
 * @desc Get user by ID
 * @access Admin only
 */
router.get('/users/:id', authenticate, authorize('admin'), (req, res) => {
  const result = authService.getUserById(req.params.id);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result);
});

/**
 * @route PUT /api/auth/users/:id
 * @desc Update user
 * @access Admin only
 */
router.put('/users/:id', authenticate, requirePermission('manage:users'), (req, res) => {
  const { name, email, password, role, status } = req.body;
  
  // Validate role if provided
  if (role && !ROLES[role]) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  
  // Validate status if provided
  if (status && !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  
  const result = authService.updateUser(req.params.id, {
    name,
    email,
    password,
    role,
    status
  });
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result);
});

/**
 * @route DELETE /api/auth/users/:id
 * @desc Delete user
 * @access Admin only
 */
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  const result = authService.deleteUser(req.params.id);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result);
});

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authenticate, (req, res) => {
  const result = authService.getUserById(req.user.id);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result);
});

/**
 * @route PUT /api/auth/me
 * @desc Update current user info
 * @access Private
 */
router.put('/me', authenticate, (req, res) => {
  const { name, email, password } = req.body;
  
  // Users can only update their own name, email, and password
  const result = authService.updateUser(req.user.id, {
    name,
    email,
    password
  });
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result);
});

/**
 * @route POST /api/auth/verify
 * @desc Verify token validity
 * @access Public
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  
  const verification = authService.verifyToken(token);
  
  if (!verification.valid) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: verification.error });
  }
  
  res.json({ success: true, user: verification.user });
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh an expired token
 * @access Public
 */
router.post('/refresh', (req, res) => {
  // Get token from body or cookie
  const expiredToken = req.body.token;
  const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
  
  if (!expiredToken) {
    return res.status(400).json({ success: false, message: 'Expired token is required' });
  }
  
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }
  
  // Try to refresh the token
  const result = authService.refreshToken(expiredToken, refreshToken);
  
  if (!result.success) {
    return res.status(401).json(result);
  }
  
  // Return new token
  res.json(result);
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate session
 * @access Private
 */
router.post('/logout', authenticate, (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  
  // Invalidate the session
  const result = authService.invalidateSession(token);
  
  // Clear refresh token cookie
  res.clearCookie('refresh_token');
  
  res.json(result);
});

/**
 * @route GET /api/auth/roles
 * @desc Get all available roles and their permissions
 * @access Admin only
 */
router.get('/roles', authenticate, requirePermission('manage:roles'), (req, res) => {
  const roles = Object.keys(ROLES).map(roleName => ({
    name: roleName,
    level: ROLES[roleName].level,
    permissions: getPermissionsForRole(roleName)
  }));
  
  res.json({ success: true, roles });
});

/**
 * @route GET /api/auth/sessions
 * @desc Get all active sessions for the current user
 * @access Private
 */
router.get('/sessions', authenticate, (req, res) => {
  const sessions = authService.getUserSessions(req.user.id);
  res.json({ success: true, sessions });
});

/**
 * @route POST /api/auth/sessions/invalidate
 * @desc Invalidate all other sessions for the current user
 * @access Private
 */
router.post('/sessions/invalidate', authenticate, (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = req.user;
  
  const result = authService.invalidateOtherSessions(decoded.id, decoded.sessionId);
  res.json(result);
});

/**
 * @route GET /api/auth/permissions
 * @desc Get permissions for the current user
 * @access Private
 */
router.get('/permissions', authenticate, (req, res) => {
  const permissions = getPermissionsForRole(req.user.role);
  res.json({ success: true, permissions });
});

module.exports = router;

// authRoutes.js - Authentication routes for Express

const express = require('express');
const router = express.Router();
const authService = require('./authService');
const { authenticate, authorize } = require('./authMiddleware');

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
  
  // Authenticate user
  const result = authService.authenticateUser(username, password);
  
  if (!result.success) {
    return res.status(401).json(result);
  }
  
  // Return token and user info
  res.json(result);
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Admin only
 */
router.post('/register', authenticate, authorize('admin'), (req, res) => {
  const { username, password, name, email, role } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Create user
  const result = authService.createUser({
    username,
    password,
    name,
    email,
    role
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
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  const users = authService.getUsers().map(user => ({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin
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
router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, email, password, role } = req.body;
  
  const result = authService.updateUser(req.params.id, {
    name,
    email,
    password,
    role
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

module.exports = router;

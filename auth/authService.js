// authService.js - Server-side authentication service

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// In a production environment, this would be stored in a secure database
// For this demo, we'll use a JSON file to store user information
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret-key-change-in-production';
const TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Active sessions store
const activeSessions = new Map();

// Initialize users file if it doesn't exist
function initUsersFile() {
  // Create a salt for the default users
  const salt = 'default-salt-12345';
  
  // Hash the passwords with the salt
  const adminPasswordHash = hashPassword('admin123', salt);
  const editorPasswordHash = hashPassword('editor123', salt);
  const userPasswordHash = hashPassword('user123', salt);
  
  const defaultUsers = [
    {
      id: '1',
      username: 'admin',
      // Default password: admin123 (hashed with salt)
      passwordHash: adminPasswordHash,
      salt: salt,
      role: 'admin',
      name: 'Administrator',
      email: 'admin@example.com',
      lastLogin: null,
      created: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '2',
      username: 'editor',
      // Default password: editor123 (hashed with salt)
      passwordHash: editorPasswordHash,
      salt: salt,
      role: 'editor',
      name: 'Content Editor',
      email: 'editor@example.com',
      lastLogin: null,
      created: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '3',
      username: 'user',
      // Default password: user123 (hashed with salt)
      passwordHash: userPasswordHash,
      salt: salt,
      role: 'viewer',
      name: 'Regular User',
      email: 'user@example.com',
      lastLogin: null,
      created: new Date().toISOString(),
      status: 'active'
    }
  ];
  
  // Always write the file to ensure correct credentials
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  console.log('Created/updated default users file');
}

// Get all users
function getUsers() {
  try {
    initUsersFile();
    const usersData = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(usersData);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users file:', error);
    return false;
  }
}

// Hash password with salt
function hashPassword(password, salt) {
  return crypto
    .createHash('sha512')
    .update(password + salt)
    .digest('hex');
}

// Generate a random salt
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// Authenticate user
function authenticateUser(username, password, ip, userAgent) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  // Check if user is active
  if (user.status !== 'active') {
    return { success: false, message: 'Account is not active' };
  }
  
  const hashedPassword = hashPassword(password, user.salt);
  
  if (hashedPassword !== user.passwordHash) {
    return { success: false, message: 'Invalid password' };
  }
  
  // Update last login time
  user.lastLogin = new Date().toISOString();
  saveUsers(users);
  
  // Generate session ID
  const sessionId = generateSessionId();
  
  // Generate JWT token
  const token = generateToken(user, sessionId);
  
  // Generate refresh token
  const refreshToken = generateRefreshToken(user, sessionId);
  
  // Store session information
  storeSession(sessionId, user.id, ip, userAgent, refreshToken);
  
  return {
    success: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * Generate a new JWT token
 * @param {Object} user - User object
 * @param {string} sessionId - Session ID
 * @returns {string} JWT token
 */
function generateToken(user, sessionId) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      sessionId: sessionId
    }, 
    JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Generate a refresh token
 * @param {Object} user - User object
 * @param {string} sessionId - Session ID
 * @returns {string} Refresh token
 */
function generateRefreshToken(user, sessionId) {
  return jwt.sign(
    { 
      id: user.id,
      sessionId: sessionId
    }, 
    REFRESH_SECRET, 
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Generate a unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store session information
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} ip - IP address
 * @param {string} userAgent - User agent
 * @param {string} refreshToken - Refresh token
 */
function storeSession(sessionId, userId, ip, userAgent, refreshToken) {
  activeSessions.set(sessionId, {
    userId,
    ip,
    userAgent,
    refreshToken,
    createdAt: new Date(),
    lastActive: new Date()
  });
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists
    if (!activeSessions.has(decoded.sessionId)) {
      return { valid: false, error: 'Session not found' };
    }
    
    // Update session last active time
    const session = activeSessions.get(decoded.sessionId);
    session.lastActive = new Date();
    
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Refresh an expired token using a refresh token
 * @param {string} token - Expired JWT token
 * @returns {Object} Result with new token or error
 */
function refreshToken(token) {
  try {
    // Decode the expired token without verifying
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.sessionId) {
      return { success: false, message: 'Invalid token format' };
    }
    
    // Check if session exists
    if (!activeSessions.has(decoded.sessionId)) {
      return { success: false, message: 'Session not found' };
    }
    
    const session = activeSessions.get(decoded.sessionId);
    
    // Verify the refresh token
    try {
      const refreshDecoded = jwt.verify(session.refreshToken, REFRESH_SECRET);
      
      // Check if the refresh token is for the same session
      if (refreshDecoded.sessionId !== decoded.sessionId) {
        return { success: false, message: 'Invalid refresh token' };
      }
      
      // Get user information
      const userResult = getUserById(decoded.id);
      
      if (!userResult.success) {
        return { success: false, message: 'User not found' };
      }
      
      const user = userResult.user;
      
      // Generate new token
      const newToken = generateToken(user, decoded.sessionId);
      
      // Update session last active time
      session.lastActive = new Date();
      
      return {
        success: true,
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };
      
    } catch (error) {
      // Refresh token is invalid or expired
      // Remove the session
      activeSessions.delete(decoded.sessionId);
      return { success: false, message: 'Refresh token expired', error: error.message };
    }
    
  } catch (error) {
    return { success: false, message: 'Token refresh failed', error: error.message };
  }
}

/**
 * Invalidate a user session (logout)
 * @param {string} token - JWT token to invalidate
 * @returns {Object} Result
 */
function invalidateSession(token) {
  try {
    // Decode the token without verifying
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.sessionId) {
      return { success: false, message: 'Invalid token format' };
    }
    
    // Remove the session
    if (activeSessions.has(decoded.sessionId)) {
      activeSessions.delete(decoded.sessionId);
      return { success: true, message: 'Session invalidated successfully' };
    } else {
      return { success: false, message: 'Session not found' };
    }
    
  } catch (error) {
    return { success: false, message: 'Session invalidation failed', error: error.message };
  }
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of session objects
 */
function getUserSessions(userId) {
  const sessions = [];
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      sessions.push({
        sessionId,
        ip: session.ip,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActive: session.lastActive
      });
    }
  }
  
  return sessions;
}

/**
 * Invalidate all sessions for a user except the current one
 * @param {string} userId - User ID
 * @param {string} currentSessionId - Current session ID to keep
 * @returns {Object} Result
 */
function invalidateOtherSessions(userId, currentSessionId) {
  let count = 0;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId && sessionId !== currentSessionId) {
      activeSessions.delete(sessionId);
      count++;
    }
  }
  
  return { success: true, message: `${count} sessions invalidated` };
}

// Create a new user
function createUser(userData) {
  const users = getUsers();
  
  // Check if username already exists
  if (users.some(u => u.username === userData.username)) {
    return { success: false, message: 'Username already exists' };
  }
  
  // Generate salt and hash password
  const salt = generateSalt();
  const passwordHash = hashPassword(userData.password, salt);
  
  // Create new user object
  const newUser = {
    id: Date.now().toString(),
    username: userData.username,
    passwordHash,
    salt,
    role: userData.role || 'viewer',
    name: userData.name || userData.username,
    email: userData.email || '',
    lastLogin: null
  };
  
  // Add to users array and save
  users.push(newUser);
  saveUsers(users);
  
  return {
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  };
}

// Update user
function updateUser(userId, userData) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }
  
  const user = users[userIndex];
  
  // Update fields
  if (userData.name) user.name = userData.name;
  if (userData.email) user.email = userData.email;
  if (userData.role) user.role = userData.role;
  
  // Update password if provided
  if (userData.password) {
    const salt = generateSalt();
    user.passwordHash = hashPassword(userData.password, salt);
    user.salt = salt;
  }
  
  // Save changes
  saveUsers(users);
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

// Delete user
function deleteUser(userId) {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length === users.length) {
    return { success: false, message: 'User not found' };
  }
  
  saveUsers(filteredUsers);
  
  return { success: true };
}

// Get user by ID
function getUserById(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin
    }
  };
}

// Check if user has required role
function hasRole(user, requiredRole) {
  // This function is now deprecated in favor of the roleBasedAccess module
  // It's kept for backward compatibility
  const { getRoleLevel } = require('./roleBasedAccess');
  
  if (!user || !user.role) {
    return false;
  }
  
  const userRoleLevel = getRoleLevel(user.role);
  const requiredRoleLevel = getRoleLevel(requiredRole);
  
  return userRoleLevel >= requiredRoleLevel;
}

module.exports = {
  authenticateUser,
  verifyToken,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getUsers,
  hasRole,
  initUsersFile
};

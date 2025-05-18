/**
 * serverAuthService.js - Enhanced Server-side Authentication Service
 * Provides robust JWT authentication, token management, and user session handling
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logDebug, logError, logInfo } = require('../utils/logger');
const config = require('../config');

// In a production environment, this would be stored in a secure database
// For this demo, we'll use a JSON file to store user information
const USERS_FILE = path.join(__dirname, 'users.json');
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || config.auth.jwtSecret;
const REFRESH_SECRET = process.env.REFRESH_SECRET || config.auth.refreshSecret;
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || config.auth.tokenExpiry || '2h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || config.auth.refreshTokenExpiry || '7d';

// Active sessions store (in-memory cache, would be Redis in production)
const activeSessions = new Map();

/**
 * Initialize users file if it doesn't exist
 */
function initUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    // Create a salt for the default users
    const salt = crypto.randomBytes(16).toString('hex');
    
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
        status: 'active',
        permissions: [],
        preferences: {}
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
        status: 'active',
        permissions: [],
        preferences: {}
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
        status: 'active',
        permissions: [],
        preferences: {}
      }
    ];
    
    // Write the file
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    logInfo('Created default users file');
  }
}

/**
 * Initialize sessions file if it doesn't exist
 */
function initSessionsFile() {
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
    logInfo('Created sessions file');
  }
}

/**
 * Get all users
 * @returns {Array} - Array of user objects
 */
function getUsers() {
  try {
    initUsersFile();
    const usersData = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(usersData);
  } catch (error) {
    logError('Error reading users file:', error);
    return [];
  }
}

/**
 * Save users to file
 * @param {Array} users - Array of user objects
 * @returns {boolean} - True if successful
 */
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    logError('Error saving users file:', error);
    return false;
  }
}

/**
 * Get all sessions
 * @returns {Array} - Array of session objects
 */
function getSessions() {
  try {
    initSessionsFile();
    const sessionsData = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(sessionsData);
  } catch (error) {
    logError('Error reading sessions file:', error);
    return [];
  }
}

/**
 * Save sessions to file
 * @param {Array} sessions - Array of session objects
 * @returns {boolean} - True if successful
 */
function saveSessions(sessions) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    return true;
  } catch (error) {
    logError('Error saving sessions file:', error);
    return false;
  }
}

/**
 * Hash password with salt
 * @param {string} password - Password to hash
 * @param {string} salt - Salt for hashing
 * @returns {string} - Hashed password
 */
function hashPassword(password, salt) {
  return crypto
    .createHash('sha512')
    .update(password + salt)
    .digest('hex');
}

/**
 * Generate a random salt
 * @returns {string} - Random salt
 */
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a unique session ID
 * @returns {string} - Session ID
 */
function generateSessionId() {
  return uuidv4();
}

/**
 * Generate a new JWT token
 * @param {Object} user - User object
 * @param {string} sessionId - Session ID
 * @returns {string} - JWT token
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
 * @returns {string} - Refresh token
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
 * Store session information
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @param {string} ip - IP address
 * @param {string} userAgent - User agent
 * @param {string} refreshToken - Refresh token
 */
function storeSession(sessionId, userId, ip, userAgent, refreshToken) {
  // Store in memory cache
  activeSessions.set(sessionId, {
    userId,
    ip,
    userAgent,
    refreshToken,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  });
  
  // Store in file
  const sessions = getSessions();
  sessions.push({
    id: sessionId,
    userId,
    ip,
    userAgent,
    refreshToken,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  });
  
  // Limit number of sessions per user
  const userSessions = sessions.filter(session => session.userId === userId);
  if (userSessions.length > config.auth.maxSessionsPerUser) {
    // Remove oldest sessions
    const sessionsToRemove = userSessions
      .sort((a, b) => new Date(a.lastActive) - new Date(b.lastActive))
      .slice(0, userSessions.length - config.auth.maxSessionsPerUser);
    
    sessionsToRemove.forEach(session => {
      // Remove from memory cache
      activeSessions.delete(session.id);
    });
    
    // Remove from sessions array
    const sessionIds = sessionsToRemove.map(session => session.id);
    const updatedSessions = sessions.filter(session => !sessionIds.includes(session.id));
    
    saveSessions(updatedSessions);
  } else {
    saveSessions(sessions);
  }
}

/**
 * Update session activity
 * @param {string} sessionId - Session ID
 */
function updateSessionActivity(sessionId) {
  // Update in memory cache
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActive = new Date().toISOString();
    activeSessions.set(sessionId, session);
  }
  
  // Update in file
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(session => session.id === sessionId);
  
  if (sessionIndex !== -1) {
    sessions[sessionIndex].lastActive = new Date().toISOString();
    saveSessions(sessions);
  }
}

/**
 * Authenticate user
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {string} ip - IP address
 * @param {string} userAgent - User agent
 * @returns {Object} - Authentication result
 */
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
  
  // Calculate token expiry time
  const tokenExpiry = new Date();
  tokenExpiry.setSeconds(tokenExpiry.getSeconds() + parseInt(TOKEN_EXPIRY) * 3600);
  
  return {
    success: true,
    token,
    refreshToken,
    expiresAt: tokenExpiry.toISOString(),
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
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Verification result
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists
    const session = activeSessions.get(decoded.sessionId);
    if (!session) {
      return { valid: false, error: 'invalid_session' };
    }
    
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.name };
  }
}

/**
 * Refresh an expired token
 * @param {string} token - Expired JWT token
 * @param {string} refreshTokenStr - Refresh token
 * @returns {Object} - Refresh result
 */
function refreshToken(token, refreshTokenStr) {
  try {
    // Decode the expired token (without verification)
    const decodedToken = jwt.decode(token);
    
    if (!decodedToken || !decodedToken.sessionId) {
      return { success: false, message: 'Invalid token format' };
    }
    
    // Get session
    const session = activeSessions.get(decodedToken.sessionId);
    
    if (!session) {
      return { success: false, message: 'Session not found' };
    }
    
    // Verify refresh token
    let refreshTokenValid = false;
    
    try {
      // First try with provided refresh token
      if (refreshTokenStr) {
        const decodedRefresh = jwt.verify(refreshTokenStr, REFRESH_SECRET);
        if (decodedRefresh.sessionId === decodedToken.sessionId) {
          refreshTokenValid = true;
        }
      }
      
      // If that fails, try with stored refresh token
      if (!refreshTokenValid && session.refreshToken) {
        const decodedRefresh = jwt.verify(session.refreshToken, REFRESH_SECRET);
        if (decodedRefresh.sessionId === decodedToken.sessionId) {
          refreshTokenValid = true;
        }
      }
    } catch (error) {
      logError('Refresh token verification error:', error);
      return { success: false, message: 'Invalid refresh token' };
    }
    
    if (!refreshTokenValid) {
      return { success: false, message: 'Invalid refresh token' };
    }
    
    // Get user
    const user = getUserById(decodedToken.id);
    
    if (!user.success) {
      return { success: false, message: 'User not found' };
    }
    
    // Generate new tokens
    const newToken = generateToken(user.user, decodedToken.sessionId);
    const newRefreshToken = generateRefreshToken(user.user, decodedToken.sessionId);
    
    // Update session
    session.refreshToken = newRefreshToken;
    session.lastActive = new Date().toISOString();
    activeSessions.set(decodedToken.sessionId, session);
    
    // Update session in file
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === decodedToken.sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].refreshToken = newRefreshToken;
      sessions[sessionIndex].lastActive = new Date().toISOString();
      saveSessions(sessions);
    }
    
    // Calculate token expiry time
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + parseInt(TOKEN_EXPIRY) * 3600);
    
    return {
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: tokenExpiry.toISOString(),
      user: {
        id: user.user.id,
        username: user.user.username,
        name: user.user.name,
        email: user.user.email,
        role: user.user.role
      }
    };
  } catch (error) {
    logError('Token refresh error:', error);
    return { success: false, message: 'Token refresh error' };
  }
}

/**
 * Invalidate a user session (logout)
 * @param {string} token - JWT token to invalidate
 * @returns {Object} - Result
 */
function invalidateSession(token) {
  try {
    // Decode the token (without verification)
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.sessionId) {
      return { success: false, message: 'Invalid token format' };
    }
    
    // Remove session from memory cache
    activeSessions.delete(decoded.sessionId);
    
    // Remove session from file
    const sessions = getSessions();
    const updatedSessions = sessions.filter(session => session.id !== decoded.sessionId);
    saveSessions(updatedSessions);
    
    return { success: true };
  } catch (error) {
    logError('Session invalidation error:', error);
    return { success: false, message: 'Session invalidation error' };
  }
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of session objects
 */
function getUserSessions(userId) {
  const sessions = getSessions();
  return sessions.filter(session => session.userId === userId);
}

/**
 * Invalidate all sessions for a user except the current one
 * @param {string} userId - User ID
 * @param {string} currentSessionId - Current session ID to keep
 * @returns {Object} - Result
 */
function invalidateOtherSessions(userId, currentSessionId) {
  try {
    // Get all sessions for user
    const sessions = getSessions();
    const userSessions = sessions.filter(session => session.userId === userId);
    
    // Remove other sessions from memory cache
    userSessions.forEach(session => {
      if (session.id !== currentSessionId) {
        activeSessions.delete(session.id);
      }
    });
    
    // Remove other sessions from file
    const updatedSessions = sessions.filter(session => 
      session.userId !== userId || session.id === currentSessionId
    );
    
    saveSessions(updatedSessions);
    
    return {
      success: true,
      count: userSessions.length - 1
    };
  } catch (error) {
    logError('Error invalidating other sessions:', error);
    return { success: false, message: 'Error invalidating other sessions' };
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Object} - Result with created user
 */
function createUser(userData) {
  try {
    const users = getUsers();
    
    // Check if username already exists
    if (users.some(user => user.username === userData.username)) {
      return { success: false, message: 'Username already exists' };
    }
    
    // Check if email already exists
    if (userData.email && users.some(user => user.email === userData.email)) {
      return { success: false, message: 'Email already exists' };
    }
    
    // Generate salt
    const salt = generateSalt();
    
    // Hash password
    const passwordHash = hashPassword(userData.password, salt);
    
    // Create user
    const newUser = {
      id: uuidv4(),
      username: userData.username,
      passwordHash,
      salt,
      role: userData.role || 'viewer',
      name: userData.name || userData.username,
      email: userData.email || '',
      lastLogin: null,
      created: new Date().toISOString(),
      status: 'active',
      permissions: userData.permissions || [],
      preferences: userData.preferences || {}
    };
    
    // Add user
    users.push(newUser);
    saveUsers(users);
    
    // Return user without sensitive data
    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created: newUser.created,
        status: newUser.status
      }
    };
  } catch (error) {
    logError('Error creating user:', error);
    return { success: false, message: 'Error creating user' };
  }
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Object} - Result with updated user
 */
function updateUser(userId, userData) {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    const user = users[userIndex];
    
    // Check if username is being changed and already exists
    if (userData.username && userData.username !== user.username &&
        users.some(u => u.username === userData.username)) {
      return { success: false, message: 'Username already exists' };
    }
    
    // Check if email is being changed and already exists
    if (userData.email && userData.email !== user.email &&
        users.some(u => u.email === userData.email)) {
      return { success: false, message: 'Email already exists' };
    }
    
    // Update password if provided
    if (userData.password) {
      user.passwordHash = hashPassword(userData.password, user.salt);
    }
    
    // Update other fields
    user.username = userData.username || user.username;
    user.name = userData.name || user.name;
    user.email = userData.email || user.email;
    user.role = userData.role || user.role;
    user.status = userData.status || user.status;
    
    if (userData.permissions) {
      user.permissions = userData.permissions;
    }
    
    if (userData.preferences) {
      user.preferences = { ...user.preferences, ...userData.preferences };
    }
    
    // Save changes
    users[userIndex] = user;
    saveUsers(users);
    
    // Return user without sensitive data
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        created: user.created,
        status: user.status
      }
    };
  } catch (error) {
    logError('Error updating user:', error);
    return { success: false, message: 'Error updating user' };
  }
}

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Object} - Result
 */
function deleteUser(userId) {
  try {
    const users = getUsers();
    const initialCount = users.length;
    
    // Filter out user
    const updatedUsers = users.filter(user => user.id !== userId);
    
    if (updatedUsers.length === initialCount) {
      return { success: false, message: 'User not found' };
    }
    
    // Save changes
    saveUsers(updatedUsers);
    
    // Invalidate all sessions for user
    const sessions = getSessions();
    const userSessions = sessions.filter(session => session.userId === userId);
    
    // Remove sessions from memory cache
    userSessions.forEach(session => {
      activeSessions.delete(session.id);
    });
    
    // Remove sessions from file
    const updatedSessions = sessions.filter(session => session.userId !== userId);
    saveSessions(updatedSessions);
    
    return { success: true };
  } catch (error) {
    logError('Error deleting user:', error);
    return { success: false, message: 'Error deleting user' };
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} - Result with user
 */
function getUserById(userId) {
  try {
    const users = getUsers();
    const user = users.find(user => user.id === userId);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Return user without sensitive data
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        created: user.created,
        status: user.status,
        permissions: user.permissions,
        preferences: user.preferences
      }
    };
  } catch (error) {
    logError('Error getting user:', error);
    return { success: false, message: 'Error getting user' };
  }
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Object} - Result with user
 */
function getUserByUsername(username) {
  try {
    const users = getUsers();
    const user = users.find(user => user.username === username);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Return user without sensitive data
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        created: user.created,
        status: user.status,
        permissions: user.permissions,
        preferences: user.preferences
      }
    };
  } catch (error) {
    logError('Error getting user:', error);
    return { success: false, message: 'Error getting user' };
  }
}

/**
 * Check if user has required role
 * @param {Object} user - User object
 * @param {string} requiredRole - Required role
 * @returns {boolean} - True if user has required role
 */
function hasRole(user, requiredRole) {
  const roleHierarchy = {
    admin: 3,
    editor: 2,
    viewer: 1
  };
  
  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} - Result
 */
function changePassword(userId, currentPassword, newPassword) {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    const user = users[userIndex];
    
    // Verify current password
    const hashedCurrentPassword = hashPassword(currentPassword, user.salt);
    
    if (hashedCurrentPassword !== user.passwordHash) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    // Hash new password
    const hashedNewPassword = hashPassword(newPassword, user.salt);
    
    // Update password
    user.passwordHash = hashedNewPassword;
    
    // Save changes
    users[userIndex] = user;
    saveUsers(users);
    
    return { success: true };
  } catch (error) {
    logError('Error changing password:', error);
    return { success: false, message: 'Error changing password' };
  }
}

// Initialize files
initUsersFile();
initSessionsFile();

// Export functions
module.exports = {
  authenticateUser,
  verifyToken,
  refreshToken,
  invalidateSession,
  getUserSessions,
  invalidateOtherSessions,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getUserByUsername,
  hasRole,
  changePassword,
  updateSessionActivity
};

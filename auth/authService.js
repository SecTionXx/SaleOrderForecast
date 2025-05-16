// authService.js - Server-side authentication service

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// In a production environment, this would be stored in a secure database
// For this demo, we'll use a JSON file to store user information
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';

// Initialize users file if it doesn't exist
function initUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    // Create a salt for the default users
    const salt = 'default-salt-12345';
    
    // Hash the passwords with the salt
    const adminPasswordHash = hashPassword('admin123', salt);
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
        lastLogin: null
      },
      {
        id: '2',
        username: 'user',
        // Default password: user123 (hashed with salt)
        passwordHash: userPasswordHash,
        salt: salt,
        role: 'viewer',
        name: 'Regular User',
        email: 'user@example.com',
        lastLogin: null
      }
    ];
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    console.log('Created default users file');
  }
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
function authenticateUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  const hashedPassword = hashPassword(password, user.salt);
  
  if (hashedPassword !== user.passwordHash) {
    return { success: false, message: 'Invalid password' };
  }
  
  // Update last login time
  user.lastLogin = new Date().toISOString();
  saveUsers(users);
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRY }
  );
  
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
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
  if (!user || !user.role) return false;
  
  const roles = {
    admin: 3,
    editor: 2,
    viewer: 1
  };
  
  return roles[user.role] >= roles[requiredRole];
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

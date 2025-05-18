/**
 * roleBasedAccess.js - Role-Based Access Control System
 * Provides permission management and role hierarchy for the application
 */

const { logDebug, logError } = require('../utils/logger');

// Role hierarchy (from lowest to highest privilege)
const ROLE_HIERARCHY = {
  guest: 0,
  viewer: 1,
  editor: 2,
  admin: 3
};

// Default permissions for each role
const DEFAULT_ROLE_PERMISSIONS = {
  guest: [
    'view:public'
  ],
  viewer: [
    'view:public',
    'view:dashboard',
    'view:reports',
    'export:reports'
  ],
  editor: [
    'view:public',
    'view:dashboard',
    'view:reports',
    'export:reports',
    'create:forecast',
    'edit:forecast',
    'delete:forecast',
    'manage:settings'
  ],
  admin: [
    'view:public',
    'view:dashboard',
    'view:reports',
    'export:reports',
    'create:forecast',
    'edit:forecast',
    'delete:forecast',
    'manage:settings',
    'manage:users',
    'view:logs',
    'manage:system'
  ]
};

// Permission descriptions for UI display
const PERMISSION_DESCRIPTIONS = {
  'view:public': 'View public content',
  'view:dashboard': 'View dashboard',
  'view:reports': 'View reports',
  'export:reports': 'Export reports',
  'create:forecast': 'Create forecasts',
  'edit:forecast': 'Edit forecasts',
  'delete:forecast': 'Delete forecasts',
  'manage:settings': 'Manage application settings',
  'manage:users': 'Manage users',
  'view:logs': 'View system logs',
  'manage:system': 'Manage system configuration'
};

/**
 * Get role level in hierarchy
 * @param {string} role - Role name
 * @returns {number} - Role level (0 if role not found)
 */
function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

/**
 * Check if a role has sufficient privileges
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean} - True if user role has sufficient privileges
 */
function hasRole(userRole, requiredRole) {
  const userRoleLevel = getRoleLevel(userRole);
  const requiredRoleLevel = getRoleLevel(requiredRole);
  
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Get all permissions for a role
 * @param {string} role - Role name
 * @returns {string[]} - Array of permissions
 */
function getRolePermissions(role) {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role and optional permissions array
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
function hasPermission(user, permission) {
  if (!user) return false;
  
  // Admin role has all permissions
  if (user.role === 'admin') return true;
  
  // Check role-based permissions
  const rolePermissions = getRolePermissions(user.role);
  if (rolePermissions.includes(permission)) return true;
  
  // Check user-specific permissions
  if (user.permissions && Array.isArray(user.permissions)) {
    // Check for direct permission
    if (user.permissions.includes(permission)) return true;
    
    // Check for wildcard permissions
    const permissionParts = permission.split(':');
    if (permissionParts.length === 2) {
      const wildcardPermission = `${permissionParts[0]}:*`;
      if (user.permissions.includes(wildcardPermission)) return true;
    }
  }
  
  return false;
}

/**
 * Check if a user has all specified permissions
 * @param {Object} user - User object with role and optional permissions array
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has all permissions
 */
function hasAllPermissions(user, permissions) {
  if (!user || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if a user has any of the specified permissions
 * @param {Object} user - User object with role and optional permissions array
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has at least one permission
 */
function hasAnyPermission(user, permissions) {
  if (!user || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Get all available permissions
 * @returns {Object} - Object with permission keys and description values
 */
function getAllPermissions() {
  return PERMISSION_DESCRIPTIONS;
}

/**
 * Get all available roles with their default permissions
 * @returns {Object} - Object with role keys and permission arrays
 */
function getAllRoles() {
  return Object.keys(ROLE_HIERARCHY).reduce((roles, role) => {
    roles[role] = {
      level: ROLE_HIERARCHY[role],
      permissions: DEFAULT_ROLE_PERMISSIONS[role] || []
    };
    return roles;
  }, {});
}

/**
 * Get permission description
 * @param {string} permission - Permission key
 * @returns {string} - Permission description or the key if not found
 */
function getPermissionDescription(permission) {
  return PERMISSION_DESCRIPTIONS[permission] || permission;
}

/**
 * Check if a resource is accessible to a user
 * @param {Object} user - User object with role and optional permissions
 * @param {Object} resource - Resource object with owner and access properties
 * @returns {boolean} - True if user can access the resource
 */
function canAccessResource(user, resource) {
  if (!user || !resource) return false;
  
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Check if user is the owner
  if (resource.ownerId === user.id) return true;
  
  // Check resource access level if defined
  if (resource.access) {
    // Public resources are accessible to all authenticated users
    if (resource.access === 'public') return true;
    
    // Role-based access
    if (resource.access.role && hasRole(user.role, resource.access.role)) return true;
    
    // Permission-based access
    if (resource.access.permissions) {
      if (Array.isArray(resource.access.permissions)) {
        if (resource.access.requireAll) {
          return hasAllPermissions(user, resource.access.permissions);
        } else {
          return hasAnyPermission(user, resource.access.permissions);
        }
      } else if (typeof resource.access.permissions === 'string') {
        return hasPermission(user, resource.access.permissions);
      }
    }
    
    // User-specific access
    if (resource.access.users && Array.isArray(resource.access.users)) {
      return resource.access.users.includes(user.id);
    }
  }
  
  return false;
}

/**
 * Filter resources based on user access
 * @param {Object} user - User object with role and optional permissions
 * @param {Array} resources - Array of resource objects
 * @returns {Array} - Filtered array of accessible resources
 */
function filterAccessibleResources(user, resources) {
  if (!user || !resources || !Array.isArray(resources)) return [];
  
  return resources.filter(resource => canAccessResource(user, resource));
}

/**
 * Get UI permissions for a user (for client-side permission checks)
 * @param {Object} user - User object with role and optional permissions
 * @returns {Object} - Object with permission keys and boolean values
 */
function getUserUIPermissions(user) {
  if (!user) return {};
  
  const allPermissions = Object.keys(PERMISSION_DESCRIPTIONS);
  const userPermissions = {};
  
  allPermissions.forEach(permission => {
    userPermissions[permission] = hasPermission(user, permission);
  });
  
  return userPermissions;
}

module.exports = {
  getRoleLevel,
  hasRole,
  getRolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getAllPermissions,
  getAllRoles,
  getPermissionDescription,
  canAccessResource,
  filterAccessibleResources,
  getUserUIPermissions
};

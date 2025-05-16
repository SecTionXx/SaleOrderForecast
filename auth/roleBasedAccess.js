// roleBasedAccess.js - Role-based access control system

/**
 * Role hierarchy and permissions
 * Higher roles inherit permissions from lower roles
 */
const ROLES = {
  viewer: {
    level: 0,
    permissions: [
      'view:dashboard',
      'view:charts',
      'view:tables',
      'view:reports',
      'export:data'
    ]
  },
  editor: {
    level: 1,
    permissions: [
      'edit:filters',
      'create:reports',
      'save:views',
      'customize:dashboard'
    ]
  },
  admin: {
    level: 2,
    permissions: [
      'manage:users',
      'manage:roles',
      'manage:settings',
      'view:logs',
      'delete:data'
    ]
  }
};

/**
 * Get all permissions for a specific role
 * @param {string} role - The role to get permissions for
 * @returns {string[]} Array of permissions
 */
function getPermissionsForRole(role) {
  if (!ROLES[role]) {
    return [];
  }
  
  // Get all roles with lower or equal level
  const roleLevel = ROLES[role].level;
  const applicableRoles = Object.entries(ROLES)
    .filter(([_, roleData]) => roleData.level <= roleLevel)
    .map(([roleName, _]) => roleName);
  
  // Combine all permissions from applicable roles
  const permissions = applicableRoles.reduce((allPermissions, currentRole) => {
    return [...allPermissions, ...ROLES[currentRole].permissions];
  }, []);
  
  // Remove duplicates
  return [...new Set(permissions)];
}

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
function hasPermission(user, permission) {
  if (!user || !user.role) {
    return false;
  }
  
  const permissions = getPermissionsForRole(user.role);
  return permissions.includes(permission);
}

/**
 * Get all available roles
 * @returns {Object} Roles object
 */
function getAllRoles() {
  return ROLES;
}

/**
 * Get role level (higher number means higher privileges)
 * @param {string} role - Role name
 * @returns {number} Role level or -1 if role doesn't exist
 */
function getRoleLevel(role) {
  return ROLES[role] ? ROLES[role].level : -1;
}

/**
 * Check if a user can manage another user
 * @param {Object} manager - User attempting to manage another user
 * @param {Object} target - User being managed
 * @returns {boolean} True if manager can manage target
 */
function canManageUser(manager, target) {
  if (!manager || !target || !manager.role || !target.role) {
    return false;
  }
  
  // Users can only manage users with lower role levels
  return getRoleLevel(manager.role) > getRoleLevel(target.role);
}

module.exports = {
  ROLES,
  getPermissionsForRole,
  hasPermission,
  getAllRoles,
  getRoleLevel,
  canManageUser
};

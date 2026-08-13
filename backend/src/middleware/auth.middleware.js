const { errorResponse } = require('../utils/response');
const supabase = require('../config/supabase');
const authService = require('../services/auth.service');

/**
 * Validates the Supabase JWT Bearer token and resolves the user's ERP identity.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, {
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header'
    }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return errorResponse(res, {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token'
      }, 401);
    }

    // 2. Resolve ERP identity (users, organization, role, permissions)
    const identity = await authService.resolveIdentity(user.id);

    if (!identity) {
      return errorResponse(res, {
        code: 'FORBIDDEN',
        message: 'User does not belong to any active organization.'
      }, 403);
    }

    // 3. Attach to request
    req.user = identity.user;
    req.organizationId = identity.organization.id;
    req.organization = identity.organization;
    req.role = identity.role;
    req.permissions = identity.permissions;

    next();
  } catch (err) {
    return errorResponse(res, {
      code: 'INTERNAL_ERROR',
      message: 'Failed to resolve user identity',
      details: err.message
    }, 500);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.role !== 'Admin' && req.role !== 'SuperAdmin') {
    return errorResponse(res, {
      code: 'FORBIDDEN',
      message: 'Administrative privileges required.'
    }, 403);
  }
  next();
};

const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (req.role === 'SuperAdmin') return next(); // Bypass for super admin
    
    if (!req.permissions || !req.permissions.includes(permissionName)) {
      return errorResponse(res, {
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permissionName}`
      }, 403);
    }
    next();
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePermission
};



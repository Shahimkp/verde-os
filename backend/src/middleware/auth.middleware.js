const { errorResponse } = require('../utils/response');

/**
 * Temporary development middleware to establish the organization boundary.
 * In a real environment, this will decode the JWT and fetch organization_members.
 */
const requireAuth = (req, res, next) => {
  // Extract mock values for development testing
  const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
  const orgId = req.headers['x-organization-id'];
  const role = req.headers['x-role'] || 'Member';

  if (!orgId) {
    return errorResponse(res, {
      code: 'UNAUTHORIZED',
      message: 'Missing x-organization-id header (temporary mock auth)'
    }, 401);
  }

  // Inject into request object for downstream use
  req.user = {
    id: userId,
    role: role
  };
  req.organizationId = orgId;

  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
    return errorResponse(res, {
      code: 'FORBIDDEN',
      message: 'Administrative privileges required.'
    }, 403);
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};

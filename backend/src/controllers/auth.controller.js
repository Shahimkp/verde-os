const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authData = await authService.login(email, password);
    return successResponse(res, authData);
  } catch (error) {
    if (error.code === 'FORBIDDEN') {
      return errorResponse(res, error, 403);
    }
    // Normalize Supabase Auth errors
    if (error?.status === 400 || (error?.message && error.message.includes('Invalid login credentials'))) {
      return errorResponse(res, { code: 'UNAUTHORIZED', message: 'Invalid email or password' }, 401);
    }
    if (error.code === 'DATABASE_ERROR') {
      return errorResponse(res, { code: 'INTERNAL_ERROR', message: 'Failed to resolve user identity.' }, 500);
    }
    // Generic fallback for unexpected auth/db errors
    return errorResponse(res, { code: 'INTERNAL_ERROR', message: 'An unexpected authentication error occurred.' }, 500);
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    await authService.logout(token);
    return successResponse(res, { message: 'Logged out successfully' });
  } catch (error) {
    return errorResponse(res, { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred during logout.' }, 500);
  }
};

const getMe = async (req, res) => {
  try {
    // req.user, req.organization, req.role, and req.permissions are populated by requireAuth middleware
    return successResponse(res, {
      user: req.user,
      organization: req.organization,
      role: req.role,
      permissions: req.permissions
    });
  } catch (error) {
    return errorResponse(res, { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }, 500);
  }
};

module.exports = {
  login,
  logout,
  getMe
};

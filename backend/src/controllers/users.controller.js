const userService = require('../services/users.service');
const { successResponse, errorResponse } = require('../utils/response');

const getMembers = async (req, res) => {
  try {
    const members = await userService.getMembers(req.organizationId);
    return successResponse(res, members, { total: members.length });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await userService.getMember(req.organizationId, id);
    
    if (!member) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'User not found in organization' }, 404);
    }
    
    return successResponse(res, member);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  getMembers,
  getMember
};

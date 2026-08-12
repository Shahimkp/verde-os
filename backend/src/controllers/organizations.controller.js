const organizationService = require('../services/organizations.service');
const { successResponse, errorResponse } = require('../utils/response');

const getOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Authorization: User can only fetch their own organization
    if (id !== req.organizationId) {
      return errorResponse(res, { code: 'FORBIDDEN', message: 'You can only access your own organization.' }, 403);
    }

    const org = await organizationService.getOrganization(id);
    
    if (!org) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Organization not found' }, 404);
    }
    
    return successResponse(res, org);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  getOrganization
};

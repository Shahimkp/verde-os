const projectService = require('../services/projects.service');
const { successResponse, errorResponse } = require('../utils/response');

const getProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects(req.organizationId, req.user.role, req.user.id);
    return successResponse(res, projects, { total: projects.length });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProject(req.organizationId, id, req.user.role, req.user.id);
    
    if (!project) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Project not found or access denied' }, 404);
    }
    
    return successResponse(res, project);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.organizationId, req.body);
    return successResponse(res, project, null, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectService.updateProject(req.organizationId, id, req.body);
    if (!project) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Project not found' }, 404);
    }
    return successResponse(res, project);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await projectService.deleteProject(req.organizationId, id);
    return res.status(204).send();
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    // Basic verification that they can see the project first
    const project = await projectService.getProject(req.organizationId, id, req.user.role, req.user.id);
    if (!project) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Project not found or access denied' }, 404);
    }

    const members = await projectService.getProjectMembers(req.organizationId, id);
    return successResponse(res, members, { total: members.length });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await projectService.addProjectMember(req.organizationId, id, req.body);
    return successResponse(res, member, null, 201);
  } catch (error) {
    // 23505 is PostgreSQL unique violation code
    if (error.code === '23505') {
       return errorResponse(res, { code: 'CONFLICT', message: 'User is already a member of this project' }, 409);
    }
    return errorResponse(res, error);
  }
};

const removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await projectService.removeProjectMember(req.organizationId, id, userId);
    return res.status(204).send();
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember
};

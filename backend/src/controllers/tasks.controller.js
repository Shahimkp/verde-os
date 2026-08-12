const taskService = require('../services/tasks.service');
const { successResponse, errorResponse } = require('../utils/response');

const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.organizationId, req.user.role, req.user.id);
    return successResponse(res, tasks, { total: tasks.length });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await taskService.getTask(req.organizationId, id, req.user.role, req.user.id);
    
    if (!task) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Task not found or access denied' }, 404);
    }
    
    return successResponse(res, task);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const createTask = async (req, res) => {
  try {
    // Only Admin/SuperAdmin can create tasks unrestrictedly, 
    // but the instruction says "ADMIN: create tasks", "MEMBER: work with tasks assigned to them".
    // Therefore, members shouldn't be creating tasks right now unless specified.
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
      return errorResponse(res, { code: 'FORBIDDEN', message: 'You are not authorized to create tasks.' }, 403);
    }

    const task = await taskService.createTask(req.organizationId, req.body);
    return successResponse(res, task, null, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if task exists and user is permitted
    const existingTask = await taskService.getTask(req.organizationId, id, req.user.role, req.user.id);
    if (!existingTask) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Task not found or access denied' }, 404);
    }

    // If Member, they can only update certain fields (e.g., status). 
    // We will restrict them from changing the assignee_id or project_id.
    let updateData = req.body;
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
      const allowedFields = ['status', 'description', 'priority'];
      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });
      updateData = filteredData;
    }

    const task = await taskService.updateTask(req.organizationId, id, updateData);
    return successResponse(res, task);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
      return errorResponse(res, { code: 'FORBIDDEN', message: 'You are not authorized to delete tasks.' }, 403);
    }

    await taskService.deleteTask(req.organizationId, id);
    return res.status(204).send();
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};

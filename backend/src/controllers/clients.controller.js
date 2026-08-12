const clientService = require('../services/clients.service');
const { successResponse, errorResponse } = require('../utils/response');

const getClients = async (req, res) => {
  try {
    const clients = await clientService.getClients(req.organizationId);
    return successResponse(res, clients, { total: clients.length });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.getClient(req.organizationId, id);
    if (!client) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Client not found' }, 404);
    }
    return successResponse(res, client);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const createClient = async (req, res) => {
  try {
    const client = await clientService.createClient(req.organizationId, req.body);
    return successResponse(res, client, null, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await clientService.updateClient(req.organizationId, id, req.body);
    if (!client) {
      return errorResponse(res, { code: 'NOT_FOUND', message: 'Client not found' }, 404);
    }
    return successResponse(res, client);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    await clientService.deleteClient(req.organizationId, id);
    return res.status(204).send();
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
};

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clients.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { clientSchema } = require('../validations/clients.validation');

router.use(requireAuth);

router.get('/', clientController.getClients);
router.post('/', validate(clientSchema.create), clientController.createClient);
router.get('/:id', validate(clientSchema.get), clientController.getClient);
router.patch('/:id', validate(clientSchema.update), clientController.updateClient);
router.delete('/:id', validate(clientSchema.get), clientController.deleteClient);

module.exports = router;

const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizations.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { organizationSchema } = require('../validations/organizations.validation');

// Require authentication for all organization routes
router.use(requireAuth);

router.get('/:id', validate(organizationSchema.getOrg), orgController.getOrganization);

module.exports = router;

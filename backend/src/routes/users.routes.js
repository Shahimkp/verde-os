const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { userSchema } = require('../validations/users.validation');

// Require authentication for all user routes
router.use(requireAuth);

router.get('/', userController.getMembers);
router.get('/:id', validate(userSchema.getMember), userController.getMember);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authSchema } = require('../validations/auth.validation');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', validate(authSchema.login), authController.login);
router.post('/logout', authController.logout); // Logout can be called even if token is expired, so we don't necessarily require active auth here or we can just let the controller handle the token.

// Protected routes
router.get('/me', requireAuth, authController.getMe);

module.exports = router;

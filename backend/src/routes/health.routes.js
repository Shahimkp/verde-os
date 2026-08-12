const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/', healthController.checkHealth);
router.get('/db', healthController.checkDbHealth);

module.exports = router;

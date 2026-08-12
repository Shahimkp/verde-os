const express = require('express');
const router = express.Router();
const taskController = require('../controllers/tasks.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { taskSchema } = require('../validations/tasks.validation');

router.use(requireAuth);

router.get('/', taskController.getTasks);
router.post('/', validate(taskSchema.create), taskController.createTask);
router.get('/:id', validate(taskSchema.get), taskController.getTask);
router.patch('/:id', validate(taskSchema.update), taskController.updateTask);
router.delete('/:id', requireAdmin, validate(taskSchema.get), taskController.deleteTask);

module.exports = router;

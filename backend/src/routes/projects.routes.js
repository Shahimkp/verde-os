const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projects.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { projectSchema } = require('../validations/projects.validation');

router.use(requireAuth);

// Read operations (Members can access permitted projects)
router.get('/', projectController.getProjects);
router.get('/:id', validate(projectSchema.get), projectController.getProject);
router.get('/:id/members', validate(projectSchema.get), projectController.getProjectMembers);

// Write operations (Admin only)
router.post('/', requireAdmin, validate(projectSchema.create), projectController.createProject);
router.patch('/:id', requireAdmin, validate(projectSchema.update), projectController.updateProject);
router.delete('/:id', requireAdmin, validate(projectSchema.get), projectController.deleteProject);

// Member management (Admin only)
router.post('/:id/members', requireAdmin, validate(projectSchema.addMember), projectController.addProjectMember);
router.delete('/:id/members/:userId', requireAdmin, validate(projectSchema.removeMember), projectController.removeProjectMember);

module.exports = router;

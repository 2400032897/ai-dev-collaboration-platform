const router = require('express').Router();
const ctrl = require('../controllers/project.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.post('/', ctrl.createProject);
router.get('/', ctrl.getProjects);
router.get('/:id', ctrl.getProject);
router.patch('/:id', ctrl.updateProject);
router.delete('/:id', ctrl.deleteProject);
router.post('/:id/members', ctrl.addMember);

module.exports = router;

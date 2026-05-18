const router = require('express').Router();
const ctrl = require('../controllers/workspace.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.post('/', ctrl.createWorkspace);
router.get('/', ctrl.getMyWorkspaces);
router.get('/join/:token', ctrl.joinWorkspace);
router.get('/:slug', ctrl.getWorkspaceBySlug);
router.post('/:id/invite', ctrl.regenerateInvite);
router.post('/:id/upgrade', ctrl.upgradePlan);
router.patch('/:id/members/:userId/role', ctrl.changeMemberRole);
router.delete('/:id/members/:userId', ctrl.removeMember);

module.exports = router;

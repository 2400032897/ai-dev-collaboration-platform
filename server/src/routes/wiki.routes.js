const router = require('express').Router();
const ctrl = require('../controllers/wiki.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', ctrl.listPages);
router.post('/', ctrl.createPage);
router.get('/:id', ctrl.getPage);
router.patch('/:id', ctrl.updatePage);
router.delete('/:id', ctrl.deletePage);
router.get('/:id/versions', ctrl.getVersions);

module.exports = router;

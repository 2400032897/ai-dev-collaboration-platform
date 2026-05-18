const router = require('express').Router();
const ctrl = require('../controllers/snippet.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', ctrl.getSnippets);
router.post('/', ctrl.createSnippet);
router.patch('/:id', ctrl.updateSnippet);
router.delete('/:id', ctrl.deleteSnippet);

module.exports = router;

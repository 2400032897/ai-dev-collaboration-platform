const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', ctrl.getTasks);
router.post('/', ctrl.createTask);
router.get('/:id', ctrl.getTask);
router.patch('/:id', ctrl.updateTask);
router.patch('/:id/move', ctrl.moveTask);
router.delete('/:id', ctrl.deleteTask);
router.post('/:id/comments', ctrl.addComment);
router.get('/:id/comments', ctrl.getComments);

module.exports = router;

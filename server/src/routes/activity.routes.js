const router = require('express').Router();
const ctrl = require('../controllers/activity.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', ctrl.getActivity);

module.exports = router;

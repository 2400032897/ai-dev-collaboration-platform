const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);
router.post('/review-code', ctrl.reviewCode);
router.post('/standup', ctrl.generateStandup);
router.post('/breakdown', ctrl.breakdownFeature);
router.post('/summary', ctrl.projectSummary);

module.exports = router;

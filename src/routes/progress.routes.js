const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/progress.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateProgress } = require('../middlewares/validation.middleware');

router.use(verifyToken);

router.get('/',         ProgressController.getMyProgress);
router.get('/summary',  ProgressController.getSummary);
router.post('/',        validateProgress, ProgressController.save);

module.exports = router;

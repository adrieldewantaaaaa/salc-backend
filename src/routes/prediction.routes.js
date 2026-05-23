const express = require('express');
const router = express.Router();
const PredictionController = require('../controllers/prediction.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateFeedback } = require('../middlewares/validation.middleware');

router.use(verifyToken);

router.post('/feedback', validateFeedback, PredictionController.getAutoFeedback);

module.exports = router;
const express = require('express');
const router = express.Router();
const RecommendationController = require('../controllers/recommendation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/',              RecommendationController.getMyRecommendations);
router.patch('/:id/done',    RecommendationController.markDone);

module.exports = router;

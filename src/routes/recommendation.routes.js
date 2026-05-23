const express = require('express');
const router = express.Router();
const RecommendationController = require('../controllers/Recommendation.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Ambil rekomendasi berdasarkan aktivitas belajar
router.get('/',                     RecommendationController.getMyRecommendations);

// Ambil rekomendasi berdasarkan performa akademik
router.post('/performance',         RecommendationController.getPerformanceRecommendations);

// Tandai rekomendasi selesai
router.patch('/:id/done',           RecommendationController.markDone);

module.exports = router;
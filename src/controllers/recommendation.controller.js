const axios = require('axios');
const RecommendationModel = require('../models/recommendation.model');
const ProgressModel = require('../models/progress.model');
const MaterialModel = require('../models/material.model');
require('dotenv').config();

const RecommendationController = {
  // GET /api/recommendations — ambil rekomendasi user yang login
  getMyRecommendations: async (req, res) => {
    try {
      // Coba ambil dari ML service dulu
      try {
        const summary = await ProgressModel.getSummary(req.user.id);
        const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/predict/recommendation`, {
          user_id: req.user.id,
          avg_score: summary.avg_score || 0,
          completed: summary.completed || 0,
        });

        if (mlRes.data.recommendations?.length) {
          await RecommendationModel.bulkCreate(req.user.id, mlRes.data.recommendations);
        }
      } catch {
        // ML service belum jalan, pakai fallback
        await _fallbackRecommendation(req.user.id);
      }

      const recommendations = await RecommendationModel.findByUser(req.user.id);
      res.json({ success: true, data: recommendations });
    } catch (err) {
      console.error('Recommendation error:', err);
      res.status(500).json({ success: false, message: 'Failed to get recommendations' });
    }
  },

  // PATCH /api/recommendations/:id/done — tandai rekomendasi selesai
  markDone: async (req, res) => {
    try {
      const affected = await RecommendationModel.markDone(req.params.id, req.user.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Recommendation not found' });
      res.json({ success: true, message: 'Marked as done' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update recommendation' });
    }
  },
};

// Fallback: rekomendasikan materi yang belum selesai atau nilai rendah
async function _fallbackRecommendation(userId) {
  const progress = await ProgressModel.findByUserId(userId);
  const allMaterials = await MaterialModel.findAll();

  const doneIds = new Set(
    progress.filter(p => p.status === 'completed' && p.score >= 70).map(p => p.material_id)
  );

  const toRecommend = allMaterials
    .filter(m => !doneIds.has(m.id))
    .slice(0, 3)
    .map(m => ({ materialId: m.id, reason: 'Materi ini belum kamu selesaikan' }));

  if (toRecommend.length) {
    await RecommendationModel.bulkCreate(userId, toRecommend);
  }
}

module.exports = RecommendationController;

const axios = require('axios');
const RecommendationModel = require('../models/recommendation.model');
const ProgressModel = require('../models/progress.model');
const MaterialModel = require('../models/material.model');
require('dotenv').config();

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

const RecommendationController = {

  // GET /api/recommendations
  getMyRecommendations: async (req, res) => {
    try {
      const summary  = await ProgressModel.getSummary(req.user.id);
      const progress = await ProgressModel.findByUserId(req.user.id);

      let mlRecommendations = null;

      try {
        // Coba Model 1 dulu untuk rekomendasi berbasis aktivitas
        const completionRate = summary.total_materials > 0
          ? (summary.completed / summary.total_materials) * 100 : 0;

        const payload = {
          EngagementScore      : Math.min(100, summary.avg_score || 0),
          Motivation           : Math.round(completionRate / 20),
          AssignmentCompletion : completionRate,
          StudyStressBalance   : 5,
          Attendance           : completionRate,
          StudyHours           : Math.round((summary.completed || 0) * 2),
          Gender               : 0,
          Internet             : 1,
          EduTech              : 1,
        };

        const mlRes = await axios.post(`${ML_URL}/api/predict/activity`, payload, { timeout: 10000 });

        if (mlRes.data.recommendations?.length || mlRes.data.media_rekomendasi?.length) {
          mlRecommendations = {
            recommendations : mlRes.data.recommendations || [],
            media           : mlRes.data.media_rekomendasi || [],
            action_plan     : mlRes.data.action_plan || [],
            risk_level      : mlRes.data.risk_level,
          };
        }
      } catch {
        // ML service tidak tersedia — gunakan fallback
      }

      // Selalu sertakan rekomendasi materi dari DB (fallback)
      const materialRecs = await _getMaterialRecommendations(req.user.id, progress);

      res.json({
        success: true,
        data: {
          ml_recommendations : mlRecommendations,    // dari model DS (bisa null jika service mati)
          material_recs      : materialRecs,          // rekomendasi materi dari DB (selalu ada)
        },
      });
    } catch (err) {
      console.error('Recommendation error:', err);
      res.status(500).json({ success: false, message: 'Failed to get recommendations' });
    }
  },

  // POST /api/recommendations/performance
  // Rekomendasi berbasis performa akademik (Model 2)
  getPerformanceRecommendations: async (req, res) => {
    try {
      const { gender, race_ethnicity, parental_education, lunch, test_preparation, reading_score, writing_score } = req.body;

      if (reading_score === undefined || writing_score === undefined) {
        return res.status(400).json({ success: false, message: 'reading_score dan writing_score wajib diisi' });
      }

      let result;
      try {
        const payload = {
          'gender'                      : gender ?? 0,
          'race/ethnicity'              : race_ethnicity ?? 2,
          'parental level of education' : parental_education ?? 2,
          'lunch'                       : lunch ?? 1,
          'test preparation course'     : test_preparation ?? 0,
          'reading score'               : reading_score,
          'writing score'               : writing_score,
        };

        const mlRes = await axios.post(`${ML_URL}/api/predict/performance`, payload, { timeout: 10000 });
        result = {
          at_risk         : mlRes.data.at_risk,
          risk_tier       : mlRes.data.risk_tier,
          probability     : mlRes.data.probability,
          recommendations : mlRes.data.recommendations || [],
          action_plan     : mlRes.data.action_plan || [],
        };
      } catch {
        const avg = (reading_score + writing_score) / 2;
        result = {
          at_risk         : avg < 65,
          risk_tier       : avg < 50 ? 'KRITIS' : avg < 65 ? 'SEDANG' : 'AMAN',
          probability     : null,
          recommendations : avg < 65 ? ['Tingkatkan latihan membaca dan menulis', 'Ikuti kelas persiapan ujian'] : ['Pertahankan performa akademikmu'],
          action_plan     : [],
        };
      }

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Performance recommendation error:', err);
      res.status(500).json({ success: false, message: 'Failed to get performance recommendations' });
    }
  },

  // PATCH /api/recommendations/:id/done
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

// ─── Helper: rekomendasi materi dari DB ──────────────────────────────────────
async function _getMaterialRecommendations(userId, progress) {
  try {
    const allMaterials = await MaterialModel.findAll();
    const doneIds = new Set(
      progress.filter(p => p.status === 'completed' && p.score >= 70).map(p => p.material_id)
    );
    return allMaterials
      .filter(m => !doneIds.has(m.id))
      .slice(0, 5)
      .map(m => ({
        id      : m.id,
        title   : m.title,
        subject : m.subject,
        difficulty : m.difficulty,
        reason  : 'Materi ini belum kamu selesaikan',
      }));
  } catch {
    return [];
  }
}

module.exports = RecommendationController;
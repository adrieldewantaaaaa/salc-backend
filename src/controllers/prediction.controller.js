const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

const PredictionController = {
  // POST /api/predictions/feedback — kirim jawaban, dapat auto feedback dari model AI
  getAutoFeedback: async (req, res) => {
    try {
      const { questionId, answer } = req.body;

      if (!questionId || !answer) {
        return res.status(400).json({ success: false, message: 'questionId and answer are required' });
      }

      // Kirim ke Flask/FastAPI ML service
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict/feedback`, {
        question_id: questionId,
        answer,
      });

      const { category, score, feedback, recommendation } = mlResponse.data;

      // Simpan hasil ke DB
      await db.execute(
        `INSERT INTO predictions (user_id, question_id, answer, category, score, feedback, recommendation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, questionId, answer, category, score, feedback, recommendation]
      );

      res.json({
        success: true,
        data: { category, score, feedback, recommendation },
      });
    } catch (err) {
      console.error('Auto feedback error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to get auto feedback' });
    }
  },

  // GET /api/predictions/early-warning — cek apakah user berisiko tertinggal
  getEarlyWarning: async (req, res) => {
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict/early-warning`, {
        user_id: req.user.id,
      });

      const { is_at_risk, risk_level, message } = mlResponse.data;

      res.json({
        success: true,
        data: { is_at_risk, risk_level, message },
      });
    } catch (err) {
      console.error('Early warning error:', err.message);
      // Fallback response jika ML service belum siap
      res.json({
        success: true,
        data: { is_at_risk: false, risk_level: 'low', message: 'ML service not yet available' },
      });
    }
  },

  // GET /api/predictions/recommendation — rekomendasi materi
  getRecommendation: async (req, res) => {
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict/recommendation`, {
        user_id: req.user.id,
      });

      res.json({ success: true, data: mlResponse.data });
    } catch (err) {
      console.error('Recommendation error:', err.message);
      res.json({
        success: true,
        data: { recommendations: [], message: 'ML service not yet available' },
      });
    }
  },
};

module.exports = PredictionController;

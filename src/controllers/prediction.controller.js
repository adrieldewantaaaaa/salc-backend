const axios = require('axios');
const db = require('../config/db');
require('dotenv').config();

const PredictionController = {
  // POST /api/predictions/feedback — kirim jawaban, dapat auto feedback dari model AI
  getAutoFeedback: async (req, res) => {
    try {
      const { questionId, answer } = req.body;

      if (!questionId || !answer) {
        return res.status(400).json({ success: false, message: 'questionId and answer are required' });
      }

      // Kirim ke FastAPI ML service 
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
        text: answer,
      });

      const { kategori, skor, feedback, confidence } = mlResponse.data;

      // Simpan hasil ke DB
      await db.execute(
        `INSERT INTO predictions (user_id, question_id, answer, category, score, feedback)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, questionId, answer, kategori, skor, feedback]
      );

      res.json({
        success: true,
        data: {
          kategori,
          skor,
          feedback,
          confidence,
        },
      });
    } catch (err) {
      console.error('Auto feedback error:', err.message);

      // Fallback jika ML service tidak jalan
      res.status(500).json({
        success: false,
        message: 'ML service tidak tersedia. Pastikan AI service sudah berjalan di port 5000.',
      });
    }
  },

  // GET /api/predictions/early-warning 
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
      res.json({
        success: true,
        data: { is_at_risk: false, risk_level: 'low', message: 'ML service not yet available' },
      });
    }
  },

  // GET /api/predictions/recommendation 
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
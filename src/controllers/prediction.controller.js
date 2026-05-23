const axios = require('axios');
const db = require('../config/db');
require('dotenv').config();

const PredictionController = {
  // POST /api/predictions/feedback
  getAutoFeedback: async (req, res) => {
    try {
      const { questionId, answer } = req.body;

      if (!questionId || !answer) {
        return res.status(400).json({ success: false, message: 'questionId and answer are required' });
      }

      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
        text: answer,
      });

      const { kategori, skor, feedback, confidence } = mlResponse.data;

      await db.execute(
        `INSERT INTO predictions (user_id, question_id, answer, category, score, feedback)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, questionId, answer, kategori, skor, feedback]
      );

      res.json({
        success: true,
        data: { kategori, skor, feedback, confidence },
      });
    } catch (err) {
      console.error('Auto feedback error:', err.message);
      res.status(500).json({
        success: false,
        message: 'ML service tidak tersedia. Pastikan AI service sudah berjalan di port 5000.',
      });
    }
  },
};

module.exports = PredictionController;
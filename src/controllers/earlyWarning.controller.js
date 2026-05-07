const axios = require('axios');
const EarlyWarningModel = require('../models/earlyWarning.model');
const ProgressModel = require('../models/progress.model');
require('dotenv').config();

const EarlyWarningController = {
  // GET /api/early-warning/me — cek status risiko user yang login
  checkMyRisk: async (req, res) => {
    try {
      // Ambil summary progress user sebagai fitur input ML
      const summary = await ProgressModel.getSummary(req.user.id);

      let result;
      try {
        // Kirim ke ML service
        const mlRes = await axios.post(`${process.env.ML_SERVICE_URL}/predict/early-warning`, {
          user_id: req.user.id,
          avg_score: summary.avg_score || 0,
          completed: summary.completed || 0,
          total_materials: summary.total_materials || 0,
        });
        result = mlRes.data;
      } catch {
        // Fallback: hitung sendiri jika ML service belum jalan
        result = _fallbackRiskCheck(summary);
      }

      // Simpan hasil ke DB
      await EarlyWarningModel.create({
        userId: req.user.id,
        isAtRisk: result.is_at_risk,
        riskLevel: result.risk_level,
        riskScore: result.risk_score,
        message: result.message,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Early warning error:', err);
      res.status(500).json({ success: false, message: 'Failed to check risk' });
    }
  },

  // GET /api/early-warning/unresolved — untuk dashboard guru (semua siswa berisiko)
  getUnresolved: async (req, res) => {
    try {
      const warnings = await EarlyWarningModel.findUnresolved();
      res.json({ success: true, data: warnings });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch warnings' });
    }
  },

  // PATCH /api/early-warning/:id/resolve — guru tandai sudah ditangani
  resolve: async (req, res) => {
    try {
      const affected = await EarlyWarningModel.resolve(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Warning not found' });
      res.json({ success: true, message: 'Warning resolved' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to resolve warning' });
    }
  },
};

// Fallback logic sementara sebelum model ML siap
function _fallbackRiskCheck(summary) {
  const avgScore = summary.avg_score || 0;
  const completionRate = summary.total_materials > 0
    ? (summary.completed / summary.total_materials) * 100 : 0;

  let riskLevel = 'low';
  let isAtRisk = false;
  let message = 'Performa belajar kamu baik, terus semangat!';

  if (avgScore < 50 || completionRate < 30) {
    riskLevel = 'high';
    isAtRisk = true;
    message = 'Kamu berisiko tertinggal. Segera hubungi pengajar untuk bantuan.';
  } else if (avgScore < 70 || completionRate < 60) {
    riskLevel = 'medium';
    isAtRisk = true;
    message = 'Ada beberapa materi yang perlu perhatian lebih. Yuk tingkatkan lagi!';
  }

  return { is_at_risk: isAtRisk, risk_level: riskLevel, risk_score: null, message };
}

module.exports = EarlyWarningController;

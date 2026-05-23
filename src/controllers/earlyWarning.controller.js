const axios = require('axios');
const EarlyWarningModel = require('../models/earlyWarning.model');
const ProgressModel = require('../models/progress.model');
require('dotenv').config();

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

const EarlyWarningController = {

  // GET /api/early-warning/me
  // Pakai Model 1 (aktivitas belajar) — data dari progress user
  checkMyRisk: async (req, res) => {
    try {
      const summary = await ProgressModel.getSummary(req.user.id);
      const progress = await ProgressModel.findByUserId(req.user.id);

      let result;
      try {
        // Hitung fitur dari data progress untuk Model 1
        const totalMaterials   = summary.total_materials || 0;
        const completed        = summary.completed || 0;
        const avgScore         = summary.avg_score || 0;
        const completionRate   = totalMaterials > 0 ? (completed / totalMaterials) * 100 : 0;

        // Estimasi fitur Model 1 dari data yang tersedia
        const payload = {
          EngagementScore       : Math.min(100, avgScore),
          Motivation            : Math.round(completionRate / 20),   // skala 0-5
          AssignmentCompletion  : completionRate,
          StudyStressBalance    : 5,                                  // default netral
          Attendance            : completionRate,
          StudyHours            : Math.round(completed * 2),          // estimasi
          Gender                : 0,
          Internet              : 1,
          EduTech               : 1,
        };

        const mlRes = await axios.post(`${ML_URL}/api/predict/activity`, payload, { timeout: 10000 });
        result = {
          is_at_risk   : mlRes.data.risk_level !== 'Aman',
          risk_level   : mlRes.data.risk_level,
          risk_score   : mlRes.data.confidence,
          message      : _buildMessage(mlRes.data.risk_level),
          recommendations : mlRes.data.recommendations || [],
          action_plan     : mlRes.data.action_plan || [],
          model           : 'activity',
        };
      } catch {
        // Fallback logic jika ML service tidak tersedia
        result = _fallbackRiskCheck(summary);
      }

      await EarlyWarningModel.create({
        userId    : req.user.id,
        isAtRisk  : result.is_at_risk,
        riskLevel : result.risk_level,
        riskScore : result.risk_score || null,
        message   : result.message,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Early warning error:', err);
      res.status(500).json({ success: false, message: 'Failed to check risk' });
    }
  },

  // POST /api/early-warning/performance
  // Pakai Model 2 (performa akademik) — input manual dari FE
  checkPerformanceRisk: async (req, res) => {
    try {
      const {
        gender,
        race_ethnicity,
        parental_education,
        lunch,
        test_preparation,
        reading_score,
        writing_score,
      } = req.body;

      // Validasi input wajib
      if (
        gender === undefined || reading_score === undefined ||
        writing_score === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'gender, reading_score, dan writing_score wajib diisi',
        });
      }

      let result;
      try {
        const payload = {
          'gender'                         : gender,
          'race/ethnicity'                 : race_ethnicity ?? 2,
          'parental level of education'    : parental_education ?? 2,
          'lunch'                          : lunch ?? 1,
          'test preparation course'        : test_preparation ?? 0,
          'reading score'                  : reading_score,
          'writing score'                  : writing_score,
        };

        const mlRes = await axios.post(`${ML_URL}/api/predict/performance`, payload, { timeout: 10000 });
        result = {
          is_at_risk      : mlRes.data.at_risk,
          risk_level      : mlRes.data.risk_tier,       // AMAN / SEDANG / KRITIS
          risk_score      : mlRes.data.probability,
          message         : _buildMessage(mlRes.data.risk_tier),
          recommendations : mlRes.data.recommendations || [],
          action_plan     : mlRes.data.action_plan || [],
          model           : 'performance',
        };
      } catch {
        result = _fallbackPerformanceCheck(reading_score, writing_score);
      }

      await EarlyWarningModel.create({
        userId    : req.user.id,
        isAtRisk  : result.is_at_risk,
        riskLevel : result.risk_level,
        riskScore : result.risk_score || null,
        message   : result.message,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Performance risk error:', err);
      res.status(500).json({ success: false, message: 'Failed to check performance risk' });
    }
  },

  // GET /api/early-warning/unresolved (teacher/admin)
  getUnresolved: async (req, res) => {
    try {
      const warnings = await EarlyWarningModel.findUnresolved();
      res.json({ success: true, data: warnings });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch warnings' });
    }
  },

  // PATCH /api/early-warning/:id/resolve (teacher/admin)
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _buildMessage(riskLevel) {
  const level = (riskLevel || '').toUpperCase();
  if (level === 'KRITIS' || level === 'KRITIS') return 'Kamu berisiko tinggi tertinggal. Segera hubungi pengajar untuk bantuan.';
  if (level === 'PERHATIAN' || level === 'SEDANG') return 'Ada beberapa area yang perlu perhatian lebih. Yuk tingkatkan lagi!';
  return 'Performa belajar kamu baik. Terus semangat!';
}

function _fallbackRiskCheck(summary) {
  const avgScore       = summary.avg_score || 0;
  const completionRate = summary.total_materials > 0
    ? (summary.completed / summary.total_materials) * 100 : 0;

  if (avgScore < 50 || completionRate < 30) {
    return { is_at_risk: true,  risk_level: 'Kritis',    risk_score: null, message: 'Kamu berisiko tinggi tertinggal. Segera hubungi pengajar.', recommendations: [], action_plan: [] };
  }
  if (avgScore < 70 || completionRate < 60) {
    return { is_at_risk: true,  risk_level: 'Perhatian', risk_score: null, message: 'Ada beberapa area yang perlu perhatian lebih.', recommendations: [], action_plan: [] };
  }
  return   { is_at_risk: false, risk_level: 'Aman',      risk_score: null, message: 'Performa belajar kamu baik. Terus semangat!', recommendations: [], action_plan: [] };
}

function _fallbackPerformanceCheck(readingScore, writingScore) {
  const avg = (readingScore + writingScore) / 2;
  if (avg < 50) return { is_at_risk: true,  risk_level: 'KRITIS',  risk_score: null, message: 'Skor akademik menunjukkan risiko tinggi.', recommendations: [], action_plan: [] };
  if (avg < 65) return { is_at_risk: true,  risk_level: 'SEDANG',  risk_score: null, message: 'Skor akademik perlu ditingkatkan.', recommendations: [], action_plan: [] };
  return         { is_at_risk: false, risk_level: 'AMAN',    risk_score: null, message: 'Skor akademik kamu baik.', recommendations: [], action_plan: [] };
}

module.exports = EarlyWarningController;
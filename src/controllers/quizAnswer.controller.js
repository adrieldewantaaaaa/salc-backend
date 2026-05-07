const QuizAnswerModel = require('../models/quizAnswer.model');
const ProgressModel = require('../models/progress.model');

const QuizAnswerController = {
  // POST /api/quiz — submit satu jawaban
  submitOne: async (req, res) => {
    try {
      const { materialId, question, answer, isCorrect, score } = req.body;

      const id = await QuizAnswerModel.create({
        userId: req.user.id,
        materialId,
        question,
        answer,
        isCorrect,
        score,
      });

      res.status(201).json({
        success: true,
        message: 'Answer submitted',
        data: { id },
      });
    } catch (err) {
      console.error('Submit answer error:', err);
      res.status(500).json({ success: false, message: 'Failed to submit answer' });
    }
  },

  // POST /api/quiz/bulk — submit semua jawaban kuis sekaligus + update progress otomatis
  submitBulk: async (req, res) => {
    try {
      const { materialId, answers } = req.body;

      if (!materialId || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'materialId and answers array are required',
        });
      }

      // Simpan semua jawaban
      await QuizAnswerModel.bulkCreate(req.user.id, materialId, answers);

      // Hitung skor rata-rata dari jawaban yang baru disubmit
      const totalScore = answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
      const avgScore = answers.length > 0 ? totalScore / answers.length : 0;
      const status = avgScore >= 70 ? 'completed' : 'in_progress';

      // Update progress otomatis
      await ProgressModel.upsert({
        userId: req.user.id,
        materialId,
        score: avgScore,
        status,
      });

      // Ambil summary hasil kuis
      const summary = await QuizAnswerModel.getSummaryByMaterial(req.user.id, materialId);

      res.status(201).json({
        success: true,
        message: 'Quiz submitted successfully',
        data: {
          summary,
          progress_status: status,
          avg_score: avgScore,
        },
      });
    } catch (err) {
      console.error('Bulk submit error:', err);
      res.status(500).json({ success: false, message: 'Failed to submit quiz' });
    }
  },

  // GET /api/quiz — ambil semua jawaban milik user yang login
  getMyAnswers: async (req, res) => {
    try {
      const answers = await QuizAnswerModel.findByUser(req.user.id);
      res.json({ success: true, data: answers });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch answers' });
    }
  },

  // GET /api/quiz/material/:materialId — jawaban user untuk materi tertentu
  getByMaterial: async (req, res) => {
    try {
      const { materialId } = req.params;
      const answers = await QuizAnswerModel.findByUserAndMaterial(req.user.id, materialId);
      const summary = await QuizAnswerModel.getSummaryByMaterial(req.user.id, materialId);
      res.json({ success: true, data: { answers, summary } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch answers' });
    }
  },

  // GET /api/quiz/material/:materialId/all — semua jawaban siswa (untuk guru)
  getAllByMaterial: async (req, res) => {
    try {
      const answers = await QuizAnswerModel.findByMaterial(req.params.materialId);
      res.json({ success: true, data: answers });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch answers' });
    }
  },
};

module.exports = QuizAnswerController;

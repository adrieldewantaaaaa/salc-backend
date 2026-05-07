const ProgressModel = require('../models/progress.model');

const ProgressController = {
  // GET /api/progress — ambil progress user yang login
  getMyProgress: async (req, res) => {
    try {
      const progress = await ProgressModel.findByUserId(req.user.id);
      res.json({ success: true, data: progress });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch progress' });
    }
  },

  // GET /api/progress/summary — dashboard summary
  getSummary: async (req, res) => {
    try {
      const summary = await ProgressModel.getSummary(req.user.id);
      res.json({ success: true, data: summary });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch summary' });
    }
  },

  // POST /api/progress — simpan/update progress
  save: async (req, res) => {
    try {
      const { materialId, score, status } = req.body;

      if (!materialId || score === undefined || !status) {
        return res.status(400).json({ success: false, message: 'materialId, score, and status are required' });
      }

      await ProgressModel.upsert({
        userId: req.user.id,
        materialId,
        score,
        status,
      });

      res.json({ success: true, message: 'Progress saved successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to save progress' });
    }
  },
};

module.exports = ProgressController;

const MaterialModel = require('../models/material.model');

const MaterialController = {
  getAll: async (req, res) => {
    try {
      const { subject } = req.query;
      const materials = subject
        ? await MaterialModel.findBySubject(subject)
        : await MaterialModel.findAll();
      res.json({ success: true, data: materials });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch materials' });
    }
  },

  getById: async (req, res) => {
    try {
      const material = await MaterialModel.findById(req.params.id);
      if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
      res.json({ success: true, data: material });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch material' });
    }
  },

  create: async (req, res) => {
    try {
      const { title, subject, content, difficulty } = req.body;
      if (!title || !subject) {
        return res.status(400).json({ success: false, message: 'Title and subject are required' });
      }
      const id = await MaterialModel.create({ title, subject, content, difficulty, createdBy: req.user.id });
      res.status(201).json({ success: true, message: 'Material created', data: { id } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to create material' });
    }
  },

  update: async (req, res) => {
    try {
      const { title, subject, content, difficulty } = req.body;
      const affected = await MaterialModel.update(req.params.id, { title, subject, content, difficulty });
      if (!affected) return res.status(404).json({ success: false, message: 'Material not found' });
      res.json({ success: true, message: 'Material updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update material' });
    }
  },

  delete: async (req, res) => {
    try {
      const affected = await MaterialModel.softDelete(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Material not found' });
      res.json({ success: true, message: 'Material deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete material' });
    }
  },
};

module.exports = MaterialController;

const db = require('../config/db');

const MaterialModel = {
  findAll: async () => {
    const [rows] = await db.execute(
      'SELECT * FROM materials WHERE is_active = TRUE ORDER BY order_index ASC'
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      'SELECT * FROM materials WHERE id = ? AND is_active = TRUE', [id]
    );
    return rows[0] || null;
  },

  findBySubject: async (subject) => {
    const [rows] = await db.execute(
      'SELECT * FROM materials WHERE subject = ? AND is_active = TRUE ORDER BY order_index ASC',
      [subject]
    );
    return rows;
  },

  create: async ({ title, subject, content, difficulty, createdBy }) => {
    const [result] = await db.execute(
      'INSERT INTO materials (title, subject, content, difficulty, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, subject, content || null, difficulty || 'medium', createdBy]
    );
    return result.insertId;
  },

  update: async (id, { title, subject, content, difficulty }) => {
    const [result] = await db.execute(
      'UPDATE materials SET title = ?, subject = ?, content = ?, difficulty = ? WHERE id = ?',
      [title, subject, content, difficulty, id]
    );
    return result.affectedRows;
  },

  softDelete: async (id) => {
    const [result] = await db.execute(
      'UPDATE materials SET is_active = FALSE WHERE id = ?', [id]
    );
    return result.affectedRows;
  },
};

module.exports = MaterialModel;

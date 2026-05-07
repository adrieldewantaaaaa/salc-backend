const db = require('../config/db');

const ProgressModel = {
  // Ambil semua progress milik user
  findByUserId: async (userId) => {
    const [rows] = await db.execute(
      `SELECT p.*, m.title as material_title, m.subject
       FROM progress p
       JOIN materials m ON p.material_id = m.id
       WHERE p.user_id = ?
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    return rows;
  },

  // Simpan atau update progress
  upsert: async ({ userId, materialId, score, status }) => {
    const [result] = await db.execute(
      `INSERT INTO progress (user_id, material_id, score, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = ?, status = ?, updated_at = NOW()`,
      [userId, materialId, score, status, score, status]
    );
    return result;
  },

  // Ambil summary progress user (untuk dashboard)
  getSummary: async (userId) => {
    const [rows] = await db.execute(
      `SELECT 
         COUNT(*) as total_materials,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         AVG(score) as avg_score
       FROM progress
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  },
};

module.exports = ProgressModel;

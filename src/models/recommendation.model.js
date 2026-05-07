const db = require('../config/db');

const RecommendationModel = {
  // Simpan rekomendasi dari model ML
  bulkCreate: async (userId, recommendations) => {
    // Hapus rekomendasi lama yang belum dikerjakan
    await db.execute(
      'DELETE FROM recommendations WHERE user_id = ? AND is_done = FALSE', [userId]
    );
    if (!recommendations.length) return;

    const values = recommendations.map((r, i) => [
      userId, r.materialId, r.reason || null, i + 1
    ]);
    await db.query(
      'INSERT INTO recommendations (user_id, material_id, reason, priority) VALUES ?',
      [values]
    );
  },

  // Ambil rekomendasi aktif milik user
  findByUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT r.*, m.title, m.subject, m.difficulty
       FROM recommendations r
       JOIN materials m ON r.material_id = m.id
       WHERE r.user_id = ? AND r.is_done = FALSE
       ORDER BY r.priority ASC`,
      [userId]
    );
    return rows;
  },

  // Tandai rekomendasi sudah selesai dipelajari
  markDone: async (id, userId) => {
    const [result] = await db.execute(
      'UPDATE recommendations SET is_done = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows;
  },
};

module.exports = RecommendationModel;

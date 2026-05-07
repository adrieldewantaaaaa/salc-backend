const db = require('../config/db');

const EarlyWarningModel = {
  // Simpan hasil prediksi early warning
  create: async ({ userId, isAtRisk, riskLevel, riskScore, message }) => {
    const [result] = await db.execute(
      `INSERT INTO early_warnings (user_id, is_at_risk, risk_level, risk_score, message)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, isAtRisk, riskLevel, riskScore || null, message || null]
    );
    return result.insertId;
  },

  // Ambil warning terbaru milik user
  findLatestByUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT * FROM early_warnings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  // Ambil semua warning yang belum resolved (untuk dashboard guru)
  findUnresolved: async () => {
    const [rows] = await db.execute(
      `SELECT ew.*, u.name as student_name, u.email as student_email
       FROM early_warnings ew
       JOIN users u ON ew.user_id = u.id
       WHERE ew.resolved = FALSE AND ew.is_at_risk = TRUE
       ORDER BY ew.created_at DESC`
    );
    return rows;
  },

  // Tandai warning sudah ditangani
  resolve: async (id) => {
    const [result] = await db.execute(
      'UPDATE early_warnings SET resolved = TRUE WHERE id = ?', [id]
    );
    return result.affectedRows;
  },
};

module.exports = EarlyWarningModel;

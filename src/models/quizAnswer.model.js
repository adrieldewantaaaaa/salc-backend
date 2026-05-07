const db = require('../config/db');

const QuizAnswerModel = {
  // Simpan jawaban kuis siswa
  create: async ({ userId, materialId, question, answer, isCorrect, score }) => {
    const [result] = await db.execute(
      `INSERT INTO quiz_answers (user_id, material_id, question, answer, is_correct, score)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, materialId, question, answer, isCorrect ?? false, score ?? 0]
    );
    return result.insertId;
  },

  // Simpan banyak jawaban sekaligus (submit kuis)
  bulkCreate: async (userId, materialId, answers) => {
    const values = answers.map(a => [
      userId, materialId, a.question, a.answer, a.isCorrect ?? false, a.score ?? 0
    ]);
    const [result] = await db.query(
      `INSERT INTO quiz_answers (user_id, material_id, question, answer, is_correct, score)
       VALUES ?`,
      [values]
    );
    return result.affectedRows;
  },

  // Ambil semua jawaban milik user untuk materi tertentu
  findByUserAndMaterial: async (userId, materialId) => {
    const [rows] = await db.execute(
      `SELECT * FROM quiz_answers
       WHERE user_id = ? AND material_id = ?
       ORDER BY created_at DESC`,
      [userId, materialId]
    );
    return rows;
  },

  // Ambil semua jawaban milik user (semua materi)
  findByUser: async (userId) => {
    const [rows] = await db.execute(
      `SELECT qa.*, m.title as material_title, m.subject
       FROM quiz_answers qa
       JOIN materials m ON qa.material_id = m.id
       WHERE qa.user_id = ?
       ORDER BY qa.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Summary kuis per materi (rata-rata skor, jumlah benar/salah)
  getSummaryByMaterial: async (userId, materialId) => {
    const [rows] = await db.execute(
      `SELECT
         COUNT(*)                                              AS total_questions,
         SUM(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END)  AS correct,
         SUM(CASE WHEN is_correct = FALSE THEN 1 ELSE 0 END) AS wrong,
         AVG(score)                                           AS avg_score
       FROM quiz_answers
       WHERE user_id = ? AND material_id = ?`,
      [userId, materialId]
    );
    return rows[0];
  },

  // Ambil jawaban untuk semua siswa pada materi tertentu (untuk guru)
  findByMaterial: async (materialId) => {
    const [rows] = await db.execute(
      `SELECT qa.*, u.name as student_name, u.email as student_email
       FROM quiz_answers qa
       JOIN users u ON qa.user_id = u.id
       WHERE qa.material_id = ?
       ORDER BY qa.created_at DESC`,
      [materialId]
    );
    return rows;
  },
};

module.exports = QuizAnswerModel;

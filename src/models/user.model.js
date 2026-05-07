const db = require('../config/db');

const UserModel = {
  // Cari user berdasarkan email
  findByEmail: async (email) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  // Cari user berdasarkan ID
  findById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // Buat user baru
  create: async ({ name, email, password, role = 'student' }) => {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return result.insertId;
  },

  // Ambil semua user (untuk admin)
  findAll: async () => {
    const [rows] = await db.execute(
      'SELECT id, name, email, role, created_at FROM users'
    );
    return rows;
  },

  // Update profil user
  update: async (id, { name, email }) => {
    const [result] = await db.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );
    return result.affectedRows;
  },
};

module.exports = UserModel;

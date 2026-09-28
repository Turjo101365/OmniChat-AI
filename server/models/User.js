const db = require('../config/database');

class User {
  static async findById(id) {
    const rows = await db.query('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const rows = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }

  static async create({ name, email, passwordHash }) {
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    return {
      id: result.insertId,
      name,
      email,
    };
  }
}

module.exports = User;

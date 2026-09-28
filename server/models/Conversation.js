const db = require('../config/database');

class Conversation {
  static async create({ userId = 1, title = 'New Conversation', provider = 'openrouter', model = 'openai/gpt-4o', externalConversationId = null }) {
    const result = await db.query(
      `INSERT INTO conversations (user_id, title, provider, model, external_conversation_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, provider, model, externalConversationId]
    );
    return this.findById(result.insertId);
  }

  static async findAllByUserId(userId = 1) {
    const rows = await db.query(
      `SELECT c.id, c.user_id, c.title, c.provider, c.model, c.external_conversation_id,
              c.created_at, c.updated_at,
              COUNT(m.id) AS message_count,
              MAX(m.created_at) AS last_message_at
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY COALESCE(MAX(m.created_at), c.updated_at) DESC`,
      [userId]
    );
    return rows;
  }

  static async findById(id) {
    const rows = await db.query(
      'SELECT id, user_id, title, provider, model, external_conversation_id, created_at, updated_at FROM conversations WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async update(id, updates = {}) {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.provider !== undefined) {
      fields.push('provider = ?');
      values.push(updates.provider);
    }
    if (updates.model !== undefined) {
      fields.push('model = ?');
      values.push(updates.model);
    }
    if (updates.externalConversationId !== undefined) {
      fields.push('external_conversation_id = ?');
      values.push(updates.externalConversationId);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await db.query(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async updateTitle(id, title) {
    await db.query('UPDATE conversations SET title = ? WHERE id = ?', [title, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const result = await db.query('DELETE FROM conversations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async search(userId = 1, term = '') {
    const wildcard = `%${term}%`;
    const rows = await db.query(
      `SELECT DISTINCT c.id, c.user_id, c.title, c.provider, c.model, c.created_at, c.updated_at
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.user_id = ? AND (c.title LIKE ? OR m.content LIKE ?)
       ORDER BY c.updated_at DESC`,
      [userId, wildcard, wildcard]
    );
    return rows;
  }
}

module.exports = Conversation;

const db = require('../config/database');

class Message {
  static async create({
    conversationId,
    role,
    content,
    provider,
    model,
    tokenUsage = null,
  }) {
    const usageJson = tokenUsage ? JSON.stringify(tokenUsage) : null;
    const result = await db.query(
      `INSERT INTO messages (conversation_id, role, content, provider, model, token_usage)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [conversationId, role, content, provider, model, usageJson]
    );

    const rows = await db.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    const message = rows[0];
    if (message && message.token_usage && typeof message.token_usage === 'string') {
      try {
        message.token_usage = JSON.parse(message.token_usage);
      } catch (e) {
        // keep as is
      }
    }
    return message;
  }

  static async findByConversationId(conversationId) {
    const rows = await db.query(
      `SELECT id, conversation_id, role, content, provider, model, token_usage, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY id ASC`,
      [conversationId]
    );

    return rows.map((msg) => {
      if (msg.token_usage && typeof msg.token_usage === 'string') {
        try {
          msg.token_usage = JSON.parse(msg.token_usage);
        } catch (e) {
          // ignore
        }
      }
      return msg;
    });
  }

  static async findRecent(conversationId, limit = 20) {
    const rows = await db.query(
      `SELECT id, conversation_id, role, content, provider, model, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY id DESC
       LIMIT ?`,
      [conversationId, limit]
    );
    return rows.reverse();
  }
}

module.exports = Message;

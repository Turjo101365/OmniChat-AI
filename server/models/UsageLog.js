const db = require('../config/database');

class UsageLog {
  static async create({
    userId = 1,
    conversationId = null,
    provider,
    model,
    inputTokens = 0,
    outputTokens = 0,
    totalTokens = 0,
  }) {
    const result = await db.query(
      `INSERT INTO usage_logs (user_id, conversation_id, provider, model, input_tokens, output_tokens, total_tokens)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, conversationId, provider, model, inputTokens, outputTokens, totalTokens]
    );
    return { id: result.insertId };
  }

  static async getSummaryByUser(userId = 1) {
    const rows = await db.query(
      `SELECT provider,
              COUNT(*) AS total_requests,
              SUM(input_tokens) AS sum_input_tokens,
              SUM(output_tokens) AS sum_output_tokens,
              SUM(total_tokens) AS sum_total_tokens
       FROM usage_logs
       WHERE user_id = ?
       GROUP BY provider`,
      [userId]
    );
    return rows;
  }
}

module.exports = UsageLog;

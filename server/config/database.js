const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

let useMemoryFallback = false;
const memoryStore = {
  users: [
    {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      password_hash: '$2a$10$e7ZfHovb5UeG4gHw8fH72eWjA0M1b5K2L9x1n/2kP5bWjA0M1b5K2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  conversations: [],
  messages: [],
  usage_logs: [],
  documents: [],
  document_chunks: [],
};

let autoIncrement = {
  conversations: 1,
  messages: 1,
  usage_logs: 1,
  documents: 1,
  document_chunks: 1,
};

function executeMemoryQuery(sql, params = []) {
  const normalized = sql.trim().replace(/\s+/g, ' ');
  const upper = normalized.toUpperCase();

  if (upper.startsWith('SELECT 1')) {
    return [{ 1: 1 }];
  }

  if (upper.startsWith('INSERT INTO CONVERSATIONS')) {
    const id = autoIncrement.conversations++;
    const [userId, title, provider, model, externalConversationId] = params;
    const now = new Date().toISOString();
    const conv = {
      id,
      user_id: userId || 1,
      title: title || 'New Conversation',
      provider: provider || 'openrouter',
      model: model || 'openai/gpt-4o',
      external_conversation_id: externalConversationId || null,
      created_at: now,
      updated_at: now,
    };
    memoryStore.conversations.push(conv);
    return { insertId: id, affectedRows: 1 };
  }

  if (upper.includes('FROM CONVERSATIONS') && upper.includes('WHERE ID = ?')) {
    const id = parseInt(params[0], 10);
    const conv = memoryStore.conversations.find((c) => c.id === id);
    return conv ? [{ ...conv }] : [];
  }

  if (upper.includes('FROM CONVERSATIONS') && upper.includes('WHERE C.USER_ID = ?')) {
    const userId = parseInt(params[0], 10);
    return memoryStore.conversations
      .filter((c) => c.user_id === userId)
      .map((c) => {
        const msgs = memoryStore.messages.filter((m) => m.conversation_id === c.id);
        const lastMsg = msgs[msgs.length - 1];
        return {
          ...c,
          message_count: msgs.length,
          last_message_at: lastMsg ? lastMsg.created_at : c.updated_at,
        };
      })
      .sort((a, b) => new Date(b.last_message_at || b.updated_at) - new Date(a.last_message_at || a.updated_at));
  }

  if (upper.startsWith('UPDATE CONVERSATIONS SET')) {
    const id = parseInt(params[params.length - 1], 10);
    const conv = memoryStore.conversations.find((c) => c.id === id);
    if (conv) {
      if (normalized.includes('title = ?')) {
        conv.title = params[0];
      }
      conv.updated_at = new Date().toISOString();
    }
    return { affectedRows: conv ? 1 : 0 };
  }

  if (upper.startsWith('DELETE FROM CONVERSATIONS WHERE ID = ?')) {
    const id = parseInt(params[0], 10);
    const idx = memoryStore.conversations.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryStore.conversations.splice(idx, 1);
      memoryStore.messages = memoryStore.messages.filter((m) => m.conversation_id !== id);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (upper.startsWith('INSERT INTO MESSAGES')) {
    const id = autoIncrement.messages++;
    const [conversationId, role, content, provider, model, usageJson] = params;
    const msg = {
      id,
      conversation_id: parseInt(conversationId, 10),
      role,
      content,
      provider,
      model,
      token_usage: usageJson,
      created_at: new Date().toISOString(),
    };
    memoryStore.messages.push(msg);
    return { insertId: id, affectedRows: 1 };
  }

  if (upper.startsWith('SELECT * FROM MESSAGES WHERE ID = ?')) {
    const id = parseInt(params[0], 10);
    const msg = memoryStore.messages.find((m) => m.id === id);
    return msg ? [{ ...msg }] : [];
  }

  if (upper.includes('FROM MESSAGES') && upper.includes('WHERE CONVERSATION_ID = ?')) {
    const convId = parseInt(params[0], 10);
    let msgs = memoryStore.messages.filter((m) => m.conversation_id === convId);
    if (upper.includes('LIMIT ?')) {
      const limit = parseInt(params[1], 10) || 20;
      msgs = msgs.slice(-limit);
    }
    return msgs.map((m) => ({ ...m }));
  }

  if (upper.startsWith('INSERT INTO USAGE_LOGS')) {
    const id = autoIncrement.usage_logs++;
    const [userId, conversationId, provider, model, inputTokens, outputTokens, totalTokens] = params;
    memoryStore.usage_logs.push({
      id,
      user_id: userId,
      conversation_id: conversationId,
      provider,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      created_at: new Date().toISOString(),
    });
    return { insertId: id, affectedRows: 1 };
  }

  if (upper.includes('FROM USAGE_LOGS') && upper.includes('GROUP BY PROVIDER')) {
    const userId = parseInt(params[0], 10);
    const logs = memoryStore.usage_logs.filter((l) => l.user_id === userId);
    const groups = {};
    for (const log of logs) {
      if (!groups[log.provider]) {
        groups[log.provider] = {
          provider: log.provider,
          total_requests: 0,
          sum_input_tokens: 0,
          sum_output_tokens: 0,
          sum_total_tokens: 0,
        };
      }
      groups[log.provider].total_requests += 1;
      groups[log.provider].sum_input_tokens += log.input_tokens || 0;
      groups[log.provider].sum_output_tokens += log.output_tokens || 0;
      groups[log.provider].sum_total_tokens += log.total_tokens || 0;
    }
    return Object.values(groups);
  }

  if (upper.includes('FROM USERS WHERE ID = ?')) {
    const id = parseInt(params[0], 10);
    const user = memoryStore.users.find((u) => u.id === id);
    return user ? [{ ...user }] : [];
  }

  if (upper.includes('FROM USERS WHERE EMAIL = ?')) {
    const email = params[0];
    const user = memoryStore.users.find((u) => u.email === email);
    return user ? [{ ...user }] : [];
  }

  if (upper.includes('LIKE ?')) {
    const term = (params[1] || '').replace(/%/g, '').toLowerCase();
    return memoryStore.conversations.filter((c) => c.title.toLowerCase().includes(term));
  }

  return [];
}

async function query(sql, params = []) {
  if (useMemoryFallback) {
    return executeMemoryQuery(sql, params);
  }
  try {
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return rows;
  } catch (err) {
    console.warn(`[Database] MySQL query failed (${err.message}). Using memory fallback.`);
    return executeMemoryQuery(sql, params);
  }
}

async function initializeDatabase() {
  try {
    // First verify or create DB connection with root
    const tempConnection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      connectTimeout: 5000,
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConnection.end();

    const p = getPool();
    const connection = await p.getConnection();
    console.log(`[Database] Successfully connected to MySQL at ${config.db.host}:${config.db.port}/${config.db.name}`);
    useMemoryFallback = false;

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create conversations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
        provider VARCHAR(50) NOT NULL DEFAULT 'openrouter',
        model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-4o',
        external_conversation_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create messages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        content MEDIUMTEXT NOT NULL,
        provider VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        token_usage JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conv_id (conversation_id),
        INDEX idx_role (role),
        CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create provider_configs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS provider_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_name VARCHAR(50) NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_provider_model (provider_name, model_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create usage_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        conversation_id INT NULL,
        provider VARCHAR(50) NOT NULL,
        model VARCHAR(100) NOT NULL,
        input_tokens INT DEFAULT 0,
        output_tokens INT DEFAULT 0,
        total_tokens INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usage_user (user_id),
        INDEX idx_usage_provider (provider),
        CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_usage_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create documents table for RAG
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL DEFAULT 1,
        conversation_id INT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'processed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_doc_user (user_id),
        INDEX idx_doc_conv (conversation_id),
        CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_doc_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create document_chunks table for RAG metadata
    await connection.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        chunk_index INT NOT NULL,
        content MEDIUMTEXT NOT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chunk_doc (document_id),
        CONSTRAINT fk_chunk_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure default demo user exists
    const [users] = await connection.query('SELECT id FROM users WHERE id = 1 LIMIT 1');
    if (users.length === 0) {
      await connection.query(`
        INSERT INTO users (id, name, email, password_hash)
        VALUES (1, 'Demo User', 'demo@example.com', '$2a$10$e7ZfHovb5UeG4gHw8fH72eWjA0M1b5K2L9x1n/2kP5bWjA0M1b5K2')
      `);
      console.log('[Database] Seeded initial demo user (id: 1, email: demo@example.com)');
    }

    if (connection) {
      connection.release();
    }
    return true;
  } catch (error) {
    console.warn('[Database] MySQL unavailable, running in resilient in-memory mode:', error.message);
    useMemoryFallback = true;
    return true;
  }
}

module.exports = {
  getPool,
  query,
  initializeDatabase,
};

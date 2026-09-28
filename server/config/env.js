const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file (check server/.env then root .env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3309', 10),
  name: process.env.DB_NAME || 'ai_chatbot',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password123',
  connectionLimit: 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

// Support cloud database URL (e.g. Aiven, Railway, TiDB, Render managed databases)
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    dbConfig.host = parsed.hostname;
    if (parsed.port) dbConfig.port = parseInt(parsed.port, 10);
    if (parsed.username) dbConfig.user = decodeURIComponent(parsed.username);
    if (parsed.password) dbConfig.password = decodeURIComponent(parsed.password);
    if (parsed.pathname) dbConfig.name = parsed.pathname.replace(/^\//, '');
    if (
      parsed.searchParams.get('ssl') ||
      parsed.searchParams.get('ssl-mode') ||
      parsed.searchParams.get('sslmode') ||
      process.env.NODE_ENV === 'production'
    ) {
      dbConfig.ssl = { rejectUnauthorized: false };
    }
  } catch (err) {
    console.warn('[Env] Failed to parse DATABASE_URL, falling back to DB_* variables:', err.message);
  }
}

// Auto-enable SSL for cloud databases in production if not localhost
if (
  process.env.NODE_ENV === 'production' &&
  !dbConfig.ssl &&
  dbConfig.host !== '127.0.0.1' &&
  dbConfig.host !== 'localhost'
) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5002', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: dbConfig,


  providers: {
    huggingface: {
      apiKey: process.env.HF_TOKEN || process.env.HF_API_KEY || '',
      defaultModel: process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct:fastest',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultModel: process.env.OPENROUTER_MODEL || 'liquid/lfm-2.5-2.6b:free',
    },
    botpress: {
      botId: process.env.BOTPRESS_BOT_ID || '',
      apiKey: process.env.BOTPRESS_API_KEY || '',
      workspaceId: process.env.BOTPRESS_WORKSPACE_ID || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      defaultModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    },
  },

  langsmith: {
    apiKey: process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY || '',
    endpoint: process.env.LANGSMITH_ENDPOINT || process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
    project: process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'OmniChat AI',
    tracing: (process.env.LANGSMITH_TRACING === 'true' || process.env.LANGCHAIN_TRACING_V2 === 'true'),
  },
};

// Ensure standard LangChain/LangSmith environment variables are synchronously available to SDKs
if (config.langsmith.apiKey) {
  process.env.LANGCHAIN_TRACING_V2 = config.langsmith.tracing ? 'true' : 'false';
  process.env.LANGSMITH_TRACING = config.langsmith.tracing ? 'true' : 'false';
  process.env.LANGCHAIN_API_KEY = config.langsmith.apiKey;
  process.env.LANGSMITH_API_KEY = config.langsmith.apiKey;
  process.env.LANGCHAIN_PROJECT = config.langsmith.project;
  process.env.LANGSMITH_PROJECT = config.langsmith.project;
  process.env.LANGCHAIN_ENDPOINT = config.langsmith.endpoint;
  process.env.LANGSMITH_ENDPOINT = config.langsmith.endpoint;
}


module.exports = config;

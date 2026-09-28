const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file (check server/.env then root .env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5002', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3309', 10),
    name: process.env.DB_NAME || 'ai_chatbot',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password123',
    connectionLimit: 10,
  },

  providers: {
    huggingface: {
      apiKey: process.env.HF_TOKEN || process.env.HF_API_KEY || '',
      defaultModel: process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct:fastest',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultModel: process.env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-mini:free',
    },
    botpress: {
      botId: process.env.BOTPRESS_BOT_ID || '',
      apiKey: process.env.BOTPRESS_API_KEY || '',
      workspaceId: process.env.BOTPRESS_WORKSPACE_ID || '',
    },
  },
};

module.exports = config;

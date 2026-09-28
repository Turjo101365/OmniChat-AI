const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const db = require('./config/database');

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const providerRoutes = require('./routes/providerRoutes');
const langchainRoutes = require('./routes/langchainRoutes');
const langsmithRoutes = require('./routes/langsmithRoutes');
const langgraphRoutes = require('./routes/langgraphRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Specific Chat Rate Limiter
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    error: 'Too many chat requests sent in a short period. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/chat', chatLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.status(200).json({
    status: 'ok',
    environment: config.env,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    providers: {
      openrouter: Boolean(config.providers.openrouter.apiKey),
      huggingface: Boolean(config.providers.huggingface.apiKey),
      botpress: Boolean(config.providers.botpress.botId && config.providers.botpress.apiKey),
      langchain: true,
      langgraph: true,
      langsmith: Boolean(config.langsmith.apiKey),
    },
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/langchain', langchainRoutes);
app.use('/api/langsmith', langsmithRoutes);
app.use('/api/langgraph', langgraphRoutes);

// Serve static frontend assets if dist folder exists (Render / Production single-service deployment)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Client-side SPA routing fallback (for react-router-dom)
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Route Handler for unmatched API endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});


// Centralized error handling
app.use(errorHandler);

module.exports = app;

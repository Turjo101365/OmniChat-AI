const app = require('./app');
const config = require('./config/env');
const db = require('./config/database');

const PORT = config.port || 5002;

async function startServer() {
  try {
    console.log('[Server] Connecting to database and verifying schema...');
    try {
      const dbReady = await db.initializeDatabase();
      if (dbReady) {
        console.log('[Server] Database initialized successfully.');
      }
    } catch (dbErr) {
      console.warn('[Server Warning] Database initialization deferred:', dbErr.message);
    }


    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Multi-Provider AI Chatbot Backend running!`);
      console.log(`👉 API Base URL: http://localhost:${PORT}/api`);
      console.log(`👉 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`👉 Connected to MySQL: ${config.db.host}:${config.db.port}/${config.db.name}\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(async () => {
        const pool = db.getPool();
        if (pool) {
          await pool.end();
        }
        console.log('[Server] MySQL pool closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
}

startServer();

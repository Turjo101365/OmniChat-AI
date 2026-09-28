const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ai-chatbot-secure-secret-key-change-in-prod';

/**
 * Authentication middleware that extracts user context.
 * In development or single-user mode, defaults to user ID 1 (Demo User)
 * while also supporting Bearer JWT tokens when provided.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // If invalid token provided, return 401
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authorization token.',
      });
    }
  }

  // Fallback to demo default user
  req.user = {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
  };
  next();
}

module.exports = authMiddleware;

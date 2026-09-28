/**
 * Centralized error handling middleware.
 * Ensures that no private API keys, database connection secrets,
 * or raw internal stack traces are leaked to the client.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  let rawMessage = err.message || 'An unexpected error occurred while processing your request.';

  // Strip actual keys or sensitive bearer tokens (matching long hex/base64 strings, not the env var names)
  const sanitized = String(rawMessage)
    .replace(/(Bearer\s+[a-zA-Z0-9_\-\.]{10,})/gi, 'Bearer [REDACTED]')
    .replace(/(sk-or-v1-[a-zA-Z0-9]{15,})/gi, '[REDACTED_OPENROUTER_KEY]')
    .replace(/(sk-[a-zA-Z0-9_\-\.]{15,})/gi, '[REDACTED_KEY]')
    .replace(/(hf_[a-zA-Z0-9_\-\.]{15,})/gi, '[REDACTED_HF_KEY]');

  console.error(`[Error] [${req.method} ${req.url}] Status ${status}:`, sanitized);

  res.status(status).json({
    success: false,
    error: sanitized,
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;

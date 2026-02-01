const rateLimit = require('express-rate-limit');

/**
 * Rate limiter: 60 requests per minute per IP.
 * In-memory store is fine for single-instance deployment.
 */
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Max 60 requests per minute.' }
});

module.exports = limiter;

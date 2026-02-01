/**
 * Bearer token authentication middleware.
 * Validates Authorization header against the API_KEY environment variable.
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid Authorization format. Expected: Bearer <token>' });
  }

  const token = parts[1];
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error('API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Constant-time comparison to prevent timing attacks
  if (token.length !== apiKey.length || !timingSafeEqual(token, apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

/**
 * Constant-time string comparison.
 * Prevents timing attacks on API key validation.
 */
function timingSafeEqual(a, b) {
  const crypto = require('crypto');
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = auth;

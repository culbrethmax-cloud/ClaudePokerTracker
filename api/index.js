const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const auth = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');
const statsRoutes = require('./routes/stats');
const { clearCache } = require('./utils/firestore');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS — allow local network access (Docker containers, etc.)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

// Parse JSON (not strictly needed for read-only GET API, but good practice)
app.use(express.json());

// Rate limiting (before auth to prevent brute-force)
app.use('/api', rateLimit);

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Auth required for all other /api routes
app.use('/api', auth);

// Mount routes
app.use('/api', statsRoutes);

// POST /api/cache/clear — force cache refresh
app.post('/api/cache/clear', (req, res) => {
  clearCache();
  res.json({ message: 'Cache cleared' });
});

// 404 for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/sessions',
      'POST /api/sessions',
      'PUT /api/sessions/:id',
      'DELETE /api/sessions/:id',
      'GET /api/stats/summary',
      'GET /api/stats/by-duration',
      'GET /api/stats/by-game-type',
      'GET /api/stats/by-day',
      'GET /api/stats/trends',
      'POST /api/cache/clear'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MaxVariance API listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

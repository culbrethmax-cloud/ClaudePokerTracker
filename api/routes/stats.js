const express = require('express');
const router = express.Router();
const { getAllSessions, filterSessions, getCacheAge } = require('../utils/firestore');
const {
  calculateSummaryStats,
  calculateDurationBuckets,
  calculateByDayOfWeek,
  calculateByGameType,
  calculateTrends,
  sanitizeSession,
  sanitizeSessionWithNotes
} = require('../utils/calculations');

/**
 * Parse common filter query params from the request.
 */
function parseFilters(query) {
  return {
    from: query.from || null,
    to: query.to || null,
    type: query.type || null,
    stakes: query.stakes || null,
    gameType: query.gameType || null
  };
}

/**
 * Build meta object included in every response.
 */
function buildMeta(allSessions, filteredSessions, filters) {
  const cacheAge = getCacheAge();
  return {
    totalSessions: allSessions.length,
    filteredSessions: filteredSessions.length,
    filters: Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== null)
    ),
    cacheAgeSeconds: cacheAge !== null ? Math.round(cacheAge / 1000) : null
  };
}

// --- GET /api/sessions ---
// Raw session data with filters and pagination. Notes stripped.
router.get('/sessions', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const allSessions = await getAllSessions();
    const filtered = filterSessions(allSessions, filters);

    // Sort by date descending (most recent first)
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    const page = sorted.slice(offset, offset + limit);

    res.json({
      data: page.map(sanitizeSessionWithNotes),
      pagination: {
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < filtered.length
      },
      meta: buildMeta(allSessions, filtered, filters)
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/stats/summary ---
// Aggregate stats over a date range.
router.get('/stats/summary', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const allSessions = await getAllSessions();
    const filtered = filterSessions(allSessions, filters);

    res.json({
      data: calculateSummaryStats(filtered),
      meta: buildMeta(allSessions, filtered, filters)
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/stats/by-duration ---
// Sessions bucketed by duration ranges.
// Query: ?buckets=0,30,60,120,180,240 (comma-separated minute boundaries)
router.get('/stats/by-duration', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const allSessions = await getAllSessions();
    const filtered = filterSessions(allSessions, filters);

    let boundaries = [0, 30, 60, 120, 180, 240];
    if (req.query.buckets) {
      const parsed = req.query.buckets
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 0);
      if (parsed.length >= 2) {
        boundaries = parsed;
      }
    }

    res.json({
      data: {
        buckets: calculateDurationBuckets(filtered, boundaries)
      },
      meta: buildMeta(allSessions, filtered, filters)
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/stats/by-game-type ---
// Results broken down by game type and stakes.
router.get('/stats/by-game-type', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const allSessions = await getAllSessions();
    const filtered = filterSessions(allSessions, filters);

    res.json({
      data: {
        groups: calculateByGameType(filtered)
      },
      meta: buildMeta(allSessions, filtered, filters)
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/stats/by-day ---
// Results by day of week with average session duration.
router.get('/stats/by-day', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const allSessions = await getAllSessions();
    const filtered = filterSessions(allSessions, filters);

    res.json({
      data: {
        days: calculateByDayOfWeek(filtered)
      },
      meta: buildMeta(allSessions, filtered, filters)
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/stats/trends ---
// Rolling averages over time.
// Query: ?window=20 (number of sessions in rolling window)
router.get('/stats/trends', async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const windowSize = Math.min(Math.max(parseInt(req.query.window) || 20, 1), 200);

    const allSessions = await getAllSessions();
    const filtered = filterSessions(allSessions, filters);

    res.json({
      data: {
        windowSize,
        dataPoints: calculateTrends(filtered, windowSize)
      },
      meta: buildMeta(allSessions, filtered, filters)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

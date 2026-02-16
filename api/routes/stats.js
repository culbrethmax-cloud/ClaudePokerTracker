const express = require('express');
const router = express.Router();
const { getAllSessions, filterSessions, getCacheAge, addSession, updateSession, deleteSession } = require('../utils/firestore');
const {
  calculateSummaryStats,
  calculateDurationBuckets,
  calculateByDayOfWeek,
  calculateByGameType,
  calculateTrends,
  sanitizeSession,
  sanitizeSessionWithNotes,
  getbbValueFromStakes
} = require('../utils/calculations');

/**
 * Validate session data for create/update.
 * Returns { valid: true } or { valid: false, error: "message" }.
 */
function validateSession(data) {
  if (!data.type || !['cash', 'tournament'].includes(data.type)) {
    return { valid: false, error: 'type must be "cash" or "tournament"' };
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return { valid: false, error: 'date must be a string in YYYY-MM-DD format' };
  }

  if (data.type === 'cash') {
    if (typeof data.stakes !== 'string' || data.stakes.length === 0) {
      return { valid: false, error: 'stakes is required for cash sessions' };
    }
    if (typeof data.profitBB !== 'number') {
      return { valid: false, error: 'profitBB must be a number for cash sessions' };
    }
  }

  if (data.type === 'tournament') {
    if (typeof data.buyIn !== 'number') {
      return { valid: false, error: 'buyIn must be a number for tournament sessions' };
    }
    if (typeof data.cashOut !== 'number') {
      return { valid: false, error: 'cashOut must be a number for tournament sessions' };
    }
  }

  // Optional field validation
  if (data.duration !== undefined && (typeof data.duration !== 'number' || data.duration < 0)) {
    return { valid: false, error: 'duration must be a non-negative number' };
  }
  if (data.hands !== undefined && (typeof data.hands !== 'number' || data.hands < 0 || !Number.isInteger(data.hands))) {
    return { valid: false, error: 'hands must be a non-negative integer' };
  }
  if (data.gameType !== undefined && typeof data.gameType !== 'string') {
    return { valid: false, error: 'gameType must be a string' };
  }
  if (data.location !== undefined && typeof data.location !== 'string') {
    return { valid: false, error: 'location must be a string' };
  }
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    return { valid: false, error: 'notes must be a string' };
  }
  if (data.startTime !== undefined && typeof data.startTime !== 'string') {
    return { valid: false, error: 'startTime must be a string' };
  }

  return { valid: true };
}

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

// --- POST /api/sessions ---
// Create a new session.
router.post('/sessions', async (req, res, next) => {
  try {
    const data = req.body;
    const validation = validateSession(data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const session = {
      type: data.type,
      date: data.date,
      duration: data.duration || 0,
      createdAt: new Date().toISOString()
    };

    if (data.gameType) session.gameType = data.gameType;
    if (data.location) session.location = data.location;
    if (data.notes) session.notes = data.notes;
    if (data.startTime) session.startTime = data.startTime;

    if (data.type === 'cash') {
      session.stakes = data.stakes;
      session.profitBB = data.profitBB;
      session.profitDollars = data.profitBB * getbbValueFromStakes(data.stakes);
      if (data.hands !== undefined) session.hands = data.hands;
    } else {
      session.buyIn = data.buyIn;
      session.cashOut = data.cashOut;
    }

    const id = await addSession(session);
    res.status(201).json({ id, session });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/sessions/:id ---
// Update an existing session.
router.put('/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const validation = validateSession(data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const session = {
      type: data.type,
      date: data.date,
      duration: data.duration || 0,
      updatedAt: new Date().toISOString()
    };

    if (data.gameType) session.gameType = data.gameType;
    if (data.location) session.location = data.location;
    if (data.notes) session.notes = data.notes;
    if (data.startTime) session.startTime = data.startTime;

    if (data.type === 'cash') {
      session.stakes = data.stakes;
      session.profitBB = data.profitBB;
      session.profitDollars = data.profitBB * getbbValueFromStakes(data.stakes);
      if (data.hands !== undefined) session.hands = data.hands;
    } else {
      session.buyIn = data.buyIn;
      session.cashOut = data.cashOut;
    }

    await updateSession(id, session);
    res.json({ id, session });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: 'Session not found' });
    }
    next(err);
  }
});

// --- DELETE /api/sessions/:id ---
// Delete a session.
router.delete('/sessions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteSession(id);
    res.json({ deleted: true, id });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: 'Session not found' });
    }
    next(err);
  }
});

module.exports = router;

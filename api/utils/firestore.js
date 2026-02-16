const admin = require('firebase-admin');
const path = require('path');
const Cache = require('./cache');

const cache = new Cache(5 * 60 * 1000); // 5-minute TTL

let initialized = false;

function initialize() {
  if (initialized) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is required');
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  const serviceAccount = require(resolvedPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  initialized = true;
}

function getDb() {
  initialize();
  return admin.firestore();
}

/**
 * Convert a Firestore Timestamp or Date to a "YYYY-MM-DD" string
 * using local time (matches what the user sees in the frontend).
 * Returns strings as-is.
 */
function normalizeDate(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.toDate === 'function') {
    // Firestore Timestamp
    value = value.toDate();
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value);
}

/**
 * Normalize a session document so all fields are plain JSON-safe values.
 * Converts Firestore Timestamps to strings.
 */
function normalizeSession(session) {
  const normalized = { ...session };
  if (normalized.date != null) {
    normalized.date = normalizeDate(normalized.date);
  }
  if (normalized.createdAt && typeof normalized.createdAt.toDate === 'function') {
    normalized.createdAt = normalized.createdAt.toDate().toISOString();
  }
  if (normalized.updatedAt && typeof normalized.updatedAt.toDate === 'function') {
    normalized.updatedAt = normalized.updatedAt.toDate().toISOString();
  }
  return normalized;
}

/**
 * Fetch all sessions for the configured user.
 * Returns cached data if available and fresh.
 */
async function getAllSessions() {
  const cached = cache.get();
  if (cached) return cached;

  const userId = process.env.FIREBASE_USER_ID;
  if (!userId) {
    throw new Error('FIREBASE_USER_ID environment variable is required');
  }

  const db = getDb();
  const sessionsRef = db.collection('users').doc(userId).collection('sessions');
  const snapshot = await sessionsRef.orderBy('date', 'desc').get();

  const sessions = snapshot.docs.map(doc => normalizeSession({
    id: doc.id,
    ...doc.data()
  }));

  cache.set(sessions);
  return sessions;
}

/**
 * Apply common filters to a sessions array.
 */
function filterSessions(sessions, filters) {
  let result = sessions;

  if (filters.from) {
    result = result.filter(s => s.date >= filters.from);
  }
  if (filters.to) {
    result = result.filter(s => s.date <= filters.to);
  }
  if (filters.type) {
    result = result.filter(s => s.type === filters.type);
  }
  if (filters.stakes) {
    result = result.filter(s => s.stakes === filters.stakes);
  }
  if (filters.gameType) {
    result = result.filter(s => s.gameType === filters.gameType);
  }

  return result;
}

/**
 * Add a new session document to Firestore.
 * Returns the new document ID.
 */
async function addSession(sessionData) {
  const userId = process.env.FIREBASE_USER_ID;
  if (!userId) {
    throw new Error('FIREBASE_USER_ID environment variable is required');
  }

  const db = getDb();
  const sessionsRef = db.collection('users').doc(userId).collection('sessions');
  const docRef = await sessionsRef.add(sessionData);
  cache.clear();
  return docRef.id;
}

/**
 * Update an existing session document in Firestore.
 * Throws if the document does not exist.
 */
async function updateSession(sessionId, sessionData) {
  const userId = process.env.FIREBASE_USER_ID;
  if (!userId) {
    throw new Error('FIREBASE_USER_ID environment variable is required');
  }

  const db = getDb();
  const docRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
  const doc = await docRef.get();
  if (!doc.exists) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  await docRef.update(sessionData);
  cache.clear();
}

/**
 * Delete a session document from Firestore.
 * Throws if the document does not exist.
 */
async function deleteSession(sessionId) {
  const userId = process.env.FIREBASE_USER_ID;
  if (!userId) {
    throw new Error('FIREBASE_USER_ID environment variable is required');
  }

  const db = getDb();
  const docRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
  const doc = await docRef.get();
  if (!doc.exists) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  await docRef.delete();
  cache.clear();
}

function clearCache() {
  cache.clear();
}

function getCacheAge() {
  return cache.age();
}

module.exports = {
  getAllSessions,
  filterSessions,
  clearCache,
  getCacheAge,
  addSession,
  updateSession,
  deleteSession
};

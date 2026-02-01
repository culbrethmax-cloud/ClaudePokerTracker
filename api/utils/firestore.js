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

  const sessions = snapshot.docs.map(doc => ({
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
  getCacheAge
};

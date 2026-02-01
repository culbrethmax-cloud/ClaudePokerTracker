/**
 * Simple in-memory cache with TTL.
 * Caches all sessions from Firestore so multiple endpoints
 * can compute stats from a single read.
 */
class Cache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.data = null;
    this.timestamp = 0;
  }

  get() {
    if (!this.data) return null;
    if (Date.now() - this.timestamp > this.ttlMs) {
      this.data = null;
      return null;
    }
    return this.data;
  }

  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  }

  clear() {
    this.data = null;
    this.timestamp = 0;
  }

  age() {
    if (!this.data) return null;
    return Date.now() - this.timestamp;
  }
}

module.exports = Cache;

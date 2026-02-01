/**
 * Firestore data backup script.
 * Exports all sessions to a timestamped JSON file.
 *
 * Usage:
 *   cd api && npm run backup
 *
 * Requires .env to be configured with FIREBASE_SERVICE_ACCOUNT_PATH
 * and FIREBASE_USER_ID.
 */

const fs = require('fs');
const path = require('path');

// Load env vars from api/.env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const admin = require('firebase-admin');

async function backup() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const userId = process.env.FIREBASE_USER_ID;

  if (!serviceAccountPath || !userId) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_USER_ID must be set.');
    console.error('Copy api/.env.example to api/.env and configure it.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  const serviceAccount = require(resolvedPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  console.log(`Fetching sessions for user: ${userId}`);

  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('sessions')
    .get();

  const sessions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(`Found ${sessions.length} sessions`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `sessions-backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(sessions, null, 2));
  console.log(`Backup saved to: ${filepath}`);
  console.log(`Sessions backed up: ${sessions.length}`);

  process.exit(0);
}

backup().catch(err => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Initialize Firebase Admin SDK.
 *
 * Supports two modes:
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON env var — a JSON string of the service account key
 *      (ideal for cloud platforms like Render where you can't ship files)
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH env var — a file path to the JSON key
 *      (ideal for local development)
 */
function loadServiceAccount(): admin.ServiceAccount {
  // Mode 1: JSON string from environment variable (production / cloud)
  const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonString) {
    try {
      return JSON.parse(jsonString) as admin.ServiceAccount;
    } catch (parseError) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env var:', parseError);
      process.exit(1);
    }
  }

  // Mode 2: File path (local development)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || './firebase-service-account.json';
  const resolvedPath = path.resolve(serviceAccountPath);

  if (!existsSync(resolvedPath)) {
    console.error(
      '❌ Firebase service account not found.\n' +
      '   Set FIREBASE_SERVICE_ACCOUNT_JSON env var (for cloud deployment), or\n' +
      '   download the key from Firebase Console > Project Settings > Service Accounts\n' +
      `   and place it at: ${resolvedPath}`
    );
    process.exit(1);
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf-8')) as admin.ServiceAccount;
}

try {
  const serviceAccount = loadServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error);
  process.exit(1);
}

export default admin;

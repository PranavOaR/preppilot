/**
 * Firebase Admin SDK — server-only (Node.js runtime API routes).
 * Never import this from client components or Edge runtime (proxy.ts).
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON env var:
 *   set to the full JSON string of a Firebase service account key.
 *   Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const ADMIN_APP_NAME = "admin";

function getAdminApp(): App | null {
  const existing = getApps().find((a) => a.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn(
      "[firebase/server] FIREBASE_SERVICE_ACCOUNT_JSON is not set — " +
        "server-side privileged writes (plan activation, admin mutations) will be unavailable."
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(serviceAccount) }, ADMIN_APP_NAME);
  } catch (err) {
    console.error("[firebase/server] Failed to parse service account JSON:", err);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

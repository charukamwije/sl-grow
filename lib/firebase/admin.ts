// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Firebase Service Account (for server-side), or null in guest mode
function loadServiceAccount(): ServiceAccount | null {
  const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

  if (!serviceAccount) {
    return null;
  }

  try {
    return JSON.parse(serviceAccount);
  } catch {
    // The usual cause is the line breaks of a pasted private_key.
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT is not valid JSON. The whole service account JSON has to be on a single line."
    );
  }
}

/**
 * Without credentials the app runs in guest mode (FR-A-10). Nobody can sign
 * in then, so no session cookie exists and `getServerSession` answers before
 * touching these. Anything that does reach them gets this error instead of
 * the whole app failing at import.
 */
function notConfigured<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get() {
      throw new Error(
        `${name} is unavailable: FIREBASE_ADMIN_SERVICE_ACCOUNT is not set. Copy .env.local.example to .env.local and fill it with your Firebase service account JSON.`
      );
    },
  });
}

const serviceAccount = loadServiceAccount();

// Initialize Admin SDK, reusing the app that survives a hot reload
const adminApp = serviceAccount
  ? getApps().length > 0
    ? getApp()
    : initializeApp({ credential: cert(serviceAccount) })
  : null;

export const adminAuth: Auth = adminApp
  ? getAuth(adminApp)
  : notConfigured<Auth>("Firebase Auth");
export const adminDb: Firestore = adminApp
  ? getFirestore(adminApp)
  : notConfigured<Firestore>("Firestore");

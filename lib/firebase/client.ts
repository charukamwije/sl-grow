"use client";

import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase client configuration, or null in guest mode (FR-A-10)
function loadClientConfig(): FirebaseOptions | null {
  const clientConfig = process.env.NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG;

  if (!clientConfig) {
    return null;
  }

  try {
    return JSON.parse(clientConfig);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_WEB_SDK_CONFIG is not valid JSON. The whole config object has to be on a single line."
    );
  }
}

const config = loadClientConfig();

// Initialize Firebase app (prevent duplicate initialization)
const app = config ? (getApps().length ? getApp() : initializeApp(config)) : null;

// Null in guest mode, where the UI offers no sign-in to reach it
const auth: Auth | null = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };

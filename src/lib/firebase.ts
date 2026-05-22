'use client';

// ── Firebase Configuration & Initialization ──
// Firestore + Authentication only (no Analytics, no Storage, no Messaging)
// Configuration is loaded from environment variables (.env.local)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Validate Firebase configuration
const isMissingConfig = Object.values(firebaseConfig).some(value => value === '');
if (isMissingConfig && typeof window !== 'undefined') {
  console.warn('[Firebase] Missing Firebase configuration. Please set environment variables.');
}

// Initialize Firebase only on client (prevent re-initialization in dev hot reload)
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Enable offline persistence for Firestore (so data is available when offline)
  if (db) {
    enableIndexedDbPersistence(db).catch((err: any) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('[Firebase] Firestore persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support persistence
        console.warn('[Firebase] Firestore persistence not supported by browser');
      }
    });
  }
}

export { app, auth, db };
export default app;

// ── Firebase Configuration & Initialization ──
// Firestore + Authentication only (no Analytics, no Storage, no Messaging)
// Configuration is loaded from environment variables (.env.local)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent re-initialization in dev hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth instance
export const auth = getAuth(app);

// Firestore instance
export const db = getFirestore(app);

// Enable offline persistence for Firestore (so data is available when offline)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('[Firebase] Firestore persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('[Firebase] Firestore persistence not supported by browser');
    }
  });
}

export default app;

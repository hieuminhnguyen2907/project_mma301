import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const { getAuth, initializeAuth, getReactNativePersistence } = FirebaseAuth;

// Firebase Client Configuration
// Reads from EXPO_PUBLIC_* environment variables set in .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let isLiveFirebase = false;

// Verify that the environment has real Firebase credentials
const hasLiveCredentials = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('AIzaSyDemoFallbackKey') &&
  !firebaseConfig.apiKey.includes('AIzaSyAxxxxxxxx')
);

if (hasLiveCredentials) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

    // Initialize Auth with AsyncStorage persistence for React Native
    try {
      if (typeof getReactNativePersistence === 'function' && ReactNativeAsyncStorage) {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage),
        });
      } else {
        auth = getAuth(app);
      }
    } catch (_authInitErr) {
      // If already initialized (e.g. during Fast Refresh / HMR), retrieve existing auth instance
      auth = getAuth(app);
    }

    db = getFirestore(app);
    try {
      if (firebaseConfig.storageBucket) {
        storage = getStorage(app);
      }
    } catch (_storageErr) {
      storage = null;
    }
    isLiveFirebase = true;
    console.log('🔥 [Firebase] Connected to Project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('⚠️ [Firebase] Init error, falling back to local memory store:', error.message);
    isLiveFirebase = false;
  }
} else {
  isLiveFirebase = false;
}

export { app, auth, db, storage, isLiveFirebase, firebaseConfig };

// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missingKeys.length && process.env.NODE_ENV !== 'test') {
  throw new Error(
    `Missing Firebase configuration: ${missingKeys.join(', ')}. Copy .env.example to .env.local and fill in your Firebase values.`
  );
}

// Firebase still needs syntactically valid options while unit tests mock/avoid the backend.
if (process.env.NODE_ENV === 'test') {
  firebaseConfig.apiKey ||= 'test-api-key';
  firebaseConfig.authDomain ||= 'test.firebaseapp.com';
  firebaseConfig.projectId ||= 'test-project';
  firebaseConfig.appId ||= '1:123:web:test';
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

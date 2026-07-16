// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
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

const appCheckSiteKey = process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY;
const aiProvider = process.env.REACT_APP_AI_PROVIDER || 'firebase';
export let appCheck = null;

if (
  process.env.NODE_ENV === 'production'
  && aiProvider === 'firebase'
  && !appCheckSiteKey
) {
  throw new Error(
    'Missing production App Check configuration: set REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY before building.'
  );
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test' && appCheckSiteKey) {
  // Debug tokens are for local development only and must be registered in Firebase Console.
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG === 'true'
  ) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const db = getFirestore(app);
export default app;

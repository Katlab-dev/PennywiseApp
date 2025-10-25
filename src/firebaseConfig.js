// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// (We'll add firestore/auth imports later when needed)

const firebaseConfig = {
  apiKey: "AIzaSyBoBCgJpwDCPuIzLiEL6QjSU56nHkfy1vQ",
  authDomain: "pennywise-c8f6e.firebaseapp.com",
  projectId: "pennywise-c8f6e",
  storageBucket: "pennywise-c8f6e.firebasestorage.app",
  messagingSenderId: "863062402705",
  appId: "1:863062402705:web:78a8a8c63acf67e6a90130",
  measurementId: "G-RTZ1KRMP30"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Export app so it can be used in other files (auth, firestore, etc)
export default app;

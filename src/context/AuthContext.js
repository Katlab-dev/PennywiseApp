import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import app from '../firebaseConfig';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = useMemo(() => getAuth(app), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const register = useCallback(async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }, [auth]);

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }, [auth]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, [auth]);

  const resetPassword = useCallback(async (email) => {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (err) {
      // Fallback without continue URL if domain is not authorized yet
      if (err?.code === 'auth/invalid-continue-uri' || err?.code === 'auth/unauthorized-continue-uri') {
        await sendPasswordResetEmail(auth, email);
      } else {
        throw err;
      }
    }
  }, [auth]);

  const value = useMemo(() => ({ currentUser, loading, register, login, logout, resetPassword }), [currentUser, loading, register, login, logout, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

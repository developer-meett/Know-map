import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  // Google Sign-In
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    // Optional: prompt account selection each time
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  };

  // Phone auth (OTP)
  const ensureRecaptcha = (containerId = 'recaptcha-container', size = 'invisible') => {
    // Always (re)create a verifier for the requested container to avoid stale instances across pages
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size });
    return window.recaptchaVerifier;
  };

  const sendPhoneOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
    const verifier = ensureRecaptcha(containerId, 'invisible');
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  };

  const verifyPhoneOtp = async (code) => {
    if (!window.confirmationResult) throw new Error('No OTP session found. Please request a new code.');
    return window.confirmationResult.confirm(code);
  };

  const value = { user, initializing, login, signup, logout, googleSignIn, sendPhoneOtp, verifyPhoneOtp };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

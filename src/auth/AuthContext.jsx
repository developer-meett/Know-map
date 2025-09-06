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
    try {
      const provider = new GoogleAuthProvider();
      // Optional: prompt account selection each time
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Phone auth (OTP)
  const ensureRecaptcha = (containerId = 'recaptcha-container', size = 'invisible') => {
    try {
      // Clear any existing verifier
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore clearing errors
        }
      }
      
      // Ensure the container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`reCAPTCHA container '${containerId}' not found`);
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { 
        size,
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // reCAPTCHA expired
        }
      });
      return window.recaptchaVerifier;
    } catch (error) {
      throw error;
    }
  };

  const sendPhoneOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
    try {
      const verifier = ensureRecaptcha(containerId, 'invisible');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      window.confirmationResult = confirmationResult;
      return confirmationResult;
    } catch (error) {
      throw error;
    }
  };

  const verifyPhoneOtp = async (code) => {
    try {
      if (!window.confirmationResult) {
        throw new Error('No OTP session found. Please request a new code.');
      }
      const result = await window.confirmationResult.confirm(code);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const value = { user, initializing, login, signup, logout, googleSignIn, sendPhoneOtp, verifyPhoneOtp };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // Use refs instead of global variables to prevent memory leaks
  const recaptchaVerifierRef = useRef(null);
  const confirmationResultRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    
    // Cleanup function
    return () => {
      unsub();
      // Clean up reCAPTCHA verifier on unmount
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          logger.warn('Error clearing reCAPTCHA verifier:', e);
        }
        recaptchaVerifierRef.current = null;
      }
    };
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
      logger.error('Google sign-in failed:', error);
      throw error;
    }
  };

  // Phone auth (OTP)
  const ensureRecaptcha = (containerId = 'recaptcha-container', size = 'invisible') => {
    try {
      // Clear any existing verifier
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          logger.warn('Error clearing existing reCAPTCHA verifier:', e);
        }
      }
      
      // Ensure the container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`reCAPTCHA container '${containerId}' not found`);
      }
      
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, { 
        size,
        callback: () => {
          logger.debug('reCAPTCHA solved');
        },
        'expired-callback': () => {
          logger.warn('reCAPTCHA expired');
        }
      });
      return recaptchaVerifierRef.current;
    } catch (error) {
      logger.error('Error setting up reCAPTCHA:', error);
      throw error;
    }
  };

  const sendPhoneOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
    try {
      const verifier = ensureRecaptcha(containerId, 'invisible');
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      confirmationResultRef.current = confirmationResult;
      return confirmationResult;
    } catch (error) {
      logger.error('Error sending phone OTP:', error);
      throw error;
    }
  };

  const verifyPhoneOtp = async (code) => {
    try {
      if (!confirmationResultRef.current) {
        throw new Error('No OTP session found. Please request a new code.');
      }
      const result = await confirmationResultRef.current.confirm(code);
      // Clear the confirmation result after successful verification
      confirmationResultRef.current = null;
      return result;
    } catch (error) {
      logger.error('Error verifying phone OTP:', error);
      throw error;
    }
  };

  const value = { user, initializing, login, signup, logout, googleSignIn, sendPhoneOtp, verifyPhoneOtp };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

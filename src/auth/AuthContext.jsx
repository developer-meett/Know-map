import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/config';
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  
  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document in Firestore
      await createUserDocument(result.user);
      return result;
    } catch (error) {
      logger.error('Signup failed:', error);
      throw error;
    }
  };
  
  const logout = () => signOut(auth);

  // Create user document in Firestore
  const createUserDocument = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        role: 'student', // Default role
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }, { merge: true }); // Use merge to avoid overwriting existing data
      logger.debug('User document created/updated:', user.uid);
    } catch (error) {
      logger.error('Error creating user document:', error);
    }
  };

  // Google Sign-In
  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Optional: prompt account selection each time
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      // Create user document for Google sign-in users too
      await createUserDocument(result.user);
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
      // Create user document for phone auth users too
      await createUserDocument(result.user);
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

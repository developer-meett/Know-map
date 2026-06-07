import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api/client';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  // Used to manually tie the promise from googleSignIn to the GSI callback
  const googleResolverRef = useRef(null);

  useEffect(() => {
    // 1. Restore Session (Replaces Firebase onAuthStateChanged)
    const restoreSession = async () => {
      try {
        const data = await apiFetch('/auth/me');
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        // Expected if no active cookie session exists; quietly fail
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };
    restoreSession();

    // 2. Load Google Identity Services (GSI) script dynamically
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('your_google_client_id_here')) {
      logger.warn('GSI Script skipped: Valid VITE_GOOGLE_CLIENT_ID is missing from environment.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
          auto_select: false,       // Prevent prompt from appearing aggressively
          cancel_on_tap_outside: false
        });
        
        // Render a GSI button in our hidden container so we can synthetically click it
        const hiddenContainer = document.getElementById('gsi-hidden-btn');
        if (hiddenContainer) {
          window.google.accounts.id.renderButton(hiddenContainer, {
            theme: 'outline', size: 'large'
          });
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Central GSI callback triggered after a successful Google Popup login
  const handleGoogleCallback = async (response) => {
    try {
      if (response.credential) { // This is the Google ID Token
        const data = await apiFetch('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken: response.credential })
        });
        setUser(data.user);
        if (googleResolverRef.current) {
          googleResolverRef.current.resolve(data.user);
        }
      } else {
        throw new Error('No credential idToken returned from Google');
      }
    } catch (err) {
      logger.error('Backend Google Auth validation failed', err);
      if (googleResolverRef.current) {
        googleResolverRef.current.reject(err);
      }
    } finally {
      googleResolverRef.current = null;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setUser(data.user);
      return data;
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  };
  
  const signup = async (email, password, displayName) => {
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName })
      });
      setUser(data.user);
      return data;
    } catch (error) {
      logger.error('Signup failed:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      logger.error('Logout failed:', error);
    } finally {
      // Hard reset local state regardless of server outcome
      setUser(null);
    }
  };

  const googleSignIn = () => {
    return new Promise((resolve, reject) => {
      googleResolverRef.current = { resolve, reject };
      
      const hiddenBtn = document.getElementById('gsi-hidden-btn');
      if (hiddenBtn) {
        // GSI wraps its UI inside a specific div with role="button"
        // Triggering this ensures the popup occurs via a valid user interaction map
        const nativeBtn = hiddenBtn.querySelector('div[role="button"]');
        if (nativeBtn) {
          nativeBtn.click();
        } else {
          reject(new Error("Google framework is still securely initializing. Please try again in 1 second."));
          googleResolverRef.current = null;
        }
      } else {
        reject(new Error("Google Auth mount point is missing from the DOM."));
        googleResolverRef.current = null;
      }
    });
  };

  const sendPhoneOtp = async () => {
    throw new Error('Phone auth not yet implemented in MERN version');
  };

  const verifyPhoneOtp = async () => {
    throw new Error('Phone auth not yet implemented in MERN version');
  };

  const value = { user, initializing, login, signup, logout, googleSignIn, sendPhoneOtp, verifyPhoneOtp };

  return (
    <AuthContext.Provider value={value}>
      {/* 
        This is purposefully rendered offscreen securely to trick GSI into 
        allowing seamless programmatic clicks from our own custom styled button.
      */}
      <div id="gsi-hidden-btn" style={{ display: 'none', position: 'absolute', visibility: 'hidden' }}></div>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

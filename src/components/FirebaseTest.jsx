import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const FirebaseTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [config, setConfig] = useState({});

  useEffect(() => {
    // Test Firebase connection
    try {
      console.log('🔍 Testing Firebase connection...');
      console.log('Auth instance:', auth);
      console.log('Auth app:', auth.app);
      
      setConfig({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
        hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      });
      
      if (auth && auth.app) {
        setStatus('✅ Firebase Connected Successfully');
        console.log('✅ Firebase connection test passed');
      } else {
        setStatus('❌ Firebase Connection Failed');
        console.error('❌ Firebase connection test failed');
      }
    } catch (error) {
      setStatus(`❌ Firebase Error: ${error.message}`);
      console.error('❌ Firebase test error:', error);
    }
  }, []);

  const testGoogleAuth = async () => {
    try {
      console.log('🔍 Testing Google Auth directly...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Direct Google auth test successful:', result.user.email);
      alert(`✅ Google Auth Works! Signed in as: ${result.user.email}`);
    } catch (error) {
      console.error('❌ Direct Google auth test failed:', error);
      alert(`❌ Google Auth Failed: ${error.code} - ${error.message}`);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '15px', 
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔥 Firebase Status</h4>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{status}</div>
      
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>
        <div>API Key: {config.hasApiKey ? '✅' : '❌'} {config.apiKey}</div>
        <div>Auth Domain: {config.hasAuthDomain ? '✅' : '❌'} {config.authDomain}</div>
        <div>Project ID: {config.hasProjectId ? '✅' : '❌'} {config.projectId}</div>
      </div>
      
      <button 
        onClick={testGoogleAuth}
        style={{
          background: '#4285f4',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '8px'
        }}
      >
        🧪 Test Google Auth
      </button>
      
      <div style={{ fontSize: '10px', color: '#999' }}>
        Check browser console for detailed logs
      </div>
    </div>
  );
};

export default FirebaseTest;

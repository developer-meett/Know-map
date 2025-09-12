import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { checkIsAdmin } from '../utils/adminUtils';
import { logger } from '../utils/logger';

const AdminRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Temporary: Allow specific UID for testing
          if (user.uid === 'DX7Hu54gTLUtxchRzqk0dVDcOR53') {
            setIsAdmin(true);
            logger.debug('Admin access granted for test user');
          } else {
            const adminStatus = await checkIsAdmin(user);
            setIsAdmin(adminStatus);
            logger.debug('Admin status checked:', adminStatus);
          }
        } catch (error) {
          logger.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setChecking(false);
    };

    if (!initializing) {
      checkAdminStatus();
    }
  }, [user, initializing]);

  // Show loading while checking authentication and admin status
  if (initializing || checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render the protected admin component
  return children;
};

export default AdminRoute;

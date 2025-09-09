import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Toast from './Toast';
import { useAuth } from '../auth/AuthContext';
import { TOAST_DURATION } from '../utils/constants';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [toast, setToast] = useState({ message: '', visible: false });
  
  // Use ref instead of global variable to prevent memory leaks
  const toastTimerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
    
    // Clear existing timer
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    // Set new timer
    toastTimerRef.current = setTimeout(() => {
      setToast({ message: '', visible: false });
    }, TOAST_DURATION);
  }, []);

  const handleLoginClick = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleBackClick = useCallback(() => {
    navigate(-1); // Go back to previous page
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    showToast('Logged out successfully');
    navigate('/');
  }, [logout, showToast, navigate]);

  // Determine current page for navbar
  const currentPage = location.pathname === '/' ? 'home' : 
                     location.pathname === '/login' ? 'login' : 
                     location.pathname === '/quiz' ? 'quiz' : 
                     location.pathname === '/results' ? 'results' : 'other';

  // Show back button for quiz and results pages
  const showBackButton = currentPage === 'quiz' || currentPage === 'results';

  return (
    <>
      <Navbar 
        user={user}
        currentPage={currentPage}
        onLoginClick={handleLoginClick}
        onBackClick={handleBackClick}
        showBackButton={showBackButton}
        logout={handleLogout}
      />
      <Outlet context={{ showToast }} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
};

export default Layout;

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Toast from './Toast/Toast';
import { useAuth } from '../auth/AuthContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
    window.clearTimeout(window.__toTimer);
    window.__toTimer = window.setTimeout(() => setToast({ message: '', visible: false }), 2600);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully');
    navigate('/');
  };

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

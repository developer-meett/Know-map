import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './styles/Navbar.module.css';

const Navbar = ({ onLoginClick, onBackClick, currentPage, showBackButton }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Check Firebase custom claims first
          const idTokenResult = await user.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            setIsAdmin(true);
            return;
          }

          // Fallback: check Firestore user document
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().isAdmin) {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="logo">
          <div className="logo-icon">KM</div>
          KnowMap
        </div>
        {user ? (
          <div className="auth-links-navbar">
            <span className="user-email">{user.email}</span>
            {isAdmin && (
              <button className="navbar-btn admin-btn" onClick={handleAdminClick}>
                Admin
              </button>
            )}
            <button className="navbar-btn" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          currentPage === 'home' ? (
            <div className="auth-links-navbar">
              <button className="navbar-btn" onClick={onLoginClick}>
                Login
              </button>
            </div>
          ) : showBackButton ? (
            <button className="back-btn" onClick={onBackClick}>
              {currentPage === 'quiz' ? 'Back to Home' : 'Back'}
            </button>
          ) : null
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { useAuth } from '../auth/AuthContext';
import './styles/Navbar.module.css';

const Navbar = ({ onLoginClick, onBackClick, currentPage, showBackButton }) => {
  const { user, logout } = useAuth();

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

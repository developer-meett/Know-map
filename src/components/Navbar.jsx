import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Check Firebase custom claims
          const idTokenResult = await user.getIdTokenResult(true); // Force refresh
          if (idTokenResult.claims.admin) {
            setIsAdmin(true);
            return;
          }

          // Fallback: check Firestore user document
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
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

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const isHomePage = location.pathname === '/';

  return (
    <header className="navbar">
      <nav className="container">
        <div className="logo" onClick={handleLogoClick}>
          <div className="logoIcon">KM</div>
          <span>KnowMap</span>
        </div>
        
        {user ? (
          <div className="nav-user-menu">
            <div className="user-info">
              <span>{user.email}</span>
            </div>
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleProfileClick}
            >
              Profile
            </button>
            {isAdmin && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleAdminClick}
              >
                Admin
              </button>
            )}
            <button 
              className="btn btn-outline btn-sm"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <button 
              className="btn btn-primary btn-md"
              onClick={handleLoginClick}
            >
              Login
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

import './App.css';
import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { useAuth } from './auth/AuthContext.jsx';

function App() {
  const [page, setPage] = useState('main');
  const { user, initializing, logout } = useAuth();
  const [toast, setToast] = useState({ message: '', visible: false });

  const showToast = (message) => {
    setToast({ message, visible: true });
    window.clearTimeout(window.__toTimer);
    window.__toTimer = window.setTimeout(() => setToast({ message: '', visible: false }), 2600);
  };

  const handleStartQuiz = () => {
    alert('Quiz will start! (No backend logic implemented)');
  };

  const handleSwitchToLogin = () => setPage('login');
  const handleSwitchToSignup = () => setPage('signup');
  const handleBackToMain = () => setPage('main');
  const handleAuthSuccess = (msg) => {
    showToast(msg || 'Success');
    setPage('main');
  };

  if (initializing) return null;

  return (
    <div className="app">
  <div className={`toast ${toast.visible ? 'show' : ''}`}>{toast.message}</div>
      <nav className="navbar">
        <div className="container">
          <div className="logo">
            <div className="logo-icon">KM</div>
            KnowMap
          </div>
          {user ? (
            <div className="auth-links-navbar">
              <span className="user-email">{user.email}</span>
              <button className="navbar-btn" onClick={logout}>Logout</button>
            </div>
          ) : (
            page === 'main' ? (
              <div className="auth-links-navbar">
                <button className="navbar-btn" onClick={handleSwitchToLogin}>
                  Login
                </button>
              </div>
            ) : (
              <button className="back-btn" onClick={handleBackToMain}>
                Back
              </button>
            )
          )}
        </div>
      </nav>
      <main className={page === 'main' ? 'hero' : 'auth-main'}>
        <div className="container">
          {page === 'main' && (
            <>
              <h1 className="hero-title">
                Stop Wasting Time on <span className="highlight">Random Revision</span>
              </h1>
              <p className="hero-subtitle">
                Take diagnostic quizzes across 12+ programming languages and CS topics. Get
                personalized learning roadmaps that show exactly what you know, what needs revision,
                and what to learn from scratch.
              </p>
              <div className="cta-section">
                <button className="cta-button" onClick={handleStartQuiz}>
                  Start Diagnostic Quiz →
                </button>
                <div className="quiz-info">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  ~10 minutes • Free
                </div>
              </div>
            </>
          )}
          {page === 'login' && (
            <Login
              onSwitchToSignup={handleSwitchToSignup}
              onSuccess={() => handleAuthSuccess('Signed in successfully')}
            />
          )}
          {page === 'signup' && (
            <Signup
              onSwitchToLogin={handleSwitchToLogin}
              onSuccess={() => handleAuthSuccess('Account created! Signed in successfully')}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

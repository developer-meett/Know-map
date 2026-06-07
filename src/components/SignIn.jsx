import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MIN_PASSWORD_LENGTH, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { BookOpen, CheckCircle, BarChart2, TrendingUp } from 'lucide-react';

const FEATURE_BULLETS = [
  { icon: BookOpen,   text: 'Diagnose knowledge gaps instantly' },
  { icon: BarChart2,  text: 'Per-topic Mastered / Revision breakdown' },
  { icon: TrendingUp, text: 'Personalised learning roadmap' },
  { icon: CheckCircle,text: 'Free to start — no credit card needed' },
];

const SignIn = () => {
  const { googleSignIn, login, signup } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [tab,             setTab]             = useState('email');
  const [isSignUp,        setIsSignUp]        = useState(false);
  const [displayName,     setDisplayName]     = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [message,         setMessage]         = useState('');

  useEffect(() => {
    setError(''); setMessage('');
    setEmail(''); setPassword(''); setConfirmPassword(''); setDisplayName('');
  }, [tab, isSignUp]);

  const validateEmail    = useCallback(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), []);
  const validatePassword = useCallback(v => v.length >= (MIN_PASSWORD_LENGTH ?? 6), []);

  const handleEmailAuth = useCallback(async () => {
    if (!email || !password || (isSignUp && !displayName.trim())) {
      setError(isSignUp && !displayName.trim() ? 'Display name is required.' : ERROR_MESSAGES.REQUIRED_FIELD);
      return;
    }
    if (!validateEmail(email))                      { setError(ERROR_MESSAGES.INVALID_EMAIL); return; }
    if (isSignUp && password !== confirmPassword)   { setError(ERROR_MESSAGES.PASSWORDS_DONT_MATCH); return; }
    if (!validatePassword(password))                { setError(ERROR_MESSAGES.WEAK_PASSWORD); return; }

    setLoading(true); setError('');
    setMessage(isSignUp ? 'Creating account…' : 'Signing in…');

    try {
      if (isSignUp) {
        await signup(email, password, displayName);
        setMessage(SUCCESS_MESSAGES.ACCOUNT_CREATED);
      } else {
        await login(email, password);
        setMessage(SUCCESS_MESSAGES.SIGNED_IN);
      }
      setTimeout(() => navigate(from, { replace: true }), 900);
    } catch (err) {
      const code = err.code ?? '';
      if      (code === 'auth/user-not-found')        setError('No account found. Sign up first.');
      else if (code === 'auth/wrong-password')         setError('Incorrect password.');
      else if (code === 'auth/email-already-in-use')  setError('Email already in use. Sign in instead.');
      else if (code === 'auth/invalid-email')         setError(ERROR_MESSAGES.INVALID_EMAIL);
      else if (err.message?.includes('credentials'))  setError('Invalid email or password.');
      else                                             setError(isSignUp ? 'Failed to create account.' : ERROR_MESSAGES.AUTH_FAILED);
      setMessage('');
    } finally { setLoading(false); }
  }, [email, password, confirmPassword, displayName, isSignUp, validateEmail, validatePassword, signup, login, navigate, from]);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true); setError(''); setMessage('Redirecting to Google…');
    try {
      await googleSignIn();
      setMessage('Signed in!');
      setTimeout(() => navigate(from, { replace: true }), 900);
    } catch (err) {
      const code = err.code ?? '';
      if      (code === 'auth/popup-closed-by-user')  setError('Sign-in cancelled.');
      else if (code === 'auth/popup-blocked')         setError('Popup blocked. Allow popups and retry.');
      else                                             setError(ERROR_MESSAGES.AUTH_FAILED);
      setMessage('');
    } finally { setLoading(false); }
  }, [googleSignIn, navigate, from]);

  return (
    <div className="signin-page page">

      {/* Decorative blobs */}
      <div className="signin-blob signin-blob-1" aria-hidden />
      <div className="signin-blob signin-blob-2" aria-hidden />

      <div className="signin-layout">

        {/* ── Left branding panel ── */}
        <div className="signin-brand">
          <div className="brand-logo">
            <div className="logoIcon" style={{ width: '3rem', height: '3rem', fontSize: '1.1rem' }}>KM</div>
            <span className="brand-name">KnowMap</span>
          </div>
          <h2 className="brand-headline">
            Know exactly<br />where you stand.
          </h2>
          <p className="brand-sub">
            Diagnostic quizzes that reveal your real knowledge level across 12+ topics.
          </p>
          <ul className="brand-bullets">
            {FEATURE_BULLETS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={16} strokeWidth={2.5} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right form card ── */}
        <div className="signin-card card-elevated">
          <h3 className="signin-heading">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h3>
          <p className="signin-sub">
            {isSignUp ? 'Start your learning journey.' : 'Sign in to continue.'}
          </p>

          {/* Tabs */}
          <div className="signin-tabs">
            <button
              className={`signin-tab ${tab === 'email' ? 'signin-tab-active' : ''}`}
              onClick={() => setTab('email')}
            >
              Email
            </button>
            <button
              className={`signin-tab ${tab === 'google' ? 'signin-tab-active' : ''}`}
              onClick={() => setTab('google')}
            >
              Google
            </button>
          </div>

          {/* Messages */}
          {error   && <div className="message error">{error}</div>}
          {message && <div className="message success">{message}</div>}

          {/* ── Email form ── */}
          {tab === 'email' && (
            <div className="signin-form">
              {isSignUp && (
                <div className="form-group">
                  <label className="label" htmlFor="displayName">Display name</label>
                  <input
                    id="displayName"
                    type="text"
                    className="input"
                    placeholder="Jane Smith"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                />
              </div>
              {isSignUp && (
                <div className="form-group">
                  <label className="label" htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                  />
                </div>
              )}
              <button className="btn btn-primary btn-block" onClick={handleEmailAuth} disabled={loading}>
                {loading
                  ? (isSignUp ? 'Creating account…' : 'Signing in…')
                  : (isSignUp ? 'Create account' : 'Sign in')}
              </button>
              <p className="signin-toggle">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={() => setIsSignUp(v => !v)}
                  disabled={loading}
                >
                  {isSignUp ? 'Sign in' : 'Sign up free'}
                </button>
              </p>
            </div>
          )}

          {/* ── Google ── */}
          {tab === 'google' && (
            <div className="signin-form">
              <button className="btn btn-google btn-block google-btn" onClick={handleGoogleSignIn} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <p className="signin-google-note">
                You&apos;ll be redirected to Google to complete sign-in securely.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .signin-page {
          min-height: calc(100vh - 4rem);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: var(--space-8) var(--space-4);
        }
        .signin-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .signin-blob-1 { width: 480px; height: 480px; background: radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 70%); top: -80px; right: -80px; }
        .signin-blob-2 { width: 360px; height: 360px; background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%); bottom: -60px; left: -60px; }

        .signin-layout {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
          width: 100%; max-width: 900px;
          align-items: center;
        }

        /* Branding panel */
        .signin-brand { padding: var(--space-6); }
        .brand-logo { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-8); }
        .brand-name { font-family: var(--font-heading); font-size: var(--text-xl); font-weight: var(--font-extrabold); color: var(--text-primary); }
        .brand-headline { font-size: clamp(1.75rem, 3vw, 2.25rem); font-weight: var(--font-extrabold); line-height: var(--leading-tight); color: var(--text-primary); margin-bottom: var(--space-4); letter-spacing: -0.02em; }
        .brand-sub { font-size: var(--text-base); color: var(--text-muted); line-height: var(--leading-relaxed); margin-bottom: var(--space-6); }
        .brand-bullets { list-style: none; display: flex; flex-direction: column; gap: var(--space-3); }
        .brand-bullets li { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); }
        .brand-bullets li svg { color: var(--accent); flex-shrink: 0; }

        /* Form card */
        .signin-card { width: 100%; }
        .signin-heading { font-size: var(--text-2xl); font-weight: var(--font-extrabold); color: var(--text-primary); margin-bottom: var(--space-1); }
        .signin-sub { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-5); }

        /* Tabs */
        .signin-tabs { display: flex; gap: var(--space-1); background: rgba(15,23,42,0.05); padding: 4px; border-radius: var(--radius-md); margin-bottom: var(--space-5); }
        .signin-tab { flex: 1; padding: var(--space-2) var(--space-3); border: none; background: transparent; border-radius: calc(var(--radius-md) - 2px); font-family: var(--font-body); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-muted); cursor: pointer; transition: all 150ms ease; }
        .signin-tab-active { background: #fff; color: var(--accent); font-weight: var(--font-semibold); box-shadow: var(--shadow-sm); }

        .signin-form { display: flex; flex-direction: column; gap: 0; }
        .signin-form .form-group { margin-bottom: var(--space-4); }

        .signin-toggle { text-align: center; font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-4); margin-bottom: 0; }
        .toggle-link { background: none; border: none; color: var(--accent); font-weight: var(--font-semibold); cursor: pointer; font-size: var(--text-sm); padding: 0; text-decoration: underline; text-underline-offset: 2px; }
        .toggle-link:hover { color: var(--accent-hover); }
        .toggle-link:disabled { opacity: 0.5; cursor: not-allowed; }

        .google-btn { font-size: var(--text-base) !important; padding: var(--space-4) var(--space-6) !important; margin-top: var(--space-2); gap: var(--space-3) !important; }
        .signin-google-note { text-align: center; font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-4); margin-bottom: 0; }

        @media (max-width: 700px) {
          .signin-layout { grid-template-columns: 1fr; }
          .signin-brand { display: none; }
        }
      `}</style>
    </div>
  );
};

export default SignIn;

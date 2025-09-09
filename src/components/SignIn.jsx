import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { logger } from '../utils/logger';
import { MIN_PASSWORD_LENGTH, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import './styles/SignIn.css';

// Country codes data
const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
];

const SignIn = () => {
  const { googleSignIn, sendPhoneOtp, verifyPhoneOtp, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination or default to home
  const from = location.state?.from?.pathname || '/';
  
  // State management
  const [authMethod, setAuthMethod] = useState('email'); // 'email', 'google', or 'phone'
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Email/Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Phone states
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[1]); // Default to India
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Clear messages when switching auth methods or sign up/in mode
  useEffect(() => {
    setError('');
    setMessage('');
    setOtpSent(false);
    setOtpCode('');
    setPhoneNumber('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [authMethod, isSignUp]);

  // Email validation helper
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Password validation helper
  const validatePassword = useCallback((password) => {
    return password.length >= MIN_PASSWORD_LENGTH;
  }, []);

  const handleEmailAuth = useCallback(async () => {
    if (!email || !password) {
      setError(ERROR_MESSAGES.REQUIRED_FIELD);
      return;
    }

    if (!validateEmail(email)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
      return;
    }

    if (!validatePassword(password)) {
      setError(ERROR_MESSAGES.WEAK_PASSWORD);
      return;
    }

    setLoading(true);
    setError('');
    setMessage(isSignUp ? 'Creating account...' : 'Signing in...');

    try {
      if (isSignUp) {
        await signup(email, password);
        setMessage(SUCCESS_MESSAGES.ACCOUNT_CREATED);
      } else {
        await login(email, password);
        setMessage(SUCCESS_MESSAGES.SIGNED_IN);
      }
      
      // Navigate to intended destination
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (error) {
      logger.error('Email auth error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        setError(ERROR_MESSAGES.INVALID_EMAIL);
      } else if (error.code === 'auth/weak-password') {
        setError(ERROR_MESSAGES.WEAK_PASSWORD);
      } else {
        setError(isSignUp ? 'Failed to create account. Please try again.' : ERROR_MESSAGES.AUTH_FAILED);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, isSignUp, validateEmail, validatePassword, signup, login, navigate, from]);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('Signing in with Google...');
    try {
      await googleSignIn();
      setMessage('Successfully signed in with Google!');
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (error) {
      logger.error('Google sign-in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked by browser. Please allow popups and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Another popup is already open. Please close it and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact support.');
      } else {
        setError(ERROR_MESSAGES.AUTH_FAILED);
      }
      setMessage('');
    } finally {
      setLoading(false);
    }
  }, [googleSignIn, navigate, from]);

  const handlePhoneNumberChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setPhoneNumber(value);
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${phoneNumber}`;
    setLoading(true);
    setError('');
    setMessage('Sending OTP...');

    try {
      await sendPhoneOtp(fullPhoneNumber);
      setOtpSent(true);
      setMessage('OTP sent successfully! Please check your phone.');
    } catch (error) {
      console.error('Phone OTP error:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please use international format.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Phone authentication is not enabled. Please contact support.');
      } else if (error.message.includes('reCAPTCHA') || error.code === 'auth/captcha-check-failed') {
        setError('Verification failed. Please refresh the page and try again.');
      } else if (error.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
      setMessage('');
    } finally {
      setLoading(false);
    }
  }, [sendPhoneOtp, selectedCountry.code, phoneNumber]);

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('Verifying OTP...');

    try {
      await verifyPhoneOtp(otpCode);
      setMessage('Successfully signed in with phone number!');
      setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (error) {
      console.error('OTP verification error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        setError('OTP code has expired. Please request a new one.');
        setOtpSent(false);
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 6); // Only digits, max 6
    setOtpCode(value);
  };

  const selectCountry = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Welcome to Know-Map</h1>
          <p>Sign in to access your personalized quiz experience</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMethod === 'email' ? 'active' : ''}`}
            onClick={() => setAuthMethod('email')}
          >
            Email
          </button>
          <button
            className={`auth-tab ${authMethod === 'google' ? 'active' : ''}`}
            onClick={() => setAuthMethod('google')}
          >
            Google
          </button>
          <button
            className={`auth-tab ${authMethod === 'phone' ? 'active' : ''}`}
            onClick={() => setAuthMethod('phone')}
          >
            Phone
          </button>
        </div>

        {/* Error and Success Messages */}
        {error && <div className="message error">{error}</div>}
        {message && <div className="message success">{message}</div>}

        {/* Email/Password Sign-In Section */}
        {authMethod === 'email' && (
          <div className="auth-section">
            <div className="email-form">
              <input
                type="email"
                className="email-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <input
                type="password"
                className="password-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              
              {isSignUp && (
                <input
                  type="password"
                  className="password-input"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              )}
              
              <button
                className="email-auth-btn"
                onClick={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
              
              <div className="auth-toggle">
                <span>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  className="toggle-auth-btn"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google Sign-In Section */}
        {authMethod === 'google' && (
          <div className="auth-section">
            <button
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>
        )}

        {/* Phone Number Sign-In Section */}
        {authMethod === 'phone' && (
          <div className="auth-section">
            {!otpSent ? (
              <div className="phone-input-section">
                <div className="phone-input-group">
                  <div className="country-selector" onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
                    <span className="country-flag">{selectedCountry.flag}</span>
                    <span className="country-code">{selectedCountry.code}</span>
                    <span className="dropdown-arrow">▼</span>
                    
                    {showCountryDropdown && (
                      <div className="country-dropdown">
                        {countryCodes.map((country) => (
                          <div
                            key={country.country}
                            className="country-option"
                            onClick={() => selectCountry(country)}
                          >
                            <span className="country-flag">{country.flag}</span>
                            <span className="country-code">{country.code}</span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="tel"
                    className="phone-input"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    maxLength="15"
                    disabled={loading}
                  />
                </div>
                
                <button
                  className="send-otp-btn"
                  onClick={handleSendOtp}
                  disabled={loading || !phoneNumber}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="otp-input-section">
                <p className="otp-instruction">
                  Enter the 6-digit code sent to {selectedCountry.code}{phoneNumber}
                </p>
                
                <input
                  type="text"
                  className="otp-input"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={handleOtpInputChange}
                  maxLength="6"
                  disabled={loading}
                />
                
                <div className="otp-actions">
                  <button
                    className="verify-otp-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  
                  <button
                    className="resend-otp-btn"
                    onClick={() => setOtpSent(false)}
                    disabled={loading}
                  >
                    Change Number
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recaptcha Container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default SignIn;

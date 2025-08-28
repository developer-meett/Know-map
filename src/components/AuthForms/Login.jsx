import React, { useState } from "react";
import '../../App.css';
import { useAuth } from '../../auth/AuthContext.jsx';

const Login = ({ onSwitchToSignup, onSuccess }) => {
  const { login, googleSignIn, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onSuccess && onSuccess();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await googleSignIn();
      onSuccess && onSuccess();
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPhoneOtp(phone, 'recaptcha-container');
      setOtpSent(true);
    } catch (err) {
      setError('Failed to send OTP. Check phone format incl. country code, e.g., +1...');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyPhoneOtp(otp);
      onSuccess && onSuccess();
    } catch (err) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Welcome Back</h2>
       
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Signing In…' : 'Sign In'}
        </button>
      </form>

      <div className="alt-auth">
        <div className="divider"><span>or</span></div>
        <button className="oauth-btn google" onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </button>

        <div className="divider small"><span>or sign in with phone</span></div>
        <form className="auth-form" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <div id="recaptcha-container" />
          <div className="input-group">
            <input
              type="tel"
              placeholder="Phone number (e.g., +1 555 555 5555)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required={!otpSent}
              disabled={otpSent}
            />
          </div>
          {otpSent && (
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
          )}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {otpSent ? 'Verify Code' : 'Send OTP'}
          </button>
        </form>
      </div>
      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button className="signup-link" onClick={onSwitchToSignup}>
            Create one here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

function mapAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Please enter a valid email.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

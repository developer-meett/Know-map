import React, { useState } from "react";
import "../../App.css";
import { useAuth } from '../../auth/AuthContext.jsx';

const Signup = ({ onSwitchToLogin, onSuccess }) => {
  const { signup, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      onSuccess && onSuccess();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPhoneOtp(phone, 'recaptcha-container-signup');
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
        <h2>Create your account</h2>
        <p className="auth-subtext">Start your personalized learning plan</p>
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
        <div className="input-group">
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>
      <div className="alt-auth">
        <div className="divider"><span>or</span></div>
        <div className="divider small"><span>or sign up with phone</span></div>
        <form className="auth-form" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
          <div id="recaptcha-container-signup" />
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
          Already have an account?{' '}
          <button className="signup-link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;

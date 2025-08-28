import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Login from '../components/AuthForms/Login';
import Signup from '../components/AuthForms/Signup';

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useOutletContext();

  const handleSwitchToSignup = () => setIsSignup(true);
  const handleSwitchToLogin = () => setIsSignup(false);
  
  const handleSuccess = (message) => {
    showToast(message);
    navigate('/');
  };

  return (
    <main className="auth-main">
      <div className="container">
        {isSignup ? (
          <Signup 
            onSwitchToLogin={handleSwitchToLogin}
            onSuccess={() => handleSuccess('Account created! Signed in successfully')}
          />
        ) : (
          <Login 
            onSwitchToSignup={handleSwitchToSignup}
            onSuccess={() => handleSuccess('Signed in successfully')}
          />
        )}
      </div>
    </main>
  );
};

export default LoginPage;

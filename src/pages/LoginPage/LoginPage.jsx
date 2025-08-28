import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../../components/AuthForms/Login';
import Signup from '../../components/AuthForms/Signup';

const LoginPage = ({ onAuthSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSwitchToSignup = () => setIsSignup(true);
  const handleSwitchToLogin = () => setIsSignup(false);
  
  const handleSuccess = (message) => {
    onAuthSuccess(message);
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

import React from 'react';
import './styles/Toast.module.css';

const Toast = ({ message, visible }) => {
  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;

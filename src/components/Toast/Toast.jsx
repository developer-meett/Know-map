import React from 'react';

const Toast = ({ message, visible }) => {
  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;

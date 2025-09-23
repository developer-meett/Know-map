import React from 'react';
import styles from './styles/Toast.module.css';

const Toast = ({ message, visible, type = 'info' }) => {
  if (!visible || !message) return null;

  return (
    <div className={`${styles.toast} ${styles[type]} ${visible ? styles.show : ''}`}>
      <div className={styles.toastContent}>
        <span className={styles.toastMessage}>{message}</span>
      </div>
    </div>
  );
};

export default Toast;

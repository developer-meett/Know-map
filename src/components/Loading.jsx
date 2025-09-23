import React from 'react';
import styles from './styles/Loading.module.css';

const Loading = ({ 
  size = 'md', 
  variant = 'primary', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const className = `${styles.loading} ${styles[size]} ${styles[variant]} ${
    fullScreen ? styles.fullScreen : ''
  }`;

  return (
    <div className={className}>
      <div className={styles.spinner}>
        <div className={styles.spinnerInner}></div>
      </div>
      {text && <span className={styles.loadingText}>{text}</span>}
    </div>
  );
};

export default Loading;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/HomePage.module.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    navigate('/quiz');
  };

  return (
    <main className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Stop Wasting Time on <span className={styles.highlight}>Random Revision</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Take diagnostic quizzes across 12+ programming languages and CS topics. Get
            personalized learning roadmaps that show exactly what you know, what needs revision,
            and what to learn from scratch.
          </p>
          <div className={styles.ctaSection}>
            <button className="btn btn-primary btn-xl" onClick={handleStartQuiz}>
              Start Diagnostic Quiz →
            </button>
            <p className={styles.ctaHint}>Free • No account required</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;

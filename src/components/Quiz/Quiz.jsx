import React, { useMemo, useState, useEffect } from 'react';
import { questions as defaultQuestions } from '../../questions.js';

export default function Quiz({ items, onComplete }) {
  const qs = useMemo(() => (Array.isArray(items) && items.length ? items : defaultQuestions), [items]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = qs[current];
  const total = qs.length;
  const isLast = current === total - 1;

  const handleSelect = (idx) => setSelected(idx);

  const handleNext = () => {
    if (selected === null) return;
    if (selected === q.answerIndex) setScore((s) => s + 1);

    if (isLast) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  // Call onComplete when quiz finishes
  useEffect(() => {
    if (finished && onComplete) {
      onComplete(score, total);
    }
  }, [finished, score, total, onComplete]);

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (!qs || !qs.length) return null;

  if (finished) {
    return (
      <div className="quiz-results-container">
        <div className="quiz-results-header">
          <h3 className="quiz-results-title">Quiz Finished!</h3>
        </div>
        <p className="quiz-score">
          You scored <span className="quiz-score-number">{score}</span> out of <span className="quiz-score-number">{total}</span>
        </p>
        <button 
          className="btn quiz-restart-btn" 
          onClick={handleRestart}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h3 className="quiz-title">Question {current + 1}</h3>
        <div className="quiz-progress">({current + 1} / {total})</div>
      </div>

      <div className="quiz-question">{q.question}</div>

      <div className="quiz-options">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(idx)}
            aria-pressed={selected === idx}
            className={`quiz-option ${selected === idx ? 'quiz-option-selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="quiz-footer">
        <div />
        <button
          onClick={handleNext}
          disabled={selected === null}
          className={`btn ${selected === null ? 'btn-disabled' : ''}`}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}

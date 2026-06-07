import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { Trophy, RefreshCcw, Home, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import './Results.css';

// ── Donut SVG ──────────────────────────────────────────────────────────────────
const DonutChart = ({ percentage }) => {
  const r  = 54;
  const cx = 64; const cy = 64;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80 ? 'var(--success)'
    : percentage >= 50 ? 'var(--warning)'
    : 'var(--danger)';

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-label={`${percentage}%`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="12" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1), stroke 0.4s ease' }}
      />
      <text x={cx} y={cy - 4}  textAnchor="middle" fill={color}   fontSize="22" fontWeight="800" fontFamily="'Plus Jakarta Sans',sans-serif">{percentage}%</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontWeight="500" fontFamily="'Inter',sans-serif">overall</text>
    </svg>
  );
};

// ── Topic progress bar ─────────────────────────────────────────────────────────
const TopicBar = ({ topic, data }) => {
  const pct  = data.percentage ?? 0;
  const cls  = data.classification ?? '';
  const badgeClass =
    cls === 'Mastered'       ? 'badge-mastered'
    : cls === 'Needs Revision' ? 'badge-revision'
    : 'badge-scratch';

  const barColor =
    cls === 'Mastered'       ? 'var(--success)'
    : cls === 'Needs Revision' ? 'var(--warning)'
    : 'var(--danger)';

  return (
    <div className="topic-card card">
      <div className="topic-top">
        <span className="topic-name">{topic}</span>
        <span className={badgeClass}>{cls}</span>
      </div>
      <div className="topic-fraction">{data.correct}/{data.total} correct</div>
      <div className="topic-bar-bg">
        <div
          className="topic-bar-fill"
          style={{ width: `${pct}%`, background: barColor, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
      </div>
    </div>
  );
};

// ── Question review item ───────────────────────────────────────────────────────
const QuestionItem = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  const correct = item.isCorrect;

  return (
    <div className={`q-item ${correct ? 'q-correct' : 'q-wrong'}`}>
      <button className="q-toggle" onClick={() => setOpen(v => !v)}>
        <div className="q-toggle-left">
          {correct
            ? <CheckCircle size={16} color="var(--success)" />
            : <XCircle    size={16} color="var(--danger)"  />
          }
          <span className="q-index">Q{index + 1}</span>
          <span className="q-text">{item.question ?? `Question ${index + 1}`}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="q-detail">
          {item.userAnswer !== undefined && (
            <p className="q-answer q-your">
              Your answer: <strong>{item.options?.[item.userAnswer] ?? (item.userAnswer === -1 ? "Don't know" : item.userAnswer)}</strong>
            </p>
          )}
          {!correct && item.correctAnswer !== undefined && (
            <p className="q-answer q-right">
              Correct answer: <strong>{item.options?.[item.correctAnswer] ?? item.correctAnswer}</strong>
            </p>
          )}
          {item.topic && <p className="q-topic">Topic: {item.topic}</p>}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const ResultsPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { reportId } = useParams();

  const [fetchedReport, setFetchedReport] = useState(null);
  const [fetchLoading,  setFetchLoading]  = useState(false);
  const [fetchError,    setFetchError]    = useState(null);

  useEffect(() => {
    if (reportId && !location.state?.analysis) {
      setFetchLoading(true);
      apiFetch(`/reports/${reportId}`)
        .then(data   => setFetchedReport(data.report))
        .catch(err   => setFetchError(err.message || 'Report not found'))
        .finally(()  => setFetchLoading(false));
    }
  }, [reportId, location.state]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <main className="results-page page">
        <div className="container">
          <div className="results-loading card">
            <div className="spinner" />
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-muted)' }}>
              Loading your results…
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <main className="results-page page">
        <div className="container">
          <div className="results-error card">
            <XCircle size={48} color="var(--danger)" strokeWidth={1.5} />
            <h3>Report not found</h3>
            <p>{fetchError}</p>
            <div className="results-actions">
              <button className="btn btn-primary" onClick={() => navigate('/quiz')}>Take a Quiz</button>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>Go Home</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Resolve data ───────────────────────────────────────────────────────────
  let score = 0, total = 0, analysis = null, message = '', xpEarned = null, isPerfectScore = false;

  if (location.state?.analysis) {
    analysis       = location.state.analysis;
    score          = analysis.totalScore;
    total          = analysis.totalQuestions;
    message        = location.state.message || 'Quiz completed!';
    xpEarned       = location.state.xpEarned ?? null;
    isPerfectScore = location.state.isPerfectScore ?? false;
  } else if (fetchedReport) {
    score          = fetchedReport.score ?? 0;
    total          = fetchedReport.totalQuestions ?? 0;
    message        = 'Here are your results!';
    isPerfectScore = fetchedReport.isPerfectScore ?? false;
    xpEarned       = fetchedReport.xpEarned ?? null;
    analysis       = {
      totalScore:        score,
      totalQuestions:    total,
      overallPercentage: fetchedReport.percentage ?? 0,
      classifiedTopics:  fetchedReport.topicBreakdown ?? {},
      questionBreakdown: fetchedReport.questionBreakdown ?? [],
    };
  } else if (location.state) {
    score   = location.state.correctAnswers || location.state.score || 0;
    total   = location.state.totalQuestions || location.state.total || 0;
    message = location.state.message || 'Quiz completed!';
    if (location.state.report?.classifiedTopics) {
      analysis = location.state.report;
      score    = analysis.totalScore;
      total    = analysis.totalQuestions;
    }
  }

  const percentage = analysis?.overallPercentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const topics     = analysis?.classifiedTopics  ? Object.entries(analysis.classifiedTopics) : [];
  const breakdown  = analysis?.questionBreakdown ?? [];

  const scoreLabel =
    isPerfectScore ? 'Perfect score!'
    : percentage >= 80 ? 'Excellent work!'
    : percentage >= 50 ? 'Good effort!'
    : 'Keep practising!';

  return (
    <main className="results-page page">
      <div className="results-container container">

        {/* ── Score hero ── */}
        <div className="score-hero card">
          {isPerfectScore && (
            <div className="perfect-badge">
              <Trophy size={16} /> Perfect Score
            </div>
          )}
          <DonutChart percentage={percentage} />
          <div className="score-text">
            <h2 className="score-label">{scoreLabel}</h2>
            <p className="score-fraction">{score} / {total} correct</p>
            {message && <p className="score-message">{message}</p>}
          </div>
          {xpEarned !== null && (
            <div className="xp-badge">
              <span>+{xpEarned} XP earned</span>
            </div>
          )}
        </div>

        {/* ── Topic breakdown ── */}
        {topics.length > 0 && (
          <section className="topics-section">
            <h3 className="section-heading">Topic breakdown</h3>
            <div className="topics-grid">
              {topics.map(([topic, data]) => (
                <TopicBar key={topic} topic={topic} data={data} />
              ))}
            </div>
          </section>
        )}

        {/* ── Question review ── */}
        {breakdown.length > 0 && (
          <section className="review-section">
            <h3 className="section-heading">Question review</h3>
            <div className="review-list">
              {breakdown.map((item, i) => (
                <QuestionItem key={i} item={item} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Actions ── */}
        <div className="results-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/quiz')}>
            <RefreshCcw size={16} /> Take Another Quiz
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>
            <Home size={16} /> Back to Home
          </button>
        </div>
      </div>
    </main>
  );
};

export default ResultsPage;
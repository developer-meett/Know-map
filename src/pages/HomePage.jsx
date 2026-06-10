import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart2, TrendingUp, Sparkles, CheckCircle } from 'lucide-react';
import './HomePage.css';

const STATS = [
  { value: '12+', label: 'Topics Covered' },
  { value: '3',   label: 'Skill Levels'   },
  { value: '100%', label: 'Instant Results' },
];

const FEATURES = [
  {
    icon:  BookOpen,
    color: 'feat-teal',
    title: 'Diagnose',
    desc:  'Pinpoint knowledge gaps across 12+ programming languages and CS topics in minutes.',
  },
  {
    icon:  BarChart2,
    color: 'feat-sky',
    title: 'Analyze',
    desc:  'Per-topic breakdown — Mastered, Needs Revision, or Learn from Scratch.',
  },
  {
    icon:  TrendingUp,
    color: 'feat-emerald',
    title: 'Improve',
    desc:  'Receive a personalised learning roadmap built from your exact quiz performance.',
  },
];

const PERKS = [
  'No account required to start',
  'Results saved to your profile',
  'Instant topic-level breakdown',
];

const HomePage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className={`home-page page ${visible ? 'home-visible' : ''}`}>

      {/* ── Decorative blobs ── */}
      <div className="home-blob home-blob-1" aria-hidden />
      <div className="home-blob home-blob-2" aria-hidden />

      {/* ── Hero ── */}
      <section className="home-hero container">
        <div className="hero-eyebrow">
          <Sparkles size={14} />
          <span>AI-powered quiz diagnostics</span>
        </div>

        <h1 className="hero-title">
          Know Exactly<br />
          <span className="hero-gradient">Where You Stand</span>
        </h1>

        <p className="hero-subtitle">
          Take a diagnostic quiz and get a personalised map of what you&apos;ve mastered,
          what needs revision, and where to start from scratch — in under 10 minutes.
        </p>

        {/* Perks */}
        <ul className="hero-perks">
          {PERKS.map(p => (
            <li key={p}>
              <CheckCircle size={14} strokeWidth={2.5} />
              {p}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hero-cta">
          <button className="btn btn-primary btn-xl hero-btn" onClick={() => navigate('/quiz')}>
            Start Diagnostic Quiz 
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
            View My Profile
          </button>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          {STATS.map(s => (
            <div className="stat-item card" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="home-features container">
        <p className="feat-eyebrow">How it works</p>
        <h2 className="feat-heading">Three steps to smarter study</h2>
        <div className="feat-grid">
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div className={`feat-card card ${color}`} key={title}>
              <div className="feat-icon-wrap">
                <Icon size={22} strokeWidth={2} />
              </div>
              <h3 className="feat-title">{title}</h3>
              <p className="feat-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
};

export default HomePage;

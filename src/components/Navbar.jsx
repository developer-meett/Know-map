import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAdmin   = !!user?.isAdmin;

  // User avatar initials
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="navbar">
      <nav className="container">

        {/* Logo */}
        <div className="logo" onClick={() => navigate('/')} role="link" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/')}>
          <div className="logoIcon">KM</div>
          <span>KnowMap</span>
        </div>

        {/* Right side */}
        {user ? (
          <div className="nav-user-menu">
            {/* Quiz link */}
            <NavLink
              to="/quiz"
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link-active' : ''}`
              }
            >
              Quizzes
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-link nav-link-admin${isActive ? ' nav-link-active' : ''}`
                }
              >
                Admin
              </NavLink>
            )}

            {/* Avatar + profile */}
            <button
              className="nav-avatar"
              onClick={() => navigate('/profile')}
              title={user.displayName || user.email}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={initials} className="nav-avatar-img" />
              ) : (
                <span className="nav-avatar-initials">{initials}</span>
              )}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <NavLink to="/quiz" className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }>
              Quizzes
            </NavLink>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
        )}
      </nav>

      <style>{`
        .logo-dot {
          font-size: 1.4rem;
          color: var(--accent);
          line-height: 1;
          margin-left: -4px;
        }
        .nav-link {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--text-muted);
          text-decoration: none;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          transition: color 150ms ease, background 150ms ease;
        }
        .nav-link:hover { color: var(--text-primary); background: rgba(15,23,42,0.05); }
        .nav-link-active { color: var(--accent) !important; font-weight: var(--font-semibold); }
        .nav-link-admin {
          color: var(--accent);
          background: var(--accent-subtle);
          border: 1px solid rgba(13,148,136,0.20);
        }
        .nav-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 2px solid var(--border-strong);
          background: linear-gradient(135deg, var(--accent-light), var(--secondary-light));
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 150ms ease, transform 150ms ease;
          padding: 0;
        }
        .nav-avatar:hover { border-color: var(--accent); transform: scale(1.05); }
        .nav-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .nav-avatar-initials {
          font-size: var(--text-xs); font-weight: var(--font-bold);
          color: var(--accent); line-height: 1;
        }
      `}</style>
    </header>
  );
};

export default Navbar;

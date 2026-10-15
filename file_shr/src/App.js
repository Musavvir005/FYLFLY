import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPanel from './components/UploadPanel';
import RetrievePanel from './components/RetrievePanel';
import AboutPanel from './components/AboutPanel';

function App() {
  const [activePanel, setActivePanel] = useState('upload');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fyl_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fyl_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navItems = [
    { id: 'upload', label: 'Upload', icon: '⬆️' },
    { id: 'retrieve', label: 'Retrieve', icon: '⬇️' },
    { id: 'about', label: 'About Me', icon: '👤' },
  ];

  return (
    <div className="app-wrapper" data-theme={theme}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">FYL</div>
          <span className="brand-name">FLY</span>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
              onClick={() => setActivePanel(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {activePanel === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>ABDUL MUSAVVIR</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="mobile-brand">
              <div className="brand-icon-sm">FYL</div>
              <span className="brand-name-sm">FLY</span>
            </div>
            <div className="topbar-title">
              {navItems.find((n) => n.id === activePanel)?.label}
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-meta">Secure · Fast · Private</div>

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb" />
                <span className="theme-toggle-icon icon-sun" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4.5" />
                    <line x1="12" y1="2" x2="12" y2="4.5" />
                    <line x1="12" y1="19.5" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
                    <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="4.5" y2="12" />
                    <line x1="19.5" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="6.7" y2="17.3" />
                    <line x1="17.3" y1="6.7" x2="19.07" y2="4.93" />
                  </svg>
                </span>
                <span className="theme-toggle-icon icon-moon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </span>
              </span>
              <span className="theme-toggle-emoji" aria-hidden="true">
                {theme === 'light' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </header>

        <div className="panel-area">
          <div className={`panel-slide ${activePanel === 'upload' ? 'active' : ''}`}>
            <UploadPanel />
          </div>
          <div className={`panel-slide ${activePanel === 'retrieve' ? 'active' : ''}`}>
            <RetrievePanel />
          </div>
          <div className={`panel-slide ${activePanel === 'about' ? 'active' : ''}`}>
            <AboutPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

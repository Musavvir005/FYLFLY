import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPanel from './components/UploadPanel';
import RetrievePanel from './components/RetrievePanel';
import AboutPanel from './components/AboutPanel';

function App() {
  const [activePanel, setActivePanel] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'retrieve' || tab === 'about' || tab === 'upload') return tab;
      if (params.get('code')) return 'retrieve';
      if (window.location.hash === '#retrieve') return 'retrieve';
    } catch (e) {}
    return 'upload';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fyl_theme') || 'light';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fyl_theme', theme);
  }, [theme]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for browser navigation / URL updates
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'retrieve' || tab === 'about' || tab === 'upload') {
          setActivePanel(tab);
        } else if (params.get('code') || window.location.hash.startsWith('#retrieve')) {
          setActivePanel('retrieve');
        }
      } catch (e) {}
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const navItems = [
    { id: 'upload', label: 'Upload', icon: '⬆️' },
    { id: 'retrieve', label: 'Retrieve', icon: '⬇️' },
    { id: 'about', label: 'About Me', icon: '👤' },
  ];

  const handleNavClick = (id) => {
    setActivePanel(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`app-wrapper ${mobileMenuOpen ? 'drawer-is-open' : ''}`} data-theme={theme}>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Slide-Out Drawer on Mobile */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">FYL</div>
          <span className="brand-name">FLY</span>
          {/* Close button in mobile drawer */}
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
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
            {/* 3 Horizontal Lines Hamburger button for Mobile */}
            <button
              type="button"
              className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-bar bar-1" />
              <span className="hamburger-bar bar-2" />
              <span className="hamburger-bar bar-3" />
            </button>

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
                {theme === 'light' ? '☀️' : '🌙'}
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

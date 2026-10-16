import React from 'react';

const SEND_STEPS = [
  { icon: '📁', title: 'Pick a File', desc: 'Click the drop zone or drag any file in — up to 200 MB.' },
  { icon: '📧', title: 'Enter Email', desc: "Add the recipient's email address to deliver the access OTP." },
  { icon: '💬', title: 'Add a Note', desc: 'Optionally add a personal message that will appear in their email.' },
  { icon: '🚀', title: 'Send & Get OTP', desc: 'Hit "Send File" — your file is uploaded and a unique 6-character OTP is emailed.' },
];

const RETRIEVE_STEPS = [
  { icon: '🗝️', title: 'Have an OTP?', desc: 'Switch to the Retrieve tab in the navigation.' },
  { icon: '⌨️', title: 'Enter OTP', desc: 'Type the 6-character access OTP (e.g. FYL-12A45M).' },
  { icon: '🔍', title: 'Find File', desc: 'Hit "Retrieve File" — the file metadata appears instantly.' },
  { icon: '⬇️', title: 'Download or View', desc: 'Click Download to save the file — or View to open it online.' },
];

const STATS = [
  { icon: '📦', value: '200 MB', label: 'Max File Size' },
  { icon: '⏳', value: '24 Hours', label: 'Auto-Delete Lifespan' },
  { icon: '🛡️', value: '0 Accounts', label: 'No Signup Needed' },
  { icon: '🔐', value: '6-Char OTP', label: 'Direct Access Code' },
];

const ARCHITECTURE_POINTS = [
  {
    icon: '🛡️',
    title: 'Ephemeral & Zero-Trace Privacy',
    desc: 'Files automatically self-destruct after 24 hours. A scheduled background worker cleans up database records and permanently purges files from Cloudinary storage.',
  },
  {
    icon: '⚡',
    title: 'Zero Friction, No Accounts',
    desc: 'No passwords to remember, no user profiles, and no marketing newsletters. Drop a file, enter the destination email, and share instantly.',
  },
  {
    icon: '🔐',
    title: 'Secure OTP-Guarded Retrieval',
    desc: 'Every upload generates a cryptographically secure 6-character alphanumeric code delivered exclusively to the recipient’s inbox for authenticated download.',
  },
  {
    icon: '💌',
    title: 'Fast Automated Delivery',
    desc: 'Integrated with reliable automated mail delivery, personalized sender notes, and a witty joke to brighten the recipient’s day.',
  },
];

const FEATURES = [
  { icon: '🔒', title: 'Secure Transfer', desc: 'End-to-end encrypted transfer over HTTPS and TLS cloud storage.' },
  { icon: '⚡', title: 'Instant CDN Delivery', desc: 'High-speed worldwide downloads powered by optimized cloud endpoints.' },
  { icon: '🌐', title: 'Cross-Device Design', desc: 'Full-featured experience across mobile phones, tablets, and desktops.' },
  { icon: '⏳', title: '24-Hour Auto-Purge', desc: 'Automated 5-minute cron checks ensure zero stale data remains online.' },
  { icon: '🌓', title: 'Dual Theme Engine', desc: 'Handcrafted Forest Morning light mode and Cyber Midnight Obsidian dark mode.' },
  { icon: '🚫', title: '100% Ad-Free', desc: 'Zero intrusive pop-ups, telemetry trackers, or third-party cookies.' },
];

const SKILLS = [
  'React.js',
  'Node.js',
  'Express',
  'MongoDB',
  'Cloudinary',
  'REST APIs',
  'Responsive UI/UX',
  'Git / GitHub',
];

function StepList({ steps }) {
  return (
    <div className="how-steps">
      {steps.map((step, i) => (
        <div className="how-step" key={i}>
          <div className="step-track">
            <div className="step-badge">{i + 1}</div>
            {i < steps.length - 1 && <div className="step-connector" />}
          </div>
          <div className="step-card">
            <span className="step-icon">{step.icon}</span>
            <div className="step-body">
              <p className="step-title">{step.title}</p>
              <p className="step-desc">{step.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="panel about-panel">
      {/* Header */}
      <div className="panel-header">
        <h2 className="panel-title">About Me &amp; FYL-FLY</h2>
        <p className="panel-subtitle">
          Meet the creator, discover the philosophy, and explore the architecture behind fast, private file sharing.
        </p>
      </div>

      {/* ── Developer Profile Card ── */}
      <div className="about-creator-card">

        <p className="creator-bio">
          Hi! I&apos;m <strong>Abdul Musavvir</strong>, a full stack developer dedicated to building fast, clean, and purposeful software.
          I built <strong>FYL-FLY</strong> from the ground up to solve modern friction in peer-to-peer file sharing — delivering a private,
          temporary sharing platform with zero required account sign-ups, automated 24-hour self-destruction, and seamless mobile responsiveness.
        </p>

        <div className="creator-skills">
          {SKILLS.map((skill) => (
            <span key={skill} className="skill-chip">{skill}</span>
          ))}
        </div>

        <div className="creator-actions">
          <a
            href="https://github.com/Musavvir005"
            target="_blank"
            rel="noopener noreferrer"
            className="creator-link-btn primary"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub Profile
          </a>
          <a
            href="mailto:musavvir_abdul@srmap.edu.in"
            className="creator-link-btn secondary"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            musavvir_abdul@srmap.edu.in
          </a>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="about-stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className="about-stat-card">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Architecture & Security Deep Dive ── */}
      <div className="how-block">
        <p className="how-block-label">💡 Architecture &amp; Security Highlights</p>
        <div className="deep-dive-grid">
          {ARCHITECTURE_POINTS.map((pt) => (
            <div key={pt.title} className="deep-dive-card">
              <div className="deep-dive-top">
                <span className="deep-dive-icon">{pt.icon}</span>
                <h4 className="deep-dive-title">{pt.title}</h4>
              </div>
              <p className="deep-dive-desc">{pt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How to Send ── */}
      <div className="how-block">
        <p className="how-block-label">📤 How to Send a File</p>
        <StepList steps={SEND_STEPS} />
      </div>

      {/* ── How to Retrieve ── */}
      <div className="how-block">
        <p className="how-block-label">📥 How to Retrieve a File</p>
        <StepList steps={RETRIEVE_STEPS} />
      </div>

      {/* ── Platform Features ── */}
      <div className="features-section">
        <h3 className="section-label">✨ Why FYL-FLY?</h3>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AboutPanel;

import React from 'react';

const SEND_STEPS = [
  { icon: '📁', title: 'Pick a File', desc: 'Click the drop zone or drag any file in — up to 100 MB.' },
  { icon: '📧', title: 'Enter Email', desc: 'Add the recipient\'s email address to authenticate the upload.' },
  { icon: '⬆️', title: 'Send It', desc: 'Hit "Send File" — your file is uploaded instantly and also can send note.' },
  { icon: '🔑', title: 'Get Code', desc: 'A unique 6-character code appears — share it with the recipient.' },
];

const RETRIEVE_STEPS = [
  { icon: '🗝️', title: 'Have a Code?', desc: 'Switch to the Retrieve tab in the sidebar.' },
  { icon: '⌨️', title: 'Enter Code', desc: 'Type the 6-character code you received.' },
  { icon: '🔍', title: 'Find File', desc: 'Hit "Retrieve File" — the file info appears instantly.' },
  { icon: '⬇️', title: 'Download', desc: 'Click Download to save the file — or View to open it online.' },
];

function StepList({ steps }) {
  return (
    <div className="how-steps">
      {steps.map((step, i) => (
        <div className="how-step" key={i}>
          {/* connector line between steps */}
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
        <h2 className="panel-title">How to Use FYLFLY</h2>
      </div>

      {/* Send steps */}
      <div className="how-block">
        <p className="how-block-label">📤 Sending a File</p>
        <StepList steps={SEND_STEPS} />
      </div>

      {/* Retrieve steps */}
      <div className="how-block">
        <p className="how-block-label">📥 Retrieving a File</p>
        <StepList steps={RETRIEVE_STEPS} />
      </div>

      {/* Features (kept, no skills/bio) */}
      <div className="features-section">
        <h3 className="section-label">✨ Why FylShare?</h3>
        <div className="features-grid">
          {[
            { icon: '🔒', title: 'Secure Transfer', desc: 'Files are encrypted during upload and storage.' },
            { icon: '⚡', title: 'Instant Access', desc: 'Download-ready within seconds of upload.' },
            { icon: '🌐', title: 'Any Device', desc: 'Works on desktop, tablet, or mobile.' },
            { icon: '⏳', title: '3-Hour Expiry', desc: 'Files auto-delete — no clutter, no traces.' },
          ].map((f) => (
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

import React, { useState, useRef } from 'react';
import axios from 'axios';
import ExpiryToast from './ExpiryToast';
import { API_BASE_URL } from '../api';

const EXTRA_JOKES = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because he didn't Node how to Express himself." },
  { setup: "What do you call a file that's always on time?", punchline: "A .doc-u-ment!" },
  { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache." },
  { setup: "Why do programmers wear glasses?", punchline: "Because they don't C#!" },
  { setup: "There are 10 types of people in the world:", punchline: "Those who understand binary, and those who don't." },
  { setup: "A SQL query walks into a bar, walks up to two tables and asks...", punchline: "'Can I join you?'" },
  { setup: "Why did the computer keep freezing?", punchline: "It left too many Windows open!" },
  { setup: "Why was the mobile phone wearing glasses?", punchline: "Because it lost its contacts!" },
  { setup: "What do you call 8 hobbits?", punchline: "A hobbyte!" },
  { setup: "Why did the functions stop calling each other?", punchline: "Because they had too many arguments." },
  { setup: "How do you comfort a JavaScript bug?", punchline: "You console it!" },
];

function UploadPanel() {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'error'
  const [expiryTime, setExpiryTime] = useState(null);
  const [sentToEmail, setSentToEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { code, expiryTime, recipient, fileName, joke }
  const [copiedCode, setCopiedCode] = useState(false);
  const [jokeRevealed, setJokeRevealed] = useState(false);
  const [currentJoke, setCurrentJoke] = useState(null);
  const fileInputRef = useRef();

  // ── Helpers ─────────────────────────────────────────────

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        alert('File size exceeds the 200 MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        alert('File size exceeds the 200 MB limit.');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type) => {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📄';
  };

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleReset = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setExpiryTime(null);
    setShowToast(false);
    setRecipient('');
    setMessage('');
    setUploadResult(null);
    setJokeRevealed(false);
    setCopiedCode(false);
  };

  const handleCopyCode = () => {
    if (!uploadResult?.code) return;
    navigator.clipboard.writeText(`FYL-${uploadResult.code}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleNextJoke = (e) => {
    e.stopPropagation();
    const otherJokes = EXTRA_JOKES.filter(j => j.setup !== currentJoke?.setup);
    const next = otherJokes[Math.floor(Math.random() * otherJokes.length)];
    setCurrentJoke(next);
    setJokeRevealed(false);
  };

  // ── Upload Handler ───────────────────────────────────────

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!recipient.trim() || !isValidEmail(recipient)) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('email', recipient.trim());
    if (message.trim()) formData.append('message', message.trim());

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData);
      const data = response.data;
      const initialJoke = data.joke || EXTRA_JOKES[Math.floor(Math.random() * EXTRA_JOKES.length)];

      setUploadResult({
        code: data.code,
        expiryTime: data.expiryTime,
        recipient: recipient.trim(),
        fileName: selectedFile ? selectedFile.name : 'Your file',
        joke: initialJoke,
      });
      setCurrentJoke(initialJoke);
      setJokeRevealed(false);
      setCopiedCode(false);
      setSentToEmail(recipient.trim());
      setExpiryTime(data.expiryTime);
      setShowToast(true);
      setSelectedFile(null);
      setUploadStatus(null);
      setRecipient('');
      setMessage('');

    } catch (err) {
      console.error('Upload failed:', err.response?.data || err.message);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="panel upload-panel">
      <div className="panel-header">
        <h2 className="panel-title">{uploadResult ? 'Upload Complete' : 'Send a File'}</h2>
        <p className="panel-subtitle">
          {uploadResult
            ? 'Access code sent! Have a laugh while your friend retrieves the file.'
            : 'Upload a file and enter a valid email — get an OTP.'}
        </p>
      </div>

      {uploadResult ? (
        /* ── Upload Success Screen with Interactive Joke Card ── */
        <div className="upload-success-container">
          <div className="success-header-badge">
            <div className="success-check-circle">✓</div>
            <h3 className="success-title">File Uploaded & OTP Sent!</h3>
            <p className="success-subtitle">
              Access code emailed to <strong>{uploadResult.recipient}</strong>
            </p>
          </div>

          <div className="success-code-card">
            <span className="success-code-label">YOUR ACCESS CODE</span>
            <div className="success-code-row">
              <span className="success-code-text">FYL-{uploadResult.code}</span>
              <button
                type="button"
                className={`success-copy-btn ${copiedCode ? 'copied' : ''}`}
                onClick={handleCopyCode}
                title="Copy code to clipboard"
              >
                {copiedCode ? '✓ Copied' : '📋 Copy Code'}
              </button>
            </div>
            <p className="success-expiry-text">
              ⏳ Valid for 24 hours · Enter on the <strong>Retrieve</strong> tab to download
            </p>
          </div>

          {/* Interactive Tap-to-Reveal Joke Card */}
          {currentJoke && (
            <div className="interactive-joke-box">
              <div className="joke-box-top">
                <span className="joke-box-tag">😄 While your friend downloads this..</span>
                <button
                  type="button"
                  className="joke-shuffle-btn"
                  onClick={handleNextJoke}
                  title="Show another joke"
                >
                  🎲 Another Joke
                </button>
              </div>

              <p className="joke-box-setup">"{currentJoke.setup}"</p>

              {!jokeRevealed ? (
                <button
                  type="button"
                  className="joke-reveal-trigger"
                  onClick={() => setJokeRevealed(true)}
                >
                  <span className="reveal-sparkle">✨</span> Tap to reveal punchline
                </button>
              ) : (
                <div className="joke-revealed-punchline">
                  <p className="punchline-text">— {currentJoke.punchline}</p>
                  <span className="punchline-laugh">😂</span>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="send-another-file-btn"
            onClick={handleReset}
          >
            ⬆ Send Another File
          </button>
        </div>
      ) : (
        /* ── Standard Upload Form ── */
        <>
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !selectedFile && fileInputRef.current.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden-input" onChange={handleFileInput} />
            {!selectedFile ? (
              <div className="drop-content">
                <div className="drop-icon">
                  <img src={require('../upload-logo.png')} alt="Upload" className="upload-logo-img" />
                </div>
                <p className="drop-text">Drop your file here</p>
                <p className="drop-hint">or <span className="link-text">click to browse</span></p>
                <p className="drop-formats">Any format • Max 200 MB</p>
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-preview-icon">{getFileIcon(selectedFile.type)}</div>
                <div className="file-preview-info">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-meta">{formatSize(selectedFile.size)} · {selectedFile.type || 'Unknown type'}</p>
                </div>
                <button className="remove-btn" onClick={(e) => { e.stopPropagation(); handleReset(); }}>✕</button>
              </div>
            )}
          </div>

          <div className="send-form">
            <div className="form-group">
              <label className="form-label">Email required<span style={{ color: '#e05c5c' }}>*</span></label>
              <input
                type="email"
                className="form-input"
                placeholder="abc@gmail.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Message (optional)</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Add a friendly note"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              className={`send-btn ${(!selectedFile || !recipient.trim()) ? 'disabled' : ''} ${uploadStatus === 'uploading' ? 'loading' : ''} ${uploadStatus === 'error' ? 'error' : ''}`}
              onClick={handleSend}
              disabled={!selectedFile || !recipient.trim() || uploadStatus === 'uploading'}
            >
              {uploadStatus === 'uploading' && <span className="btn-spinner" />}
              {uploadStatus === 'error' ? '❌ Upload Failed' : uploadStatus === 'uploading' ? 'Uploading...' : '⬆ Send File'}
            </button>
          </div>
        </>
      )}

      {/* ── Expiry Toast ── */}
      {showToast && expiryTime && (
        <ExpiryToast
          expiryTime={expiryTime}
          sentToEmail={sentToEmail}
          onDismiss={() => { setShowToast(false); }}
        />
      )}
    </div>
  );
}


export default UploadPanel;

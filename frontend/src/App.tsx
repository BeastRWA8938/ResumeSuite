import { useState, useEffect } from 'react';
import './App.css';

interface BackendHealth {
  status: string;
  service: string;
  version: string;
}

function App() {
  const [connection, setConnection] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendData, setBackendData] = useState<BackendHealth | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        if (!response.ok) {
          throw new Error('Backend returned invalid status');
        }
        const data = await response.json();
        setBackendData(data);
        setConnection('connected');
      } catch (error) {
        console.error('Failed to connect to backend API:', error);
        setConnection('disconnected');
      }
    };

    // Run connection check immediately
    checkConnection();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <svg className="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
          <h1>Career Intelligence System</h1>
        </div>
        <div className="status-badge-container">
          {connection === 'checking' && (
            <span className="badge checking">
              <span className="pulse-dot"></span> Checking API Connection...
            </span>
          )}
          {connection === 'connected' && (
            <span className="badge connected">
              <span className="pulse-dot"></span> Connected (v{backendData?.version})
            </span>
          )}
          {connection === 'disconnected' && (
            <span className="badge disconnected">
              <span className="pulse-dot"></span> API Offline
            </span>
          )}
        </div>
      </header>

      <main className="dashboard-content">
        <section className="intro-card">
          <h2>Welcome to your Career Vault</h2>
          <p>
            This is a private, local-first workspace. All your professional achievements, experiences, 
            projects, and skills are stored locally on your machine.
          </p>
          <div className="vault-status-summary">
            <div className="status-item">
              <span className="label">Database Type</span>
              <span className="value">SQLite (Serverless)</span>
            </div>
            <div className="status-item">
              <span className="label">Storage Location</span>
              <span className="value">/backend/database.db</span>
            </div>
            <div className="status-item">
              <span className="label">AI Model Provider</span>
              <span className="value">Google Gemini API</span>
            </div>
          </div>
        </section>

        {connection === 'disconnected' && (
          <div className="alert-banner error">
            <svg viewBox="0 0 24 24" className="alert-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="alert-text">
              <h3>Cannot connect to local backend API</h3>
              <p>Please verify that the Docker backend service is running and accessible on port 8000.</p>
            </div>
          </div>
        )}

        {connection === 'connected' && (
          <div className="alert-banner success">
            <svg viewBox="0 0 24 24" className="alert-icon" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div className="alert-text">
              <h3>System verified and ready</h3>
              <p>
                Successfully connected to the FastAPI container. You can now begin loading and structuring 
                your profile details.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>Local-First Career Intelligence System V1 &bull; Ported securely on 127.0.0.1</p>
      </footer>
    </div>
  );
}

export default App;

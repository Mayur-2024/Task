import React, { useState } from 'react';
import { api } from '../api/api';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await api.login({ email, password });
      } else {
        data = await api.register({ name, email, password });
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login for effortless interview testing!
  const handleQuickDemo = async (demoName, demoEmail) => {
    setError('');
    setLoading(true);
    try {
      // Try login first; if not registered, register automatically
      let data;
      try {
        data = await api.login({ email: demoEmail, password: 'password123' });
      } catch (err) {
        data = await api.register({
          name: demoName,
          email: demoEmail,
          password: 'password123',
        });
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">⚡</span>
            <h2>TaskPulse</h2>
          </div>
          <p className="auth-subtitle">Real-Time Agile Project Workspace</p>
        </div>

        {/* Tab Toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alice Freeman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Section (Great for Demos & Interviews!) */}
        <div className="demo-section">
          <div className="divider"><span>Or Quick Demo Login</span></div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickDemo('Alice Freeman', 'alice@taskpulse.com')}
              disabled={loading}
            >
              👤 Alice (Tech Lead)
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => handleQuickDemo('Bob Developer', 'bob@taskpulse.com')}
              disabled={loading}
            >
              👤 Bob (Developer)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

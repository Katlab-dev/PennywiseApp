import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      setSubmitting(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  // Reset password link is provided below; no inline reset here.

  return (
    <section className="auth page">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Welcome back. Please enter your details.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="error" role="alert" aria-live="polite">{error}</div>
          )}
          <button className="btn btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
          <div className="helper">
            Don’t have an account? <Link to="/register">Register</Link>
          </div>
          <div className="helper" style={{ marginTop: 6 }}>
            <Link to="/reset-password" className="link">Forgot Password?</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

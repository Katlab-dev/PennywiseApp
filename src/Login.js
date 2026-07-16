import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import CurrencyRain from './components/CurrencyRain';
import './pages/Auth.css';

export function getLoginErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    default:
      return 'Failed to sign in. Please try again.';
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      await login(normalizedEmail, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth auth--currency page">
      <CurrencyRain />
      <div className="auth-card login-card">
        <div className="login-card__brand" aria-hidden="true">R</div>
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Welcome back. Enter your details to continue.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={submitting}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={submitting}
              required
            />
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              disabled={submitting}
            />
            Show password
          </label>

          {error && <div className="error" role="alert" aria-live="polite">{error}</div>}

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

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export function getRegistrationErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 12 characters.';
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    default:
      return 'We could not create the account. Check your details or try signing in.';
  }
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 12) {
      setError('Use a stronger password with at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setSubmitting(true);
      await register(normalizedEmail, password);
      navigate('/');
    } catch (err) {
      setError(getRegistrationErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join PennyWise and start tracking today.</p>
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
              autoComplete="new-password"
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="error" role="alert" aria-live="polite">{error}</div>
          )}
          <button className="btn btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
          <div className="helper">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

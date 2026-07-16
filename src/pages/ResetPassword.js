import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setSubmitting(true);
      await resetPassword(normalizedEmail);
      setStatus('If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        setStatus('If an account exists for that email, a password reset link has been sent.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Unable to connect. Check your internet connection and try again.');
      } else if (err?.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait and try again.');
      } else {
        setError('We could not send the reset email. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth page">
      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">Enter your email and we’ll send a reset link.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          {status && <div style={{ color: '#065f46', fontSize: 13, marginTop: 8 }}>{status}</div>}
          <button className="btn btn--block" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <div className="helper" style={{ marginTop: 10 }}>
          <Link to="/login" className="link">Back to Login</Link>
        </div>
        <div className="helper" style={{ marginTop: 10 }}>
          For your security, PennyWise does not reveal whether an email address is registered.
        </div>
      </div>
    </section>
  );
}

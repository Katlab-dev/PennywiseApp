import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import './Auth.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    try {
      setSubmitting(true);
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setStatus('Password reset email sent. Please check your inbox.');
    } catch (err) {
      let msg = err?.message || 'Failed to send reset email';
      if (err?.code === 'auth/user-not-found') msg = 'No account found for this email.';
      if (err?.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      setError(msg);
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
          Tip: Ensure your app domain (e.g., localhost:3000) is in Firebase Auth → Authorized domains.
        </div>
      </div>
    </section>
  );
}

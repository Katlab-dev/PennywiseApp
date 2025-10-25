import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthLanding.css';

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <section className="auth-landing">
      <div className="auth-landing__card">
        <h1 className="auth-landing__title">Welcome to PennyWise 💸</h1>
        <p className="auth-landing__subtitle">Smart budgeting for students</p>
        <div className="auth-landing__actions">
          <button className="btn auth-landing__btn" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn--secondary auth-landing__btn" onClick={() => navigate('/register')}>Sign Up</button>
        </div>
      </div>
    </section>
  );
}


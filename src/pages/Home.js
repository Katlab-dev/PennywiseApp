import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <section className="home page">
      <div className="container">
        <div className="hero">
          <h1 className="hero-title">Welcome to PennyWise</h1>
          <p className="hero-subtitle">
            Track expenses, visualize spending, and stay on top of your budget with a clean, modern interface.
          </p>
          <div className="hero-actions">
            {/* Centered primary auth actions */}
            <Link className="btn" to="/login">Login</Link>
            <Link className="btn btn--ghost" to="/register">Sign Up</Link>
            <Link className="btn btn--secondary" to="/assistant">Ask Assistant</Link>
          </div>
        </div>

        <div className="home-grid">
          <article className="card">
            <h2 className="card-h">Simple Tracking</h2>
            <p className="card-p">Capture expenses quickly and keep your records tidy.</p>
          </article>
          <article className="card">
            <h2 className="card-h">Clear Insights</h2>
            <p className="card-p">See totals and balance at a glance on the Dashboard.</p>
          </article>
          <article className="card">
            <h2 className="card-h">Built to Grow</h2>
            <p className="card-p">Designed for future categories, filters, and reports.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

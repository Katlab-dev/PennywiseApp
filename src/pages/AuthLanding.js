import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  LockKeyhole,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import './AuthLanding.css';

const features = [
  { icon: WalletCards, tone: 'blue', title: 'Track every rand', text: 'Capture income and expenses in seconds, with categories and notes that keep your records useful.' },
  { icon: PieChart, tone: 'violet', title: 'See the full picture', text: 'Turn everyday transactions into clear cash-flow trends and spending insights you can act on.' },
  { icon: Target, tone: 'green', title: 'Plan with confidence', text: 'Set monthly budgets and savings goals, then follow your progress without spreadsheets.' },
  { icon: ShieldCheck, tone: 'amber', title: 'Private by design', text: 'Secure authentication and user-level database rules keep your financial information separated.' },
];

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <div className="pw-landing">
      <header className="pw-landing-nav" aria-label="PennyWise landing navigation">
        <a className="pw-landing-brand" href="#top" aria-label="PennyWise home">
          <span className="pw-landing-logo"><WalletCards size={21} /></span>
          <span>PennyWise</span>
        </a>
        <nav className="pw-landing-links" aria-label="Page sections">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#why-pennywise">Why PennyWise</a>
        </nav>
        <div className="pw-landing-actions">
          <button className="pw-link-button" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn pw-nav-cta" onClick={() => navigate('/register')}>Create account</button>
        </div>
      </header>

      <div id="top">
        <section className="pw-hero" aria-labelledby="pw-hero-title">
          <div className="pw-hero-copy">
            <div className="pw-eyebrow"><Sparkles size={15} /> Smarter money habits start here</div>
            <h1 id="pw-hero-title">Make every rand<br /><span>work with purpose.</span></h1>
            <p className="pw-hero-lead">A calm, intelligent way to track spending, build a budget, and reach your savings goals—all in one secure workspace.</p>
            <div className="pw-hero-actions">
              <button className="btn pw-primary-cta" onClick={() => navigate('/register')}>Start for free <ArrowRight size={17} /></button>
              <button className="btn btn--ghost pw-secondary-cta" onClick={() => navigate('/login')}>I already have an account</button>
            </div>
            <div className="pw-hero-proof" aria-label="Product benefits">
              <span><CheckCircle2 size={15} /> Free to start</span>
              <span><CheckCircle2 size={15} /> Secure sign-in</span>
              <span><CheckCircle2 size={15} /> Built for South Africa</span>
            </div>
          </div>

          <div className="pw-product-stage" aria-label="PennyWise dashboard preview">
            <div className="pw-glow pw-glow--one" />
            <div className="pw-glow pw-glow--two" />
            <div className="pw-preview-card">
              <div className="pw-preview-topbar">
                <div><span className="pw-preview-kicker">Overview</span><strong>My finances</strong></div>
                <span className="pw-preview-avatar">KM</span>
              </div>
              <div className="pw-balance-card">
                <span>Available balance</span>
                <strong>R 8,420.50</strong>
                <small><TrendingUp size={13} /> 12.4% from last month</small>
              </div>
              <div className="pw-mini-grid">
                <div className="pw-mini-stat"><span><TrendingUp size={14} /> Income</span><strong>R 12,800</strong></div>
                <div className="pw-mini-stat"><span><TrendingDown size={14} /> Spent</span><strong>R 4,379</strong></div>
              </div>
              <div className="pw-preview-chart">
                <div className="pw-preview-chart-head"><span>Cash flow</span><small>Last 6 months</small></div>
                <svg viewBox="0 0 420 118" role="img" aria-label="Example cash flow increasing over six months">
                  <defs><linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--finance-balance)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--finance-balance)" stopOpacity="0" /></linearGradient></defs>
                  <path className="pw-preview-gridline" d="M0 22H420M0 59H420M0 96H420" />
                  <path fill="url(#previewFill)" d="M0 91 C45 82,58 85,92 70 S145 48,180 63 S239 79,273 48 S330 57,365 27 S399 22,420 12 V118 H0Z" />
                  <path className="pw-preview-line" d="M0 91 C45 82,58 85,92 70 S145 48,180 63 S239 79,273 48 S330 57,365 27 S399 22,420 12" />
                </svg>
              </div>
            </div>
            <div className="pw-float-card pw-float-card--budget"><Target size={17} /><div><strong>Budget on track</strong><span>68% used this month</span></div></div>
            <div className="pw-float-card pw-float-card--alert"><Bell size={17} /><div><strong>Smart insight</strong><span>Food spend is down 14%</span></div></div>
          </div>
        </section>

        <section className="pw-metrics" id="why-pennywise" aria-label="PennyWise benefits">
          <div><strong>One view</strong><span>for your complete money picture</span></div>
          <div><strong>Real time</strong><span>updates across every transaction</span></div>
          <div><strong>100%</strong><span>focused on your financial clarity</span></div>
          <div><strong>Rands</strong><span>formatted for South African users</span></div>
        </section>

        <section className="pw-features" id="features" aria-labelledby="features-title">
          <div className="pw-section-heading">
            <span className="pw-section-label">Everything in one place</span>
            <h2 id="features-title">Simple enough for today.<br />Powerful enough for your goals.</h2>
            <p>PennyWise brings the essential parts of personal finance together without making money management feel like work.</p>
          </div>
          <div className="pw-feature-grid">
            {features.map(({ icon: Icon, tone, title, text }) => (
              <article className="pw-feature-card" key={title}>
                <span className={`pw-feature-icon pw-feature-icon--${tone}`}><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pw-security" id="security">
          <div className="pw-security-icon"><LockKeyhole size={28} /></div>
          <div><span className="pw-section-label">Security that stays out of your way</span><h2>Your finances remain yours.</h2><p>Every account is authenticated, and database access is restricted to the signed-in owner. Your records are never mixed with another user’s data.</p></div>
          <div className="pw-security-list"><span><CheckCircle2 size={17} /> Firebase Authentication</span><span><CheckCircle2 size={17} /> User-level access rules</span><span><CheckCircle2 size={17} /> Secure cloud persistence</span></div>
        </section>

        <section className="pw-final-cta">
          <div><span className="pw-section-label">Take control today</span><h2>A clearer financial future starts with one transaction.</h2><p>Create your free account and turn everyday money decisions into lasting progress.</p></div>
          <button className="btn pw-primary-cta" onClick={() => navigate('/register')}>Create your account <ArrowRight size={17} /></button>
        </section>
      </div>

      <footer className="pw-footer"><div className="pw-landing-brand"><span className="pw-landing-logo"><BarChart3 size={20} /></span><span>PennyWise</span></div><p>Thoughtful personal finance for everyday progress.</p><span>© 2026 PennyWise</span></footer>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import './AuthLanding.css';

const principles = [
  {
    icon: ReceiptText,
    number: '01',
    title: 'Capture the everyday',
    text: 'Record income and expenses quickly, with categories and notes that make every entry useful.',
  },
  {
    icon: PieChart,
    number: '02',
    title: 'See what is changing',
    text: 'Turn transactions into a clear picture of cash flow, spending patterns, and monthly progress.',
  },
  {
    icon: Target,
    number: '03',
    title: 'Give your money direction',
    text: 'Create budgets and savings goals that stay visible whenever you make a decision.',
  },
];

const transactions = [
  { name: 'Salary', category: 'Income', amount: '+ R 12,800', positive: true },
  { name: 'Groceries', category: 'Food', amount: '- R 846', positive: false },
  { name: 'Transport', category: 'Travel', amount: '- R 420', positive: false },
];

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <div className="pw-landing">
      <header className="pw-landing-nav" aria-label="PennyWise landing navigation">
        <a className="pw-landing-brand" href="#top" aria-label="PennyWise home">
          <span className="pw-landing-logo"><WalletCards size={19} strokeWidth={2.2} /></span>
          <span>PennyWise</span>
        </a>

        <nav className="pw-landing-links" aria-label="Page sections">
          <a href="#product">Product</a>
          <a href="#principles">Why PennyWise</a>
          <a href="#security">Security</a>
        </nav>

        <div className="pw-landing-actions">
          <button className="pw-link-button" onClick={() => navigate('/login')}>Sign in</button>
          <button className="pw-nav-cta" onClick={() => navigate('/register')}>
            Create account <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="pw-hero" aria-labelledby="pw-hero-title">
          <span className="pw-eyebrow"><i /> Personal finance for real life</span>
          <h1 id="pw-hero-title">Your money,<br />finally <em>in focus.</em></h1>
          <p className="pw-hero-lead">
            A considered way to track spending, shape a budget, and make progress toward the life you are building.
          </p>
          <div className="pw-hero-actions">
            <button className="pw-primary-cta" onClick={() => navigate('/register')}>
              Start with PennyWise <ArrowRight size={17} />
            </button>
            <button className="pw-secondary-cta" onClick={() => navigate('/login')}>I already have an account</button>
          </div>
          <div className="pw-hero-proof" aria-label="Product benefits">
            <span><Check size={14} /> Free account</span>
            <span><Check size={14} /> Secure sign-in</span>
            <span><Check size={14} /> Designed for rands</span>
          </div>
        </section>

        <section className="pw-product" id="product" aria-label="PennyWise product preview">
          <div className="pw-product-caption">
            <span>THE PENNYWISE OVERVIEW</span>
            <p>Everything important. Nothing distracting.</p>
          </div>

          <div className="pw-demo-shell">
            <div className="pw-demo-browser">
              <span /><span /><span />
              <p>Illustrative financial data</p>
            </div>

            <div className="pw-demo-layout">
              <aside className="pw-demo-sidebar" aria-hidden="true">
                <span className="pw-demo-mark"><WalletCards size={18} /></span>
                <div className="pw-demo-nav-icons">
                  <i className="active"><LayoutDashboard size={16} /></i>
                  <i><CircleDollarSign size={16} /></i>
                  <i><BarChart3 size={16} /></i>
                  <i><Target size={16} /></i>
                </div>
                <span className="pw-demo-avatar">KM</span>
              </aside>

              <div className="pw-demo-main">
                <div className="pw-demo-header">
                  <div><span>OVERVIEW</span><strong>Good morning, Kabelo.</strong></div>
                  <div className="pw-demo-month">July 2026 <span>⌄</span></div>
                </div>

                <div className="pw-demo-stats">
                  <article className="pw-demo-balance">
                    <span>Available balance</span>
                    <strong>R 8,420.50</strong>
                    <small><TrendingUp size={12} /> 12.4% from last month</small>
                  </article>
                  <article className="pw-demo-stat">
                    <span><i className="income"><TrendingUp size={13} /></i> Income</span>
                    <strong>R 12,800</strong>
                    <small>July total</small>
                  </article>
                  <article className="pw-demo-stat">
                    <span><i className="expense"><TrendingDown size={13} /></i> Expenses</span>
                    <strong>R 4,379</strong>
                    <small>R 621 below budget</small>
                  </article>
                </div>

                <div className="pw-demo-content">
                  <article className="pw-demo-chart-card">
                    <div className="pw-demo-card-head">
                      <div><strong>Cash flow</strong><span>Income and expenses</span></div>
                      <span>Last 6 months</span>
                    </div>
                    <div className="pw-demo-chart-wrap">
                      <div className="pw-demo-y-axis"><span>15k</span><span>10k</span><span>5k</span><span>0</span></div>
                      <svg viewBox="0 0 520 190" role="img" aria-label="Illustrative six-month cash-flow chart">
                        <defs>
                          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#356cd3" stopOpacity=".2" />
                            <stop offset="100%" stopColor="#356cd3" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path className="pw-chart-gridline" d="M0 18H520M0 70H520M0 122H520M0 174H520" />
                        <path fill="url(#incomeFill)" d="M0 137 C45 123,66 128,104 100 S174 79,208 92 S274 118,312 69 S382 74,416 42 S481 47,520 23 V190H0Z" />
                        <path className="pw-chart-income" d="M0 137 C45 123,66 128,104 100 S174 79,208 92 S274 118,312 69 S382 74,416 42 S481 47,520 23" />
                        <path className="pw-chart-expense" d="M0 151 C55 145,75 134,104 143 S169 119,208 132 S271 123,312 138 S377 108,416 120 S480 97,520 108" />
                      </svg>
                    </div>
                    <div className="pw-demo-x-axis"><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div>
                  </article>

                  <article className="pw-demo-activity">
                    <div className="pw-demo-card-head">
                      <div><strong>Recent activity</strong><span>Your latest entries</span></div>
                      <span>View all</span>
                    </div>
                    <div className="pw-demo-transactions">
                      {transactions.map((transaction) => (
                        <div className="pw-demo-transaction" key={transaction.name}>
                          <span className={transaction.positive ? 'positive' : ''}>{transaction.name.charAt(0)}</span>
                          <div><strong>{transaction.name}</strong><small>{transaction.category}</small></div>
                          <b className={transaction.positive ? 'positive' : ''}>{transaction.amount}</b>
                        </div>
                      ))}
                    </div>
                    <div className="pw-demo-budget">
                      <div><span>Monthly budget</span><strong>68%</strong></div>
                      <i><span /></i>
                      <small>R 3,400 of R 5,000 used</small>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pw-capability-rail" aria-label="PennyWise capabilities">
          <span>TRACK</span><i />
          <span>UNDERSTAND</span><i />
          <span>PLAN</span><i />
          <span>ADJUST</span><i />
          <span>PROGRESS</span>
        </div>

        <section className="pw-principles" id="principles" aria-labelledby="principles-title">
          <div className="pw-principles-intro">
            <span className="pw-section-label">A better financial routine</span>
            <h2 id="principles-title">Less admin.<br /><em>More intention.</em></h2>
            <p>PennyWise keeps the mechanics simple so you can spend more time making decisions—and less time organising data.</p>
          </div>

          <div className="pw-principle-list">
            {principles.map(({ icon: Icon, number, title, text }) => (
              <article className="pw-principle" key={title}>
                <span className="pw-principle-icon"><Icon size={20} /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
                <span className="pw-principle-number">{number}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="pw-security" id="security" aria-labelledby="security-title">
          <div className="pw-security-copy">
            <span className="pw-security-kicker"><LockKeyhole size={15} /> SECURITY BY DESIGN</span>
            <h2 id="security-title">Access belongs to the account owner.</h2>
            <p>
              Firebase Authentication verifies identity. Firestore Security Rules then compare that authenticated user ID with the requested record path before allowing access.
            </p>
            <div className="pw-security-points">
              <span><Check size={15} /> Authenticated access</span>
              <span><Check size={15} /> User-specific records</span>
              <span><Check size={15} /> Denied by default</span>
            </div>
          </div>

          <div className="pw-access-panel" aria-label="How access is protected">
            <div className="pw-access-heading"><span><ShieldCheck size={20} /></span><div><small>PROTECTED REQUEST</small><strong>Financial records</strong></div><i>Verified</i></div>
            <div className="pw-access-rule"><span><Fingerprint size={18} /></span><div><small>AUTHENTICATED ID</small><code>request.auth.uid</code></div></div>
            <div className="pw-access-line"><span>must match</span></div>
            <div className="pw-access-rule"><span><WalletCards size={18} /></span><div><small>RECORD OWNER</small><code>/users/{'{uid}'}/...</code></div></div>
            <div className="pw-access-result"><Check size={16} /><span>Access granted only when the IDs match</span></div>
          </div>
        </section>

        <section className="pw-final-cta">
          <span className="pw-section-label">YOUR NEXT CHAPTER</span>
          <h2>Put your money<br /><em>into perspective.</em></h2>
          <p>Start with one transaction. Build a clearer financial picture from there.</p>
          <button onClick={() => navigate('/register')}>Create your free account <ArrowRight size={17} /></button>
        </section>
      </main>

      <footer className="pw-footer">
        <div className="pw-landing-brand"><span className="pw-landing-logo"><WalletCards size={16} /></span><span>PennyWise</span></div>
        <p>Thoughtful personal finance for everyday progress.</p>
        <span>© 2026 PennyWise</span>
      </footer>
    </div>
  );
}

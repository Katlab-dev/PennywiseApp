import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import './TransactionPreview.css';

export default function TransactionPreview({ items }) {
  // TODO: Replace with recent transactions from context
  if (!items || items.length === 0) {
    return (
      <div className="card">
        <div className="tp-empty">No recent transactions.</div>
      </div>
    );
  }

  return (
    <div className="card tp-card">
      <div className="tp-header">Recent Activity</div>
      <ul className="tp-list">
        {items.slice(0, 3).map((t, idx) => (
          <li key={idx} className="tp-item">
            <div className="tp-left">
              <div className={`tp-type ${t.type === 'Income' ? 'inc' : 'exp'}`}>{t.type}</div>
              <div className="tp-title">{t.title}</div>
            </div>
            <div className="tp-right">
              <div className="tp-amount">{formatCurrency(t.amount)}</div>
              <div className="tp-date">{t.date}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


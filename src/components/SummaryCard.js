import React from 'react';
import './SummaryCard.css';
import { formatCurrency } from '../utils/formatCurrency';

export default function SummaryCard({ title, value }) {
  const config = title.toLowerCase().includes('income')
    ? { icon: '↗', variant: 'income', eyebrow: 'Money received' }
    : title.toLowerCase().includes('expense')
      ? { icon: '↘', variant: 'expense', eyebrow: 'Money spent' }
      : { icon: '＝', variant: 'balance', eyebrow: 'Available now' };

  return (
    <article className={`summary-card summary-card--${config.variant} card`}>
      <div className="summary-card__top">
        <div>
          <div className="card-title">{title}</div>
          <div className="summary-card__eyebrow">{config.eyebrow}</div>
        </div>
        <span className="summary-card__icon" aria-hidden>{config.icon}</span>
      </div>
      <div className="card-value" title={formatCurrency(value)}>{formatCurrency(value)}</div>
    </article>
  );
}

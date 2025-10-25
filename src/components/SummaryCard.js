import React from 'react';
import './SummaryCard.css';
import { formatCurrency } from '../utils/formatCurrency';

export default function SummaryCard({ title, value }) {
  // value is a number; format as currency
  return (
    <article className="summary-card card">
      <div className="card-title">{title}</div>
      <div className="card-value">{formatCurrency(value)}</div>
    </article>
  );
}

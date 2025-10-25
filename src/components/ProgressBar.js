import React from 'react';

export default function ProgressBar({ value = 0, max = 100, label, color = '#2b7cff' }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="progress">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="progress-meta">{pct.toFixed(0)}%</div>
    </div>
  );
}


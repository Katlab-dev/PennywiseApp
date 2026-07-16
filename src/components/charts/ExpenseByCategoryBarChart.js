import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { FinanceTooltip, formatCompactCurrency } from './chartFormatters';
import './Charts.css';

function formatCategoryLabel(value) {
  const label = String(value || 'Other');
  return label.length > 16 ? `${label.slice(0, 15)}…` : label;
}

export default function ExpenseByCategoryBarChart({ height = 220 }) {
  const { expenses } = useFinance();

  const data = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.category || 'Other';
      const curr = map.get(key) || { category: key, amount: 0 };
      curr.amount += Number(e.amount) || 0;
      map.set(key, curr);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  if (data.length === 0) {
    return <div className="chart-empty">Add expenses to see where your money goes.</div>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <defs><linearGradient id="categoryBarGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="var(--accent-primary)" /><stop offset="100%" stopColor="var(--chart-balance)" /></linearGradient></defs>
          <CartesianGrid horizontal={false} strokeDasharray="4 6" />
          <XAxis type="number" tickFormatter={formatCompactCurrency} />
          <YAxis type="category" dataKey="category" width={104} tickFormatter={formatCategoryLabel} />
          <Tooltip content={<FinanceTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
          <Bar dataKey="amount" name="Spent" fill="url(#categoryBarGradient)" radius={[0,8,8,0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FinanceTooltip, formatCompactCurrency } from './charts/chartFormatters';
import './charts/Charts.css';

function ym(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function TrendChart({ height = 240 }) {
  const { incomes, expenses } = useFinance();
  const data = useMemo(() => {
    const buckets = new Map();
    for (const i of incomes) {
      const key = ym(i.date);
      if (!key) continue;
      const v = buckets.get(key) || { month: key, income: 0, expense: 0 };
      v.income += Number(i.amount) || 0;
      buckets.set(key, v);
    }
    for (const e of expenses) {
      const key = ym(e.date);
      if (!key) continue;
      const v = buckets.get(key) || { month: key, income: 0, expense: 0 };
      v.expense += Number(e.amount) || 0;
      buckets.set(key, v);
    }
    return Array.from(buckets.values()).sort((a, b) => (a.month > b.month ? 1 : -1));
  }, [incomes, expenses]);

  if (!data.length) return <div className="chart-empty">Your monthly trend will appear after you add transactions.</div>;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 8 }} barGap={4}>
          <CartesianGrid vertical={false} strokeDasharray="4 6" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis tickFormatter={formatCompactCurrency} width={58} />
          <Tooltip content={<FinanceTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
          <Legend iconType="circle" iconSize={8} />
          <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[6,6,2,2]} maxBarSize={32} />
          <Bar dataKey="expense" name="Expenses" fill="var(--chart-expense)" radius={[6,6,2,2]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

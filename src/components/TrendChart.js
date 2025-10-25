import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

  if (!data.length) return <div style={{ color: '#6b7280' }}>No data yet</div>;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#16a34a" radius={[6,6,0,0]} />
          <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


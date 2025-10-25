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
    return <div style={{ color: '#6b7280' }}>Add expenses to see category breakdown.</div>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
          <XAxis dataKey="category" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="amount" name="Amount" fill="#3b82f6" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


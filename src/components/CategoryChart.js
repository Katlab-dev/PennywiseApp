import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CategoryChart({ height = 240 }) {
  const { expenses } = useFinance();
  const data = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.category || 'Other';
      const curr = map.get(key) || { name: key, value: 0 };
      curr.value += Number(e.amount) || 0;
      map.set(key, curr);
    }
    return Array.from(map.values()).filter((d) => d.value > 0);
  }, [expenses]);

  if (!data.length) return <div style={{ color: '#6b7280' }}>No data yet</div>;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={`slice-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}


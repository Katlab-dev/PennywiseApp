import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { FinanceTooltip } from './charts/chartFormatters';
import { formatCurrency } from '../utils/formatCurrency';
import './charts/Charts.css';

const COLORS = ['var(--chart-balance)', 'var(--chart-income)', 'var(--chart-expense)', '#7fa7e7', '#e4bd57', '#9b1f33'];

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
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length) return <div className="chart-empty">Category insights will appear after your first expense.</div>;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={78} innerRadius={52} paddingAngle={3} cornerRadius={5}>
            {data.map((entry, index) => (
              <Cell key={`slice-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" fill="var(--muted)" fontSize="11">TOTAL SPENT</text>
          <text x="50%" y="49%" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="14" fontWeight="700">{formatCurrency(total)}</text>
          <Tooltip content={<FinanceTooltip />} />
          <Legend iconType="circle" iconSize={8} verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

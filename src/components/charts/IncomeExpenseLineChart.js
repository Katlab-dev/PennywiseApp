import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

function formatDateLabel(dateStr) {
  try {
    const d = new Date(dateStr);
    return Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(d);
  } catch {
    return dateStr;
  }
}

export default function IncomeExpenseLineChart({ height = 220 }) {
  const { incomes, expenses } = useFinance();

  const data = useMemo(() => {
    // Aggregate by date
    const map = new Map();
    for (const i of incomes) {
      if (!i.date) continue;
      const key = i.date;
      const curr = map.get(key) || { date: key, income: 0, expense: 0 };
      curr.income += Number(i.amount) || 0;
      map.set(key, curr);
    }
    for (const e of expenses) {
      if (!e.date) continue;
      const key = e.date;
      const curr = map.get(key) || { date: key, income: 0, expense: 0 };
      curr.expense += Number(e.amount) || 0;
      map.set(key, curr);
    }
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [incomes, expenses]);

  if (data.length === 0) {
    return <div style={{ color: '#6b7280' }}>Add transactions to see the chart.</div>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip labelFormatter={formatDateLabel} />
          <Legend />
          <Line type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


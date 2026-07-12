import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { FinanceTooltip, formatCompactCurrency } from './chartFormatters';
import './Charts.css';

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
    return <div className="chart-empty">Add transactions to reveal your cash-flow trend.</div>;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-income)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--chart-income)" stopOpacity={0.01} /></linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-expense)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--chart-expense)" stopOpacity={0.01} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 6" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} fontSize={12} />
          <YAxis tickFormatter={formatCompactCurrency} width={58} />
          <Tooltip content={<FinanceTooltip labelFormatter={formatDateLabel} />} cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }} />
          <Legend iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="income" name="Income" stroke="var(--chart-income)" strokeWidth={2.5} fill="url(#incomeGradient)" activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--surface)' }} />
          <Area type="monotone" dataKey="expense" name="Expenses" stroke="var(--chart-expense)" strokeWidth={2.5} fill="url(#expenseGradient)" activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--surface)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

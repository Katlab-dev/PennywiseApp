import React, { useMemo } from 'react';
import IncomeExpenseLineChart from '../components/charts/IncomeExpenseLineChart';
import ExpenseByCategoryBarChart from '../components/charts/ExpenseByCategoryBarChart';
import { useFinance } from '../context/FinanceContext';
import { ymFromDate } from '../utils/calculateBudgets';

export default function Reports() {
  const { incomes, expenses } = useFinance();
  const monthly = useMemo(() => {
    const map = new Map(); // YYYY-MM -> { income, expense }
    for (const i of incomes) {
      const k = ymFromDate(i.date);
      if (!k) continue;
      const v = map.get(k) || { income: 0, expense: 0 };
      v.income += Number(i.amount) || 0;
      map.set(k, v);
    }
    for (const e of expenses) {
      const k = ymFromDate(e.date);
      if (!k) continue;
      const v = map.get(k) || { income: 0, expense: 0 };
      v.expense += Number(e.amount) || 0;
      map.set(k, v);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([k, v]) => ({ month: k, income: v.income, expense: v.expense, net: v.income - v.expense }));
  }, [incomes, expenses]);
  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Reports & Charts</h1>
        <p className="page-subtitle">Visualize trends and spending categories.</p>
      </header>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="page-title" style={{ fontSize: 18, marginBottom: 8 }}>Monthly Summary</h2>
        {monthly.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No data yet</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'right' }}>Income</th>
                  <th style={{ textAlign: 'right' }}>Expenses</th>
                  <th style={{ textAlign: 'right' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((r) => (
                  <tr key={r.month}>
                    <td>{r.month}</td>
                    <td style={{ textAlign: 'right' }}>{r.income.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{r.expense.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{r.net.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="reports-grid">
        <div className="card chart-card">
          <div className="chart-card__header">
            <div><h2>Income vs expenses</h2><p>Daily movement across your account</p></div>
          </div>
          <IncomeExpenseLineChart height={270} />
        </div>
        <div className="card chart-card">
          <div className="chart-card__header">
            <div><h2>Expenses by category</h2><p>Categories ranked by total spend</p></div>
          </div>
          <ExpenseByCategoryBarChart height={270} />
        </div>
      </div>
    </section>
  );
}

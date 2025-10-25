import React, { useMemo } from 'react';
import './Dashboard.css';
import SummaryCard from '../components/SummaryCard';
import TransactionPreview from '../components/TransactionPreview';
import IncomeExpenseLineChart from '../components/charts/IncomeExpenseLineChart';
import CategoryChart from '../components/CategoryChart';
import TrendChart from '../components/TrendChart';
import ProgressBar from '../components/ProgressBar';
import { monthKey, categorySumsThisMonth, totalExpensesThisMonth, sumByMonth } from '../utils/calculateBudgets';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

export default function Dashboard() {
  const { totals, incomes, expenses, budget } = useFinance();
  const { totalIncome, totalExpenses, balance } = totals;

  const recent = useMemo(() => {
    const all = [
      ...incomes.map((i) => ({ ...i, type: 'Income' })),
      ...expenses.map((e) => ({ ...e, type: 'Expense' })),
    ];
    return all
      .filter((t) => t.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [incomes, expenses]);

  return (
    <section className="dashboard page">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your finances at a glance.</p>
      </header>

      <div className="summary-grid">
        <SummaryCard title="Total Income" value={totalIncome} />
        <SummaryCard title="Total Expenses" value={totalExpenses} />
        <SummaryCard title="Balance" value={balance} />
      </div>

      <div className="quick-actions">
        <Link className="btn" to="/add-expense">Add Expense</Link>
        <Link className="btn btn--secondary" to="/income">Add Income</Link>
        <Link className="btn btn--ghost" to="/history">View History</Link>
      </div>

      {/* Budget progress */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h2 className="page-title" style={{ fontSize: 18, marginBottom: 8 }}>Budget Overview</h2>
        {budget?.total > 0 ? (
          <>
            <ProgressBar label={`Total budget used (${budget.total})`} value={totalExpensesThisMonth(expenses)} max={budget.total} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {Object.entries(budget.categories || {}).filter(([, v]) => Number(v) > 0).map(([cat, max]) => {
                const used = categorySumsThisMonth(expenses).get(cat) || 0;
                return (
                  <ProgressBar key={cat} label={`${cat} (${used} / ${max})`} value={used} max={Number(max)} color="#111827" />
                );
              })}
            </div>
            {totalExpensesThisMonth(expenses) > budget.total && (
              <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>Alert: You exceeded your total budget this month.</div>
            )}
          </>
        ) : (
          <div style={{ color: '#6b7280' }}>No budget set. Set one on the Budget page.</div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="left-col">
          {recent.length > 0 ? (
            <TransactionPreview items={recent} />
          ) : (
            <div className="card" style={{ color: '#6b7280' }}>No transactions yet.</div>
          )}
          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ margin: '0 0 6px' }}>Spending by Category</h3>
            <CategoryChart height={220} />
          </div>
        </div>
        <div className="right-col">
          <div className="card" style={{ height: 260 }}>
            <IncomeExpenseLineChart height={220} />
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ margin: '0 0 6px' }}>Monthly Trends</h3>
            <TrendChart height={220} />
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="page-title" style={{ fontSize: 18, marginBottom: 6 }}>Smart Insights</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#374151' }}>
          {(() => {
            const mk = monthKey();
            const sums = categorySumsThisMonth(expenses, mk);
            if (sums.size > 0) {
              const top = Array.from(sums.entries()).sort((a, b) => b[1] - a[1])[0];
              return <li>You spent most on {top[0]} this month.</li>;
            }
            return <li>No spending yet this month.</li>;
          })()}
          {(() => {
            const byMonth = sumByMonth(expenses);
            const now = monthKey();
            const d = new Date();
            d.setMonth(d.getMonth() - 1);
            const prev = monthKey(d);
            const a = byMonth.get(prev) || 0;
            const b = byMonth.get(now) || 0;
            if (a === 0 && b === 0) return <li>Start adding transactions to see trends.</li>;
            if (a === 0) return <li>Spending started this month.</li>;
            const change = a ? ((b - a) / a) * 100 : 0;
            const sign = change >= 0 ? 'increased' : 'decreased';
            return <li>Spending {sign} {Math.abs(change).toFixed(0)}% vs last month.</li>;
          })()}
        </ul>
      </div>
    </section>
  );
}

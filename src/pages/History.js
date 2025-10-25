import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useFinance } from '../context/FinanceContext';

export default function History() {
  const { loading, incomes, expenses, deleteTransaction } = useFinance();
  const rows = useMemo(() => {
    const all = [
      ...incomes.map((i) => ({ ...i, type: 'Income' })),
      ...expenses.map((e) => ({ ...e, type: 'Expense' })),
    ];
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [incomes, expenses]);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">Your past transactions at a glance.</p>
      </header>

      {loading ? (
        <div className="card" style={{ color: '#6b7280' }}>Loading your data…</div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="placeholder">
                  <td colSpan={6}>No data yet. Add your first item to see it here.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.type}</td>
                    <td>{r.title}</td>
                    <td>{r.category}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(r.amount)}</td>
                    <td>{r.date}</td>
                    <td>
                      <button
                        className="btn btn--ghost"
                        onClick={() => {
                          if (window.confirm('Delete this item?')) {
                            deleteTransaction(r.id, r.type);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

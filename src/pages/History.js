import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useFinance } from '../context/FinanceContext';
import TransactionEditor from '../components/TransactionEditor';

export default function History() {
  const { loading, incomes, expenses, deleteTransaction, updateExpense, updateIncome } = useFinance();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pendingDeleteKey, setPendingDeleteKey] = useState('');
  const [deletingKey, setDeletingKey] = useState('');
  const rows = useMemo(() => {
    const all = [
      ...incomes.map((i) => ({ ...i, kind: 'income', type: 'Income' })),
      ...expenses.map((e) => ({ ...e, kind: 'expense', type: 'Expense' })),
    ];
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [incomes, expenses]);

  async function handleDelete(transaction) {
    const key = `${transaction.kind}:${transaction.id}`;
    if (deletingKey) return;
    try {
      setError('');
      setStatus('');
      setDeletingKey(key);
      await deleteTransaction(transaction.id, transaction.kind);
      if (editing?.id === transaction.id && editing?.kind === transaction.kind) {
        setEditing(null);
      }
      setPendingDeleteKey((current) => (current === key ? '' : current));
      setStatus(`${transaction.type} deleted.`);
    } catch (deleteError) {
      const sessionIssue = deleteError?.code === 'permission-denied'
        || deleteError?.code === 'unauthenticated';
      setError(sessionIssue
        ? 'Your session could not authorize this deletion. Sign in again and retry.'
        : 'We could not delete this transaction. Check your connection and retry.');
    } finally {
      setDeletingKey((current) => (current === key ? '' : current));
    }
  }

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
          {error && <div className="error" role="alert" style={{ marginBottom: 10 }}>{error}</div>}
          {status && <div className="helper" role="status" style={{ marginBottom: 10 }}>{status}</div>}
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
                rows.map((r) => {
                  const transactionKey = `${r.kind}:${r.id}`;
                  const isConfirming = pendingDeleteKey === transactionKey;
                  const isDeleting = deletingKey === transactionKey;
                  return (
                    <tr key={transactionKey}>
                      <td>{r.type}</td>
                      <td>{r.title}</td>
                      <td>{r.category}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(r.amount)}</td>
                      <td>{r.date}</td>
                      <td>
                        <div className="transaction-actions">
                          {isConfirming ? (
                            <>
                              <button
                                type="button"
                                className="btn btn--ghost"
                                disabled={isDeleting}
                                aria-label={`Cancel deleting ${r.type.toLowerCase()} ${r.title}`}
                                onClick={() => setPendingDeleteKey('')}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger"
                                disabled={isDeleting}
                                aria-label={`Confirm delete ${r.type.toLowerCase()} ${r.title}`}
                                onClick={() => handleDelete(r)}
                              >
                                {isDeleting ? 'Deleting…' : 'Confirm delete'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn--ghost"
                                disabled={Boolean(deletingKey)}
                                aria-label={`Edit ${r.type.toLowerCase()} ${r.title}`}
                                onClick={() => { setError(''); setStatus(''); setEditing(r); }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost"
                                disabled={Boolean(deletingKey)}
                                aria-label={`Delete ${r.type.toLowerCase()} ${r.title}`}
                                onClick={() => {
                                  setError('');
                                  setStatus('');
                                  setPendingDeleteKey(transactionKey);
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <TransactionEditor
        transaction={editing}
        onCancel={() => setEditing(null)}
        onSave={async (patch) => {
          if (editing.type === 'Income') await updateIncome(editing.id, patch);
          else await updateExpense(editing.id, patch);
          setEditing(null);
        }}
      />
    </section>
  );
}

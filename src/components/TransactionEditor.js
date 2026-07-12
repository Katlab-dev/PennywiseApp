import React, { useEffect, useState } from 'react';
import './TransactionEditor.css';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Rent', 'Other'];

export default function TransactionEditor({ transaction, onSave, onCancel }) {
  const isIncome = transaction?.type === 'Income';
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setTitle(transaction.title || '');
    setAmount(String(transaction.amount ?? ''));
    setCategory(transaction.category || 'Other');
    setDate(transaction.date || '');
    setNotes(transaction.notes || '');
    setError('');
  }, [transaction]);

  if (!transaction) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!title.trim() || !amount || !date) {
      setError(`Please enter ${isIncome ? 'a source' : 'a title'}, amount, and date.`);
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        amount: Number(amount),
        category: isIncome ? '-' : category,
        date,
        notes: notes.trim(),
      });
    } catch (err) {
      setError(err?.message || 'Failed to update transaction.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel();
    }}>
      <section className="transaction-editor" role="dialog" aria-modal="true" aria-labelledby="transaction-editor-title">
        <header className="transaction-editor__header">
          <div>
            <h2 id="transaction-editor-title">Edit {isIncome ? 'Income' : 'Expense'}</h2>
            <p>Update the transaction details below.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close editor" onClick={onCancel} disabled={saving}>×</button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="edit-title">{isIncome ? 'Source' : 'Title'}</label>
            <input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required autoFocus />
          </div>

          <div className="transaction-editor__grid">
            <div className="form-field">
              <label htmlFor="edit-amount">Amount</label>
              <input id="edit-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </div>
            <div className="form-field">
              <label htmlFor="edit-date">Date</label>
              <input id="edit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </div>
          </div>

          {!isIncome && (
            <div className="form-field">
              <label htmlFor="edit-category">Category</label>
              <select id="edit-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {Array.from(new Set([...EXPENSE_CATEGORIES, category])).map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="edit-notes">Notes (optional)</label>
            <textarea id="edit-notes" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
          </div>

          {error && <div className="error" role="alert">{error}</div>}

          <div className="transaction-editor__actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

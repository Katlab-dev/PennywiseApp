import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import {
  CORE_EXPENSE_CATEGORIES,
  getCustomExpenseCategorySuggestions,
  resolveExpenseCategory,
} from '../utils/expenseCategories';

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense, expenses = [], budget = { categories: {} } } = useFinance();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const customCategorySuggestions = useMemo(
    () => getCustomExpenseCategorySuggestions(
      expenses,
      Object.keys(budget?.categories || {})
    ),
    [expenses, budget]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !amount || !date) {
      setError('Please fill in Expense name, Amount, and Date.');
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    try {
      await addExpense({
        title: title.trim(),
        amount: Number(amount),
        category: resolveExpenseCategory(category, customCategory, customCategorySuggestions),
        date,
        notes: notes.trim(),
      });
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Failed to save expense.');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Add Expense</h1>
        <p className="page-subtitle">Record a purchase and organise it with a standard or custom category.</p>
      </header>

      <form className="card" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="title">Expense name</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bread and milk" maxLength={120} required />
          <small className="form-hint">Enter the specific item or purchase.</small>
        </div>

        <div className="form-field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 25.50" required />
        </div>

        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CORE_EXPENSE_CATEGORIES.map((item) => (
              <option key={item} value={item}>{item === 'Other' ? 'Other / custom' : item}</option>
            ))}
          </select>
        </div>

        {category === 'Other' && (
          <div className="form-field">
            <label htmlFor="custom-category">Custom category (optional)</label>
            <input
              id="custom-category"
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Takeaways, Groove or School supplies"
              maxLength={60}
              list="custom-category-suggestions"
              aria-describedby="custom-category-hint"
            />
            <datalist id="custom-category-suggestions">
              {customCategorySuggestions.map((item) => <option key={item} value={item} />)}
            </datalist>
            <small className="form-hint" id="custom-category-hint">
              This replaces “Other” as the saved category. Leave it blank to save as Other.
            </small>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-field">
          <label htmlFor="notes">Notes (optional)</label>
          <input id="notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bought veggies and fruits" maxLength={500} />
        </div>

        {error && (
          <div className="error" role="alert" aria-live="polite">{error}</div>
        )}

        <button className="btn btn--block" type="submit">Submit Expense</button>
      </form>
    </section>
  );
}

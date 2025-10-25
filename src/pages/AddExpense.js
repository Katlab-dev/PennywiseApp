import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

export default function AddExpense() {
  const navigate = useNavigate();
  const { addExpense } = useFinance();
  // TODO: Integrate with FinanceContext dispatch later
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title || !amount || !date) {
      setError('Please fill in Title, Amount, and Date.');
      return;
    }
    addExpense({ title, amount: Number(amount), category, date, notes });
    navigate('/');
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Add Expense</h1>
        <p className="page-subtitle">Record a new expense entry.</p>
      </header>

      <form className="card" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Groceries" required />
        </div>

        <div className="form-field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 25.50" required />
        </div>

        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Food</option>
            <option>Transport</option>
            <option>Rent</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-field">
          <label htmlFor="notes">Notes (optional)</label>
          <input id="notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bought veggies and fruits" />
        </div>

        {error && (
          <div className="error" role="alert" aria-live="polite">{error}</div>
        )}

        <button className="btn btn--block" type="submit">Submit Expense</button>
      </form>
    </section>
  );
}

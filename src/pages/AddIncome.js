import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

export default function AddIncome() {
  const navigate = useNavigate();
  const { addIncome } = useFinance();
  // TODO: Integrate with FinanceContext dispatch later
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!source || !amount || !date) {
      setError('Please fill in Source, Amount, and Date.');
      return;
    }
    addIncome({ title: source, amount: Number(amount), date, notes, category: '-' });
    navigate('/');
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Add Income</h1>
        <p className="page-subtitle">Record your income (bursary, job, allowance).</p>
      </header>

      <form className="card" style={{ maxWidth: 640, margin: '0 auto' }} onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="source">Source</label>
          <input id="source" type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Bursary" required />
        </div>

        <div className="form-field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 200.00" required />
        </div>

        <div className="form-field">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-field">
          <label htmlFor="notes">Notes (optional)</label>
          <input id="notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. First bursary payment" />
        </div>

        {error && (
          <div className="error" role="alert" aria-live="polite">{error}</div>
        )}

        <button className="btn btn--block" type="submit">Submit Income</button>
      </form>
    </section>
  );
}

import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import ProgressBar from '../components/ProgressBar';
import { totalExpensesThisMonth, categorySumsThisMonth } from '../utils/calculateBudgets';

export default function Budget() {
  const { budget, setBudget, expenses } = useFinance();
  const [total, setTotal] = useState(String(budget?.total || ''));
  const [cats, setCats] = useState({
    Food: String(budget?.categories?.Food || ''),
    Transport: String(budget?.categories?.Transport || ''),
    Rent: String(budget?.categories?.Rent || ''),
    Other: String(budget?.categories?.Other || ''),
  });

  function handleSubmit(e) {
    e.preventDefault();
    const catNums = Object.fromEntries(
      Object.entries(cats).map(([k, v]) => [k, Number(v) || 0])
    );
    setBudget(Number(total) || 0, catNums);
    alert('Budget saved');
  }

  const usedTotal = totalExpensesThisMonth(expenses);
  const usedCats = categorySumsThisMonth(expenses);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Budget Planning</h1>
        <p className="page-subtitle">Plan your monthly spending and allocations.</p>
      </header>
      <form className="card" onSubmit={handleSubmit} noValidate>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Set monthly budget</h2>
        <div className="form-field">
          <label htmlFor="total">Total budget</label>
          <input id="total" type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 5000" />
        </div>
        <h3 style={{ margin: '6px 0' }}>Category limits (optional)</h3>
        {Object.keys(cats).map((k) => (
          <div className="form-field" key={k}>
            <label htmlFor={`c_${k}`}>{k}</label>
            <input id={`c_${k}`} type="number" value={cats[k]} onChange={(e) => setCats({ ...cats, [k]: e.target.value })} placeholder="e.g. 1200" />
          </div>
        ))}

        <button className="btn" type="submit">Save Budget</button>
      </form>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>This month usage</h2>
        {Number(budget?.total) > 0 ? (
          <ProgressBar label={`Total (${usedTotal} / ${budget.total})`} value={usedTotal} max={Number(budget.total)} />
        ) : (
          <div style={{ color: '#6b7280' }}>No total budget set.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8 }}>
          {Object.entries(budget?.categories || {}).filter(([, v]) => Number(v) > 0).map(([cat, max]) => {
            const used = usedCats.get(cat) || 0;
            return <ProgressBar key={cat} label={`${cat} (${used} / ${max})`} value={used} max={Number(max)} color="#111827" />;
          })}
        </div>
      </div>
    </section>
  );
}

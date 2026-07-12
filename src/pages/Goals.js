import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import ProgressBar from '../components/ProgressBar';

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const list = Array.isArray(goals) ? goals : [];
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [progressEdits, setProgressEdits] = useState({});
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !target) return;
    setError('');
    try {
      await addGoal({ title, target: Number(target) || 0, current: 0, deadline });
      setTitle('');
      setTarget('');
      setDeadline('');
    } catch (err) {
      setError(err?.message || 'Failed to add goal.');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Savings Goals</h1>
        <p className="page-subtitle">Set and track your savings progress.</p>
      </header>

      <form className="card" onSubmit={handleSubmit} noValidate>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Create a goal</h2>
        <div className="form-field">
          <label htmlFor="g_title">Goal title</label>
          <input id="g_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New phone" />
        </div>
        <div className="form-field">
          <label htmlFor="g_target">Target amount</label>
          <input id="g_target" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 8000" />
        </div>
        <div className="form-field">
          <label htmlFor="g_deadline">Deadline (optional)</label>
          <input id="g_deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn" type="submit">Add Goal</button>
      </form>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Your goals</h2>
        {list.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No goals yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {list.map((g) => {
              const progress = g.target > 0 ? Math.min(Number(g.current) || 0, g.target) : 0;
              return (
                <div key={g.id} className="goal-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <strong>{g.title}</strong>
                      {g.deadline && (
                        <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 12 }}>Due {g.deadline}</span>
                      )}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>Target: {g.target}</div>
                  </div>
                  <ProgressBar value={progress} max={g.target || 1} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <label htmlFor={`curr_${g.id}`} style={{ fontSize: 13, color: '#374151' }}>Current saved</label>
                    <input
                      id={`curr_${g.id}`}
                      type="number"
                      value={progressEdits[g.id] ?? g.current ?? 0}
                      onChange={(e) => setProgressEdits({ ...progressEdits, [g.id]: e.target.value })}
                      style={{ maxWidth: 140, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    />
                    <button type="button" className="btn" onClick={async () => {
                      try {
                        setError('');
                        await updateGoal(g.id, { current: Number(progressEdits[g.id] ?? g.current ?? 0) });
                      } catch (err) {
                        setError(err?.message || 'Failed to update goal.');
                      }
                    }}>Save</button>
                    <button type="button" className="btn btn--ghost" onClick={async () => {
                      if (!window.confirm('Delete goal?')) return;
                      try {
                        setError('');
                        await deleteGoal(g.id);
                      } catch (err) {
                        setError(err?.message || 'Failed to delete goal.');
                      }
                    }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

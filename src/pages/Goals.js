import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import ProgressBar from '../components/ProgressBar';
import { formatCurrency } from '../utils/formatCurrency';
import { calculateGoalContribution } from '../utils/goalContributions';
import './Goals.css';

export default function Goals() {
  const { goals, addGoal, contributeToGoal, deleteGoal } = useFinance();
  const list = Array.isArray(goals) ? goals : [];
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contributions, setContributions] = useState({});
  const [goalFeedback, setGoalFeedback] = useState({});
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyGoalId, setBusyGoalId] = useState('');

  async function handleCreateGoal(event) {
    event.preventDefault();
    setCreateError('');

    const cleanTitle = title.trim();
    const targetAmount = Number(target);
    if (!cleanTitle) {
      setCreateError('Enter a name for your savings goal.');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setCreateError('Target amount must be a positive number.');
      return;
    }

    try {
      setCreating(true);
      await addGoal({
        title: cleanTitle,
        target: targetAmount,
        current: 0,
        deadline,
      });
      setTitle('');
      setTarget('');
      setDeadline('');
    } catch (error) {
      setCreateError(error?.message || 'Failed to add goal.');
    } finally {
      setCreating(false);
    }
  }

  function updateContribution(goalId, value) {
    setContributions((current) => ({ ...current, [goalId]: value }));
    setGoalFeedback((current) => {
      if (!current[goalId]) return current;
      const next = { ...current };
      delete next[goalId];
      return next;
    });
  }

  async function handleContribution(event, goal) {
    event.preventDefault();
    const amount = contributions[goal.id] ?? '';
    let preview;

    try {
      preview = calculateGoalContribution(goal.current ?? 0, goal.target, amount);
    } catch (error) {
      setGoalFeedback((current) => ({
        ...current,
        [goal.id]: { type: 'error', text: error?.message || 'Enter a valid amount.' },
      }));
      return;
    }

    try {
      setBusyGoalId(goal.id);
      setGoalFeedback((current) => {
        const next = { ...current };
        delete next[goal.id];
        return next;
      });
      const result = await contributeToGoal(goal.id, preview.contribution);
      const savedTotal = result?.nextCurrent ?? preview.nextCurrent;
      setContributions((current) => ({ ...current, [goal.id]: '' }));
      setGoalFeedback((current) => ({
        ...current,
        [goal.id]: {
          type: 'success',
          text: `Added ${formatCurrency(preview.contribution)}. Total saved: ${formatCurrency(savedTotal)}.`,
        },
      }));
    } catch (error) {
      setGoalFeedback((current) => ({
        ...current,
        [goal.id]: { type: 'error', text: error?.message || 'Failed to add money to the goal.' },
      }));
    } finally {
      setBusyGoalId('');
    }
  }

  async function handleDeleteGoal(goal) {
    if (!window.confirm(`Delete the goal “${goal.title}”?`)) return;

    try {
      setBusyGoalId(goal.id);
      await deleteGoal(goal.id);
    } catch (error) {
      setGoalFeedback((current) => ({
        ...current,
        [goal.id]: { type: 'error', text: error?.message || 'Failed to delete goal.' },
      }));
    } finally {
      setBusyGoalId('');
    }
  }

  return (
    <section className="page goals-page">
      <header className="page-header">
        <h1 className="page-title">Savings Goals</h1>
        <p className="page-subtitle">Build each goal one contribution at a time.</p>
      </header>

      <form className="card goals-create" onSubmit={handleCreateGoal} noValidate>
        <div className="goals-section-heading">
          <div>
            <h2>Create a goal</h2>
            <p>Choose what you are saving for and the amount you want to reach.</p>
          </div>
        </div>

        <div className="goals-create__fields">
          <div className="form-field">
            <label htmlFor="g_title">Goal name</label>
            <input
              id="g_title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. New laptop"
              maxLength={120}
            />
          </div>
          <div className="form-field">
            <label htmlFor="g_target">Target amount</label>
            <input
              id="g_target"
              type="number"
              inputMode="decimal"
              min="0.01"
              max="1000000000"
              step="0.01"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="e.g. 8000"
            />
          </div>
          <div className="form-field">
            <label htmlFor="g_deadline">Deadline (optional)</label>
            <input
              id="g_deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>
        </div>

        {createError && <div className="error" role="alert">{createError}</div>}
        <div className="goals-create__actions">
          <span>Your new goal starts at {formatCurrency(0)} saved.</span>
          <button className="btn" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create goal'}
          </button>
        </div>
      </form>

      <section className="card goals-list" aria-labelledby="your-goals-heading">
        <div className="goals-section-heading">
          <div>
            <h2 id="your-goals-heading">Your goals</h2>
            <p>Every amount you add is added to the money already saved.</p>
          </div>
          {list.length > 0 && <span className="goals-list__count">{list.length} {list.length === 1 ? 'goal' : 'goals'}</span>}
        </div>

        {list.length === 0 ? (
          <div className="goals-empty">
            <strong>No savings goals yet</strong>
            <span>Create your first goal above, then add money whenever you save.</span>
          </div>
        ) : (
          <div className="goals-grid">
            {list.map((goal) => {
              const targetAmount = Number(goal.target) || 0;
              const savedAmount = Math.max(0, Math.min(Number(goal.current) || 0, targetAmount));
              const remainingAmount = Math.max(0, targetAmount - savedAmount);
              const completed = targetAmount > 0 && savedAmount >= targetAmount;
              const feedback = goalFeedback[goal.id];
              const busy = busyGoalId === goal.id;

              return (
                <article key={goal.id} className={`goal-item${completed ? ' goal-item--complete' : ''}`}>
                  <div className="goal-item__header">
                    <div>
                      <div className="goal-item__title-row">
                        <h3>{goal.title}</h3>
                        {completed && <span className="goal-item__badge">Goal reached</span>}
                      </div>
                      {goal.deadline && <p className="goal-item__deadline">Due {goal.deadline}</p>}
                    </div>
                    <span className="goal-item__target">Target {formatCurrency(targetAmount)}</span>
                  </div>

                  <ProgressBar
                    value={savedAmount}
                    max={targetAmount || 1}
                    label={`${formatCurrency(savedAmount)} saved of ${formatCurrency(targetAmount)}`}
                  />

                  <dl className="goal-item__metrics">
                    <div>
                      <dt>Saved so far</dt>
                      <dd>{formatCurrency(savedAmount)}</dd>
                    </div>
                    <div>
                      <dt>Still needed</dt>
                      <dd>{formatCurrency(remainingAmount)}</dd>
                    </div>
                  </dl>

                  {completed ? (
                    <div className="goal-item__complete-message">You have reached this savings target.</div>
                  ) : (
                    <form className="goal-contribution" onSubmit={(event) => handleContribution(event, goal)} noValidate>
                      <div className="form-field">
                        <label htmlFor={`goal-contribution-${goal.id}`}>Add money to this goal</label>
                        <input
                          id={`goal-contribution-${goal.id}`}
                          aria-label={`Amount to add to ${goal.title}`}
                          aria-describedby={`goal-contribution-hint-${goal.id}`}
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          max={remainingAmount}
                          step="0.01"
                          value={contributions[goal.id] ?? ''}
                          onChange={(event) => updateContribution(goal.id, event.target.value)}
                          placeholder="Enter this contribution"
                          disabled={busy}
                        />
                        <small id={`goal-contribution-hint-${goal.id}`} className="form-hint">
                          This will be added to {formatCurrency(savedAmount)} already saved.
                        </small>
                      </div>
                      <button className="btn goal-contribution__button" type="submit" disabled={busy}>
                        {busy ? 'Adding…' : 'Add money'}
                      </button>
                    </form>
                  )}

                  {feedback && (
                    <div
                      className={feedback.type === 'error' ? 'goal-item__feedback goal-item__feedback--error' : 'goal-item__feedback'}
                      role={feedback.type === 'error' ? 'alert' : 'status'}
                    >
                      {feedback.text}
                    </div>
                  )}

                  <div className="goal-item__footer">
                    <button
                      type="button"
                      className="goal-item__delete"
                      onClick={() => handleDeleteGoal(goal)}
                      disabled={busy}
                    >
                      Delete goal
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import ProgressBar from '../components/ProgressBar';
import { formatCurrency } from '../utils/formatCurrency';
import {
  MAX_BUDGET_CATEGORIES,
  prepareBudgetCategories,
} from '../utils/budgetCategories';
import {
  totalExpensesThisMonth,
  budgetCategorySumsThisMonth,
} from '../utils/calculateBudgets';
import './Budget.css';

function rowsFromCategories(categories = {}) {
  return Object.entries(categories)
    .filter(([, limit]) => Number(limit) > 0)
    .map(([name, limit], index) => ({
      id: `saved-budget-category-${index}`,
      name,
      limit: String(limit),
    }));
}

export default function Budget() {
  const { budget, setBudget, expenses } = useFinance();
  const nextRowId = useRef(0);
  const [total, setTotal] = useState(String(budget?.total || ''));
  const [categoryRows, setCategoryRows] = useState(
    () => rowsFromCategories(budget?.categories)
  );
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTotal(String(budget?.total || ''));
    setCategoryRows(rowsFromCategories(budget?.categories));
  }, [budget]);

  const allocatedTotal = useMemo(
    () => categoryRows.reduce((sum, row) => sum + (Number(row.limit) || 0), 0),
    [categoryRows]
  );
  const usedTotal = totalExpensesThisMonth(expenses);
  const usedCategories = budgetCategorySumsThisMonth(
    expenses,
    budget?.categories || {}
  );
  const savedCategories = Object.entries(budget?.categories || {})
    .filter(([, limit]) => Number(limit) > 0);

  function addCategory() {
    if (categoryRows.length >= MAX_BUDGET_CATEGORIES) return;
    const id = `new-budget-category-${nextRowId.current}`;
    nextRowId.current += 1;
    setCategoryRows((current) => [...current, { id, name: '', limit: '' }]);
    setStatus('');
    setError('');
  }

  function updateCategory(id, field, value) {
    setCategoryRows((current) => current.map((row) => (
      row.id === id ? { ...row, [field]: value } : row
    )));
    setStatus('');
    setError('');
  }

  function removeCategory(id) {
    setCategoryRows((current) => current.filter((row) => row.id !== id));
    setStatus('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');
    setError('');

    const totalAmount = total === '' ? 0 : Number(total);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      setError('Total budget must be a valid non-negative amount.');
      return;
    }

    try {
      const categories = prepareBudgetCategories(categoryRows);
      setSaving(true);
      await setBudget(totalAmount, categories);
      setStatus('Budget saved.');
    } catch (err) {
      setError(err?.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page budget-page">
      <header className="page-header">
        <h1 className="page-title">Budget Planning</h1>
        <p className="page-subtitle">Create the categories that fit your life and set a monthly limit for each one.</p>
      </header>

      <form className="card budget-builder" onSubmit={handleSubmit} noValidate>
        <div className="budget-builder__heading">
          <div>
            <h2>Build your monthly budget</h2>
            <p>Add only the spending categories you want to track.</p>
          </div>
          <div className="budget-builder__allocation" aria-live="polite">
            <span>Category limits</span>
            <strong>{formatCurrency(allocatedTotal)}</strong>
          </div>
        </div>

        <div className="form-field budget-builder__total">
          <label htmlFor="total">Total monthly budget (optional)</label>
          <input
            id="total"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={total}
            onChange={(event) => setTotal(event.target.value)}
            placeholder="e.g. 5000"
          />
          <small className="form-hint">Use this for your overall monthly spending limit.</small>
        </div>

        <div className="budget-builder__categories-header">
          <div>
            <h3>Your budget categories</h3>
            <p>Category names match expenses by name.</p>
          </div>
          <button
            className="btn btn--ghost budget-builder__add"
            type="button"
            onClick={addCategory}
            disabled={categoryRows.length >= MAX_BUDGET_CATEGORIES || saving}
          >
            <span aria-hidden="true">+</span> Add budget category
          </button>
        </div>

        {categoryRows.length === 0 ? (
          <div className="budget-builder__empty">
            <strong>No category limits yet</strong>
            <span>Press “Add budget category” to create your first one.</span>
          </div>
        ) : (
          <div className="budget-builder__rows">
            {categoryRows.map((row, index) => (
              <div className="budget-category-row" key={row.id}>
                <span className="budget-category-row__number" aria-hidden="true">{index + 1}</span>
                <div className="form-field">
                  <label htmlFor={`budget-category-name-${row.id}`}>Category name</label>
                  <input
                    id={`budget-category-name-${row.id}`}
                    aria-label={`Category name ${index + 1}`}
                    type="text"
                    value={row.name}
                    onChange={(event) => updateCategory(row.id, 'name', event.target.value)}
                    placeholder="e.g. Groove"
                    maxLength={60}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`budget-category-limit-${row.id}`}>Monthly limit</label>
                  <input
                    id={`budget-category-limit-${row.id}`}
                    aria-label={`Monthly limit ${index + 1}`}
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={row.limit}
                    onChange={(event) => updateCategory(row.id, 'limit', event.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
                <button
                  className="budget-category-row__remove"
                  type="button"
                  onClick={() => removeCategory(row.id)}
                  aria-label={`Remove ${row.name || `category ${index + 1}`}`}
                  disabled={saving}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="budget-builder__matching-note">
          Use the same category name when adding an expense. Renaming a budget category does not rename earlier expenses.
        </p>

        {error && <div className="error" role="alert">{error}</div>}
        {status && <div className="budget-builder__status" role="status">{status}</div>}

        <div className="budget-builder__actions">
          <span>{categoryRows.length} of {MAX_BUDGET_CATEGORIES} categories</span>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Budget'}
          </button>
        </div>
      </form>

      <div className="card budget-usage">
        <div className="budget-usage__heading">
          <div>
            <h2>This month’s usage</h2>
            <p>Expense categories are matched to the limits you created.</p>
          </div>
        </div>

        {Number(budget?.total) > 0 && (
          <ProgressBar
            label={`Total (${usedTotal} / ${budget.total})`}
            value={usedTotal}
            max={Number(budget.total)}
          />
        )}

        {savedCategories.map(([category, limit]) => {
          const used = usedCategories.get(category) || 0;
          return (
            <ProgressBar
              key={category}
              label={`${category} (${used} / ${limit})`}
              value={used}
              max={Number(limit)}
              color="#111827"
            />
          );
        })}

        {Number(budget?.total) <= 0 && savedCategories.length === 0 && (
          <div className="budget-usage__empty">No budget limits have been saved yet.</div>
        )}
      </div>
    </section>
  );
}

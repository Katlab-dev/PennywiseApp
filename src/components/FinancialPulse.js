import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Sparkles, Target } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { monthKey, ymFromDate } from '../utils/calculateBudgets';
import './FinancialPulse.css';

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export default function FinancialPulse({ totals, incomes, expenses, budget }) {
  const pulse = useMemo(() => {
    const currentMonth = monthKey();
    const monthlyIncome = incomes.reduce((sum, item) => (
      ymFromDate(item.date) === currentMonth ? sum + (Number(item.amount) || 0) : sum
    ), 0);
    const monthlyExpenses = expenses.reduce((sum, item) => (
      ymFromDate(item.date) === currentMonth ? sum + (Number(item.amount) || 0) : sum
    ), 0);
    const hasActivity = monthlyIncome > 0 || monthlyExpenses > 0;
    const cashFlowRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : monthlyExpenses > 0 ? -100 : 0;
    const score = hasActivity ? Math.round(clamp(55 + cashFlowRate * 0.45)) : 0;
    const savingsRate = totals.totalIncome > 0
      ? Math.round(clamp((totals.balance / totals.totalIncome) * 100, -100, 100))
      : 0;
    const budgetRemaining = Number(budget?.total) > 0
      ? Math.round(clamp(100 - (monthlyExpenses / Number(budget.total)) * 100))
      : null;

    let status = 'Ready when you are';
    let insight = 'Add income and expenses to unlock your personal money momentum.';
    if (score >= 80) {
      status = 'Excellent momentum';
      insight = 'You are keeping a healthy gap between money in and money out this month.';
    } else if (score >= 60) {
      status = 'Strong and steady';
      insight = 'Your cash flow is moving in the right direction—keep protecting the gap.';
    } else if (score >= 40) {
      status = 'Finding your rhythm';
      insight = 'Small spending adjustments could create more breathing room this month.';
    } else if (hasActivity) {
      status = 'Room to reset';
      insight = 'Expenses are putting pressure on this month’s cash flow. Your budget can help.';
    }

    return { monthlyIncome, monthlyExpenses, score, savingsRate, budgetRemaining, status, insight };
  }, [totals, incomes, expenses, budget]);

  return (
    <section className="financial-pulse" aria-labelledby="financial-pulse-title">
      <span className="financial-pulse__orb financial-pulse__orb--one" aria-hidden="true" />
      <span className="financial-pulse__orb financial-pulse__orb--two" aria-hidden="true" />
      <div className="financial-pulse__copy">
        <div className="financial-pulse__label"><Sparkles size={15} /> PennyWise Pulse</div>
        <h2 id="financial-pulse-title">{pulse.status}</h2>
        <p>{pulse.insight}</p>
        <div className="financial-pulse__flow">
          <span><ArrowUpRight size={15} /> This month in <strong>{formatCurrency(pulse.monthlyIncome)}</strong></span>
          <span><ArrowDownRight size={15} /> This month out <strong>{formatCurrency(pulse.monthlyExpenses)}</strong></span>
        </div>
      </div>

      <div
        className="financial-pulse__meter"
        style={{ '--pulse-score': `${pulse.score * 3.6}deg` }}
        role="progressbar"
        aria-label="Money momentum score"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={pulse.score}
      >
        <div className="financial-pulse__meter-inner">
          <strong>{pulse.score}</strong>
          <span>momentum</span>
        </div>
      </div>

      <div className="financial-pulse__metrics">
        <div>
          <span>Overall savings rate</span>
          <strong>{pulse.savingsRate}%</strong>
        </div>
        <div>
          <span><Target size={13} /> Budget remaining</span>
          <strong>{pulse.budgetRemaining == null ? 'Not set' : `${pulse.budgetRemaining}%`}</strong>
        </div>
      </div>
    </section>
  );
}

import { formatCurrency } from './formatCurrency';
import { monthKey } from './calculateBudgets';
import {
  AssistantFinanceInternals,
  buildSafeFinancialSummary,
  calculateGoalProgress,
} from './assistantFinanceSummary';
import { CORE_EXPENSE_CATEGORIES } from './expenseCategories';

// Exact personal-finance figures are answered locally. Gemini receives only the
// separate aggregate summary created by buildSafeFinancialSummary.

function normalize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function includesPhrase(text, phrase) {
  const escaped = normalize(phrase).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Boolean(escaped) && new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(normalize(text));
}

function referenceDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatPercentage(value) {
  const percentage = Number(value) || 0;
  return `${Number(percentage.toFixed(1))}%`;
}

function sumByCategoryThisMonth(expenses, category, now = new Date()) {
  const currentMonth = monthKey(referenceDate(now));
  const requestedCategory = normalize(category);

  return (Array.isArray(expenses) ? expenses : []).reduce((total, expense) => {
    const expenseCategory = normalize(expense?.category || 'Other');
    if (
      AssistantFinanceInternals.monthFromStoredDate(expense?.date) !== currentMonth
      || expenseCategory !== requestedCategory
    ) {
      return total;
    }
    return total + (Number(expense?.amount) || 0);
  }, 0);
}

function totalIncomeThisMonth(incomes, now = new Date()) {
  const currentMonth = monthKey(referenceDate(now));
  return (Array.isArray(incomes) ? incomes : []).reduce((total, income) => {
    if (AssistantFinanceInternals.monthFromStoredDate(income?.date) !== currentMonth) return total;
    return total + (Number(income?.amount) || 0);
  }, 0);
}

function topSpendingCategoryThisMonth(expenses, now = new Date()) {
  const currentMonth = monthKey(referenceDate(now));
  const categories = new Map();

  for (const expense of Array.isArray(expenses) ? expenses : []) {
    if (AssistantFinanceInternals.monthFromStoredDate(expense?.date) !== currentMonth) continue;
    const label = String(expense?.category || 'Other').trim() || 'Other';
    const key = normalize(label);
    const current = categories.get(key) || { category: label, amount: 0 };
    current.amount += Number(expense?.amount) || 0;
    categories.set(key, current);
  }

  return [...categories.values()].sort((left, right) => right.amount - left.amount)[0] || null;
}

function detectCategoryFromQuery(query, expenses = [], budget = {}) {
  const normalizedQuery = normalize(query);
  const sourceCandidates = [
    ...CORE_EXPENSE_CATEGORIES,
    ...Object.keys(budget?.categories || {}),
    ...(Array.isArray(expenses) ? expenses : []).map((expense) => expense?.category),
  ];
  const candidates = [...new Map(sourceCandidates
    .filter((category) => normalize(category))
    .map((category) => [normalize(category), String(category).trim()]))
    .values()]
    .sort((left, right) => normalize(right).length - normalize(left).length);

  for (const category of candidates) {
    const normalizedCategory = normalize(category);
    if (normalizedCategory && includesPhrase(normalizedQuery, normalizedCategory)) {
      return { label: category, normalized: normalizedCategory };
    }
  }

  return null;
}

function findCategoryLimit(budget, category) {
  const match = Object.entries(budget?.categories || {}).find(
    ([key]) => normalize(key) === normalize(category)
  );
  return Number(match?.[1]) || 0;
}

function hasUnsupportedPeriod(query) {
  return /\b(?:last|previous|next)\s+(?:day|week|month|quarter|year)\b/.test(query)
    || /\b(?:last|past|previous|next)\s+\d+\s+(?:days?|weeks?|months?|quarters?|years?)\b/.test(query)
    || /\b(?:yesterday|today|tomorrow|this week|this weekend|last weekend|this quarter|this year|year to date|ytd)\b/.test(query)
    || /\b(?:last|this|previous)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(query)
    || /\b\d+\s+(?:days?|weeks?|months?|years?)\s+ago\b/.test(query)
    || /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:days?|weeks?|months?|years?)\s+ago\b/.test(query)
    || /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(query)
    || /\b(?:19|20)\d{2}\b/.test(query)
    || /\b\d{4}-(?:0[1-9]|1[0-2])(?:-\d{2})?\b/.test(query)
    || /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(query);
}

function isAdviceQuestion(query) {
  return /\b(?:how can|how do|should|tips?|advice|improve|increase|reduce|lower|manage|plan|help|ways? to|stop)\b/.test(query);
}

function budgetAnswer(metric, label, daysRemaining) {
  if (metric.limit === 0) {
    return `You have not set a ${label.toLowerCase()} yet. You have spent ${formatCurrency(metric.spent)} this month.`;
  }

  const usage = formatPercentage(metric.usagePercent);
  if (metric.overspent > 0) {
    return `You have spent ${formatCurrency(metric.spent)} of your ${formatCurrency(metric.limit)} ${label.toLowerCase()} this month (${usage}). You are over by ${formatCurrency(metric.overspent)}.`;
  }

  return `You have spent ${formatCurrency(metric.spent)} of your ${formatCurrency(metric.limit)} ${label.toLowerCase()} this month (${usage}). ${formatCurrency(metric.remaining)} remains, which is about ${formatCurrency(metric.suggestedDailyRemaining)} per day for the ${daysRemaining} days remaining, including today.`;
}

function categoryBudgetMetrics(expenses, budget, now, daysRemaining) {
  return Object.entries(budget?.categories || {})
    .filter(([, limit]) => Number(limit) > 0)
    .map(([category, limit]) => ({
      category,
      ...AssistantFinanceInternals.budgetMetrics(
        Number(limit),
        sumByCategoryThisMonth(expenses, category, now),
        daysRemaining
      ),
    }));
}

function overspendingAnswer(summary, categoryMetrics) {
  const categoryOverages = categoryMetrics.filter((item) => item.overspent > 0);
  const categoryText = categoryOverages.length > 0
    ? ` Over-limit categories: ${categoryOverages.map((item) => `${item.category} by ${formatCurrency(item.overspent)}`).join('; ')}.`
    : ' None of your configured category budgets are over their limits.';

  if (!summary.budget.configured) {
    return `You have not set a total monthly budget.${categoryText}`;
  }

  if (summary.budget.overspent > 0) {
    return `You have spent ${formatCurrency(summary.budget.spent)} against a ${formatCurrency(summary.budget.limit)} monthly budget and are over by ${formatCurrency(summary.budget.overspent)}.${categoryText}`;
  }

  return `You are within your total monthly budget, with ${formatCurrency(summary.budget.remaining)} remaining.${categoryText}`;
}

function goalAnswer(goal, index, now) {
  const progress = calculateGoalProgress(goal, now);
  const title = String(goal?.title || '').trim() || `Goal ${index + 1}`;

  if (progress.target === 0) {
    return `${title} does not have a valid target yet.`;
  }

  if (progress.completed) {
    return `${title}: ${formatCurrency(progress.current)} of ${formatCurrency(progress.target)} saved (${formatPercentage(progress.progressPercent)}). This goal is complete.`;
  }

  let deadline = '';
  if (progress.deadlineStatus === 'overdue') deadline = ' Its deadline has passed.';
  else if (progress.deadlineStatus === 'today') deadline = ' Its deadline is today.';
  else if (progress.daysUntilDeadline > 0) deadline = ` It has ${progress.daysUntilDeadline} days until its deadline.`;

  return `${title}: ${formatCurrency(progress.current)} of ${formatCurrency(progress.target)} saved (${formatPercentage(progress.progressPercent)}), with ${formatCurrency(progress.remainingAmount)} remaining.${deadline}`;
}

function detectNamedGoal(query, goals) {
  const normalizedQuery = normalize(query);
  return [...(Array.isArray(goals) ? goals : [])]
    .filter((goal) => normalize(goal?.title).length >= 2)
    .sort((left, right) => normalize(right?.title).length - normalize(left?.title).length)
    .find((goal) => {
    const title = normalize(goal?.title);
    return includesPhrase(normalizedQuery, title);
    });
}

export function answerFinanceQuery(
  query,
  {
    incomes = [],
    expenses = [],
    totals = { totalIncome: 0, totalExpenses: 0, balance: 0 },
    budget = {},
    goals = [],
  } = {},
  nowValue = new Date()
) {
  const q = normalize(query);
  const now = referenceDate(nowValue);
  const summary = buildSafeFinancialSummary({ expenses, budget, goals }, now);
  const categoryMetrics = categoryBudgetMetrics(
    expenses,
    budget,
    now,
    summary.period.daysRemainingIncludingToday
  );
  const asksForAdvice = isAdviceQuestion(q);
  const immediateAdvice = asksForAdvice
    && /\b(?:today|tomorrow)\b/.test(q)
    && !hasUnsupportedPeriod(q.replace(/\b(?:today|tomorrow)\b/g, ''));

  if (
    hasUnsupportedPeriod(q)
    && !immediateAdvice
    && /\b(?:balance|budgets?|spend|spent|spending|expenses?|income|earned?|goals?|savings?)\b/.test(q)
  ) {
    return 'I can calculate current balance, current-month figures, or all-time totals here. For another period, open History or Reports and use the recorded dates.';
  }

  const asksForBalance = /^balance[?.!]*$/.test(q)
    || /\b(?:my|current|total|available)\s+(?:account\s+)?balance\b/.test(q)
    || /\b(?:what(?:'s| is)|show|tell)\s+(?:me\s+)?my\s+balance\b/.test(q)
    || /\bhow much money do i have\b/.test(q);

  if (asksForBalance && !asksForAdvice) {
    return `Your current balance is ${formatCurrency(totals?.balance || 0)}.`;
  }

  if (/\b(?:show|list|view|find|recent)\b.*\btransactions?\b/.test(q)) {
    return 'Open History to view your transactions. Transaction names and notes stay inside PennyWise and are never sent to Gemini.';
  }

  const namedGoal = detectNamedGoal(q, goals);
  const asksForGoalProgress = /\bgoals?\b/.test(q)
    && /\b(?:progress|status|target|saved|saving|remaining|left|complete|completed|reached|show|list|doing|how close|how are|what are)\b/.test(q);
  const asksAboutNamedGoal = Boolean(namedGoal)
    && /\b(?:progress|status|target|saved|saving|remaining|left|complete|completed|how close|doing)\b/.test(q);

  if ((asksForGoalProgress || asksAboutNamedGoal) && !asksForAdvice) {
    if (!Array.isArray(goals) || goals.length === 0) {
      return 'You do not have any savings goals yet. Open Goals to create one.';
    }

    if (namedGoal) {
      return goalAnswer(namedGoal, goals.indexOf(namedGoal), now);
    }

    const visibleGoals = goals.slice(0, 5).map((goal, index) => goalAnswer(goal, index, now));
    const remainder = goals.length > visibleGoals.length
      ? ` You have ${goals.length - visibleGoals.length} more goals in Goals.`
      : '';
    return `Your goal progress: ${visibleGoals.join(' ')}${remainder}`;
  }

  const category = detectCategoryFromQuery(q, expenses, budget);
  const asksAboutOverspending = /\b(?:overspending|over[- ]?spending|overspent|overspend|over budget|spending too much)\b/.test(q)
    && !asksForAdvice;
  const mentionsBudget = /\bbudgets?\b/.test(q);
  const asksForBudgetFigure = mentionsBudget
    && !asksForAdvice
    && !/\b(?:create|start|set up|work|rule)\b/.test(q)
    && (
      q === 'budget'
      || /\bmy budgets?\b/.test(q)
      || /\b(?:current|remaining|left|available|used|usage|spent|over|overspent|within|status|daily|per day|how much|show|check)\b/.test(q)
    );

  if (asksAboutOverspending || asksForBudgetFigure) {
    if (category) {
      const categoryMetric = AssistantFinanceInternals.budgetMetrics(
        findCategoryLimit(budget, category.label),
        sumByCategoryThisMonth(expenses, category.label, now),
        summary.period.daysRemainingIncludingToday
      );
      return budgetAnswer(
        categoryMetric,
        `${category.label} budget`,
        summary.period.daysRemainingIncludingToday
      );
    }

    if (/\bwhich\b.*\bcategor(?:y|ies)\b/.test(q)) {
      const overBudgetCategories = categoryMetrics.filter((item) => item.overspent > 0);
      if (overBudgetCategories.length === 0) {
        return 'None of your configured category budgets are over their limits this month.';
      }
      return `Over-budget categories: ${overBudgetCategories.map((item) => `${item.category} by ${formatCurrency(item.overspent)}`).join('; ')}.`;
    }

    if (asksAboutOverspending) return overspendingAnswer(summary, categoryMetrics);

    return budgetAnswer(
      summary.budget,
      'monthly budget',
      summary.period.daysRemainingIncludingToday
    );
  }

  const asksForMonthlyIncome = /\b(?:income this month|this month(?:'s)? income|monthly income)\b/.test(q);
  if (asksForMonthlyIncome && !asksForAdvice) {
    return `Your income this month is ${formatCurrency(totalIncomeThisMonth(incomes, now))}.`;
  }

  if (/\b(?:total|all[- ]time|overall) income\b/.test(q) && !asksForAdvice) {
    return `Your total recorded income is ${formatCurrency(totals?.totalIncome || 0)}.`;
  }

  if (/\b(?:highest spending category|top (?:spending )?category|most on)\b/.test(q) && !asksForAdvice) {
    const top = topSpendingCategoryThisMonth(expenses, now);
    if (top) {
      return `Your highest spending category this month is ${top.category} (${formatCurrency(top.amount)}).`;
    }
    return 'No spending has been recorded this month.';
  }

  const asksForCategorySpend = category && (
    /\b(?:how much|what)\b.*\b(?:spend|spent|spending)\s+on\b/.test(q)
    || /\b(?:my|monthly)\s+spending\s+on\b/.test(q)
  );
  if (asksForCategorySpend && !asksForAdvice) {
    const categorySpent = sumByCategoryThisMonth(expenses, category.label, now);
    if (categorySpent > 0) {
      return `You spent ${formatCurrency(categorySpent)} on ${category.label} this month.`;
    }
    return `I couldn't find any ${category.label} expenses this month.`;
  }

  const asksForSpending = /\bhow much\b.*\b(?:spent|spending|expenses?)\b/.test(q)
    || /\b(?:how much|what)\b.*\b(?:did|have) i spend\b/.test(q)
    || /\b(?:show|tell)\s+(?:me\s+)?my\s+(?:spending|expenses?)\b/.test(q)
    || /\bwhat(?:'s| is) my (?:spending|expenses?)\b/.test(q)
    || q === 'spending'
    || q === 'expenses'
    || /^total spent[?.!]*$/.test(q)
    || /\b(?:total|monthly|current) (?:spending|expenses?)\b/.test(q)
    || /\b(?:spending|expenses?) (?:this month|so far)\b/.test(q);
  if (asksForSpending && !asksForAdvice) {
    const asksAllTime = !/\bthis month\b/.test(q)
      && /\b(?:all[- ]time|overall|total (?:spent|spending|expenses?))\b/.test(q);
    if (asksAllTime) {
      return `Your total recorded spending is ${formatCurrency(totals?.totalExpenses || 0)}.`;
    }
    return `You have spent ${formatCurrency(summary.spending.totalThisMonth)} this month.`;
  }

  return null;
}

export const AIHelpers = {
  sumByCategoryThisMonth,
  totalIncomeThisMonth,
  topSpendingCategoryThisMonth,
};

import { monthKey } from './calculateBudgets';

export const MAX_SAFE_GOAL_SUMMARIES = 10;
export const MAX_SAFE_BUDGET_CATEGORIES = 12;

const MAX_SAFE_AMOUNT = 1_000_000_000_000;
const MAX_DEADLINE_DAYS = 36_500;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function safeAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return round(Math.min(amount, MAX_SAFE_AMOUNT));
}

function safeCount(value, max = 10_000) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) return 0;
  return Math.min(count, max);
}

function safePercentage(value, allowNull = false) {
  if (allowNull && value === null) return null;
  const percentage = Number(value);
  if (!Number.isFinite(percentage) || percentage < 0) return allowNull ? null : 0;
  return round(Math.min(percentage, 1_000_000_000), 1);
}

function referenceDate(value = new Date()) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function parseDateParts(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year
    || candidate.getUTCMonth() !== month - 1
    || candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function monthFromStoredDate(value) {
  const parts = parseDateParts(value);
  if (parts) return `${parts.year}-${String(parts.month).padStart(2, '0')}`;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : monthKey(date);
}

function normalizedCategory(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function safeBudgetCategoryEntries(budget) {
  const entries = [];
  const seen = new Set();

  for (const [name, rawLimit] of Object.entries(budget?.categories || {})) {
    if (entries.length >= MAX_SAFE_BUDGET_CATEGORIES) break;
    const normalizedName = normalizedCategory(name);
    const limit = safeAmount(rawLimit);
    if (!normalizedName || !limit || seen.has(normalizedName)) continue;
    seen.add(normalizedName);
    entries.push({ normalizedName, limit });
  }

  return entries;
}

function daysRemainingInMonth(now) {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return daysInMonth - now.getDate() + 1;
}

function budgetMetrics(limitValue, spentValue, daysRemaining) {
  const limit = safeAmount(limitValue);
  const spent = safeAmount(spentValue);

  if (limit === 0) {
    return {
      limit,
      spent,
      usagePercent: null,
      remaining: 0,
      overspent: 0,
      suggestedDailyRemaining: null,
    };
  }

  const remaining = round(Math.max(limit - spent, 0));
  const overspent = round(Math.max(spent - limit, 0));

  return {
    limit,
    spent,
    usagePercent: round((spent / limit) * 100, 1),
    remaining,
    overspent,
    suggestedDailyRemaining: round(remaining / Math.max(daysRemaining, 1)),
  };
}

function calendarDayDifference(dateValue, now) {
  const parts = parseDateParts(dateValue);
  if (!parts) return null;

  const target = Date.UTC(parts.year, parts.month - 1, parts.day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return clamp(Math.round((target - today) / 86_400_000), -MAX_DEADLINE_DAYS, MAX_DEADLINE_DAYS);
}

export function calculateGoalProgress(goal, now = new Date()) {
  const target = safeAmount(goal?.target);
  const current = safeAmount(goal?.current);
  const progressPercent = target > 0
    ? round(clamp((current / target) * 100, 0, 100), 1)
    : 0;
  const completed = progressPercent >= 100;
  const daysUntilDeadline = calendarDayDifference(goal?.deadline, referenceDate(now));

  let deadlineStatus = 'none';
  if (completed) deadlineStatus = 'complete';
  else if (daysUntilDeadline < 0) deadlineStatus = 'overdue';
  else if (daysUntilDeadline === 0) deadlineStatus = 'today';
  else if (daysUntilDeadline > 0) deadlineStatus = 'future';

  return {
    target,
    current,
    progressPercent,
    remainingPercent: round(100 - progressPercent, 1),
    remainingAmount: round(Math.max(target - current, 0)),
    completed,
    daysUntilDeadline,
    deadlineStatus,
  };
}

export function buildSafeFinancialSummary(
  { expenses = [], budget = {}, goals = [] } = {},
  nowValue = new Date()
) {
  const now = referenceDate(nowValue);
  const currentMonth = monthKey(now);
  const daysRemainingIncludingToday = daysRemainingInMonth(now);
  const budgetCategoryEntries = safeBudgetCategoryEntries(budget);
  const categorySpending = budgetCategoryEntries.map(() => 0);
  const categoryIndex = new Map(
    budgetCategoryEntries.map((entry, index) => [entry.normalizedName, index])
  );
  let unbudgetedSpent = 0;

  for (const expense of Array.isArray(expenses) ? expenses : []) {
    if (monthFromStoredDate(expense?.date) !== currentMonth) continue;
    const amount = safeAmount(expense?.amount);
    const index = categoryIndex.get(normalizedCategory(expense?.category));
    if (index === undefined) {
      unbudgetedSpent = round(unbudgetedSpent + amount);
    } else {
      categorySpending[index] = round(categorySpending[index] + amount);
    }
  }

  const categories = budgetCategoryEntries.map((entry, index) => ({
    categoryNumber: index + 1,
    ...budgetMetrics(
      entry.limit,
      categorySpending[index],
      daysRemainingIncludingToday
    ),
  }));
  const totalThisMonth = round(
    categories.reduce((sum, category) => sum + category.spent, unbudgetedSpent)
  );
  const totalBudget = budgetMetrics(
    budget?.total,
    totalThisMonth,
    daysRemainingIncludingToday
  );

  const sourceGoals = Array.isArray(goals) ? goals : [];
  const allGoalProgress = sourceGoals.map((goal) => calculateGoalProgress(goal, now));
  const completedCount = allGoalProgress.filter((goal) => goal.completed).length;
  const averageProgressPercent = allGoalProgress.length > 0
    ? round(
      allGoalProgress.reduce((sum, goal) => sum + goal.progressPercent, 0) / allGoalProgress.length,
      1
    )
    : null;

  return {
    schemaVersion: 2,
    currency: 'ZAR',
    period: {
      month: currentMonth,
      daysRemainingIncludingToday,
    },
    spending: {
      totalThisMonth,
      unbudgetedSpent,
      categories,
    },
    budget: {
      configured: totalBudget.limit > 0,
      ...totalBudget,
    },
    goals: {
      totalCount: sourceGoals.length,
      completedCount,
      averageProgressPercent,
      items: allGoalProgress.slice(0, MAX_SAFE_GOAL_SUMMARIES).map((goal, index) => ({
        goalNumber: index + 1,
        progressPercent: goal.progressPercent,
        remainingPercent: goal.remainingPercent,
        daysUntilDeadline: goal.daysUntilDeadline,
        deadlineStatus: goal.deadlineStatus,
      })),
    },
  };
}

// Rebuild the payload from an explicit allowlist before it can leave the browser.
// Unknown properties such as transaction titles, notes, IDs, or account data are dropped.
export function sanitizeSafeFinancialSummary(value = {}) {
  const period = value?.period || {};
  const spending = value?.spending || {};
  const budget = value?.budget || {};
  const goals = value?.goals || {};
  const sourceCategories = Array.isArray(spending?.categories) ? spending.categories : [];
  const sourceGoalItems = Array.isArray(goals?.items) ? goals.items : [];

  const categories = sourceCategories.slice(0, MAX_SAFE_BUDGET_CATEGORIES).map((source, index) => {
    return {
      categoryNumber: index + 1,
      limit: safeAmount(source.limit),
      spent: safeAmount(source.spent),
      usagePercent: source.usagePercent === null ? null : safePercentage(source.usagePercent, true),
      remaining: safeAmount(source.remaining),
      overspent: safeAmount(source.overspent),
      suggestedDailyRemaining: source.suggestedDailyRemaining === null
        ? null
        : safeAmount(source.suggestedDailyRemaining),
    };
  });

  const month = /^\d{4}-\d{2}$/.test(String(period.month || ''))
    ? String(period.month)
    : monthKey();
  const daysRemainingIncludingToday = clamp(
    safeCount(period.daysRemainingIncludingToday, 31) || 1,
    1,
    31
  );

  const sanitizedGoals = sourceGoalItems.slice(0, MAX_SAFE_GOAL_SUMMARIES).map((item, index) => {
    const allowedStatuses = ['none', 'future', 'today', 'overdue', 'complete'];
    const days = item?.daysUntilDeadline;
    return {
      goalNumber: index + 1,
      progressPercent: clamp(safePercentage(item?.progressPercent), 0, 100),
      remainingPercent: clamp(safePercentage(item?.remainingPercent), 0, 100),
      daysUntilDeadline: Number.isInteger(days)
        ? clamp(days, -MAX_DEADLINE_DAYS, MAX_DEADLINE_DAYS)
        : null,
      deadlineStatus: allowedStatuses.includes(item?.deadlineStatus) ? item.deadlineStatus : 'none',
    };
  });

  return {
    schemaVersion: 2,
    currency: 'ZAR',
    period: { month, daysRemainingIncludingToday },
    spending: {
      totalThisMonth: safeAmount(spending.totalThisMonth),
      unbudgetedSpent: safeAmount(spending.unbudgetedSpent),
      categories,
    },
    budget: {
      configured: budget.configured === true,
      limit: safeAmount(budget.limit),
      spent: safeAmount(budget.spent),
      usagePercent: budget.usagePercent === null ? null : safePercentage(budget.usagePercent, true),
      remaining: safeAmount(budget.remaining),
      overspent: safeAmount(budget.overspent),
      suggestedDailyRemaining: budget.suggestedDailyRemaining === null
        ? null
        : safeAmount(budget.suggestedDailyRemaining),
    },
    goals: {
      totalCount: Math.max(safeCount(goals.totalCount), sanitizedGoals.length),
      completedCount: safeCount(goals.completedCount),
      averageProgressPercent: goals.averageProgressPercent === null
        ? null
        : clamp(safePercentage(goals.averageProgressPercent), 0, 100),
      items: sanitizedGoals,
    },
  };
}

export const AssistantFinanceInternals = {
  budgetMetrics,
  monthFromStoredDate,
};

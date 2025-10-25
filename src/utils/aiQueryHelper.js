import { formatCurrency } from './formatCurrency';
import { monthKey, ymFromDate } from './calculateBudgets';

// TODO: Replace rule-based logic with GPT later

function normalize(s) {
  return (s || '').toLowerCase().trim();
}

function sumByCategoryThisMonth(expenses, category) {
  const mk = monthKey();
  let total = 0;
  for (const e of expenses || []) {
    if (!e) continue;
    const cat = (e.category || 'other').toLowerCase();
    if (ymFromDate(e.date) === mk && cat === normalize(category)) {
      total += Number(e.amount) || 0;
    }
  }
  return total;
}

function totalIncomeThisMonth(incomes) {
  const mk = monthKey();
  return (incomes || []).reduce((acc, i) => {
    return acc + ((ymFromDate(i.date) === mk) ? (Number(i.amount) || 0) : 0);
  }, 0);
}

function topSpendingCategoryThisMonth(expenses) {
  const mk = monthKey();
  const sums = new Map();
  for (const e of expenses || []) {
    if (ymFromDate(e.date) !== mk) continue;
    const cat = (e.category || 'Other');
    const key = cat.toLowerCase();
    sums.set(key, (sums.get(key) || 0) + (Number(e.amount) || 0));
  }
  if (sums.size === 0) return null;
  const [key, value] = Array.from(sums.entries()).sort((a, b) => b[1] - a[1])[0];
  return { category: key, amount: value };
}

function detectCategoryFromQuery(query, expenses) {
  const q = normalize(query);
  const set = new Set((expenses || []).map((e) => (e.category || 'other').toLowerCase()));
  for (const c of set) {
    if (c && q.includes(c)) return c;
  }
  const m = q.match(/spent on ([a-z ]+)/i);
  if (m && m[1]) return normalize(m[1]);
  return null;
}

export function answerFinanceQuery(query, { incomes = [], expenses = [], totals = { totalIncome: 0, totalExpenses: 0, balance: 0 } }) {
  const q = normalize(query || '');

  if (q.includes('balance') || q.includes('total balance') || q.includes('current balance')) {
    return `Your current balance is ${formatCurrency(totals?.balance || 0)}.`;
  }

  if (q.includes('income this month') || q.includes('this month income') || q.includes('monthly income')) {
    const income = totalIncomeThisMonth(incomes);
    return `Your income this month is ${formatCurrency(income)}.`;
  }

  if (q.includes('spent on') || q.includes('spend on') || q.includes('spending on')) {
    const cat = detectCategoryFromQuery(q, expenses);
    if (cat) {
      const total = sumByCategoryThisMonth(expenses, cat);
      if (total > 0) {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        return `You spent ${formatCurrency(total)} on ${label} this month.`;
      }
      return `I couldn't find any expenses for ${cat} this month.`;
    }
  }

  if (q.includes('highest spending category') || q.includes('top category') || q.includes('most on')) {
    const top = topSpendingCategoryThisMonth(expenses);
    if (top) {
      const label = top.category.charAt(0).toUpperCase() + top.category.slice(1);
      return `Your highest spending category this month is ${label} (${formatCurrency(top.amount)}).`;
    }
    return 'No spending yet this month.';
  }

  return 'I’m not sure yet. More AI intelligence coming soon.';
}

export const AIHelpers = {
  sumByCategoryThisMonth,
  totalIncomeThisMonth,
  topSpendingCategoryThisMonth,
};


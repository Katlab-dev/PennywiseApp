import { cleanExpenseCategoryLabel } from './expenseCategories';

export const MAX_BUDGET_CATEGORIES = 12;
export const MAX_BUDGET_CATEGORY_NAME_LENGTH = 60;
export const MAX_BUDGET_CATEGORY_LIMIT = 1_000_000_000;

function sourceEntries(value) {
  if (Array.isArray(value)) {
    return value.map((item) => [item?.name, item?.limit]);
  }
  if (value && typeof value === 'object') return Object.entries(value);
  return [];
}

export function normalizeStoredBudgetCategories(value) {
  const categories = {};
  const seen = new Set();

  for (const [rawName, rawLimit] of sourceEntries(value)) {
    if (Object.keys(categories).length >= MAX_BUDGET_CATEGORIES) break;
    const name = cleanExpenseCategoryLabel(rawName);
    const limit = Number(rawLimit);
    const key = name.toLowerCase();
    if (
      !name
      || name.length > MAX_BUDGET_CATEGORY_NAME_LENGTH
      || seen.has(key)
      || !Number.isFinite(limit)
      || limit <= 0
      || limit > MAX_BUDGET_CATEGORY_LIMIT
    ) {
      continue;
    }
    seen.add(key);
    categories[name] = limit;
  }

  return categories;
}

export function prepareBudgetCategories(value) {
  const entries = sourceEntries(value);
  if (entries.length > MAX_BUDGET_CATEGORIES) {
    throw new Error(`You can add up to ${MAX_BUDGET_CATEGORIES} budget categories.`);
  }

  const categories = {};
  const seen = new Set();
  entries.forEach(([rawName, rawLimit], index) => {
    const position = index + 1;
    const name = cleanExpenseCategoryLabel(rawName);
    if (!name) throw new Error(`Enter a name for budget category ${position}.`);
    if (name.length > MAX_BUDGET_CATEGORY_NAME_LENGTH) {
      throw new Error(`Budget category names must be ${MAX_BUDGET_CATEGORY_NAME_LENGTH} characters or fewer.`);
    }

    const key = name.toLowerCase();
    if (seen.has(key)) throw new Error(`“${name}” has already been added.`);

    const limit = Number(rawLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error(`Enter a positive monthly limit for “${name}”.`);
    }
    if (limit > MAX_BUDGET_CATEGORY_LIMIT) {
      throw new Error(`The monthly limit for “${name}” is too large.`);
    }

    seen.add(key);
    categories[name] = limit;
  });

  return categories;
}

export function findMatchingBudgetCategory(categories, expenseCategory) {
  const requested = cleanExpenseCategoryLabel(expenseCategory).toLowerCase();
  if (!requested) return null;
  return Object.keys(categories || {}).find(
    (category) => cleanExpenseCategoryLabel(category).toLowerCase() === requested
  ) || null;
}

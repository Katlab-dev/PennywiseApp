export const CORE_EXPENSE_CATEGORIES = ['Food', 'Transport', 'Rent', 'Other'];

export function cleanExpenseCategoryLabel(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeExpenseCategory(value, fallback = 'Other') {
  const cleaned = cleanExpenseCategoryLabel(value);
  if (!cleaned) return fallback;

  return CORE_EXPENSE_CATEGORIES.find(
    (category) => category.toLowerCase() === cleaned.toLowerCase()
  ) || cleaned;
}

export function getExpenseCategoryFormValues(savedCategory) {
  const normalized = normalizeExpenseCategory(savedCategory);
  if (CORE_EXPENSE_CATEGORIES.includes(normalized)) {
    return {
      category: normalized,
      customCategory: '',
    };
  }

  return {
    category: 'Other',
    customCategory: normalized,
  };
}

export function resolveExpenseCategory(category, customCategory, knownCustomCategories = []) {
  const normalizedCategory = normalizeExpenseCategory(category);
  if (normalizedCategory !== 'Other') return normalizedCategory;

  const normalizedCustomCategory = normalizeExpenseCategory(customCategory);
  if (normalizedCustomCategory === 'Other') return 'Other';

  return knownCustomCategories
    .map(cleanExpenseCategoryLabel)
    .find((knownCategory) => (
      knownCategory.toLowerCase() === normalizedCustomCategory.toLowerCase()
    )) || normalizedCustomCategory;
}

export function getCustomExpenseCategorySuggestions(expenses = [], additionalCategories = []) {
  const suggestions = new Map();

  const sourceCategories = [
    ...(Array.isArray(expenses) ? expenses.map((expense) => expense?.category) : []),
    ...(Array.isArray(additionalCategories) ? additionalCategories : []),
  ];

  for (const sourceCategory of sourceCategories) {
    const normalized = normalizeExpenseCategory(sourceCategory);
    if (CORE_EXPENSE_CATEGORIES.includes(normalized)) continue;

    const key = normalized.toLowerCase();
    if (!suggestions.has(key)) suggestions.set(key, normalized);
  }

  return [...suggestions.values()].sort((left, right) => left.localeCompare(right));
}

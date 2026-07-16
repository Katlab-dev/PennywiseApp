import {
  getCustomExpenseCategorySuggestions,
  getExpenseCategoryFormValues,
  normalizeExpenseCategory,
  resolveExpenseCategory,
} from './expenseCategories';

test('cleans category whitespace and canonicalizes built-in category casing', () => {
  expect(normalizeExpenseCategory('  school   supplies ')).toBe('school supplies');
  expect(normalizeExpenseCategory(' food ')).toBe('Food');
  expect(resolveExpenseCategory('Other', ' takeaways ', ['Takeaways'])).toBe('Takeaways');
  expect(resolveExpenseCategory('Other', '   ')).toBe('Other');
});

test('loads an existing custom category through the Other form option', () => {
  expect(getExpenseCategoryFormValues('Entertainment')).toEqual({
    category: 'Other',
    customCategory: 'Entertainment',
  });
  expect(getExpenseCategoryFormValues('transport')).toEqual({
    category: 'Transport',
    customCategory: '',
  });
});

test('deduplicates custom suggestions and includes user-created budget categories', () => {
  expect(getCustomExpenseCategorySuggestions([
    { category: 'Takeaways' },
    { category: ' takeaways ' },
    { category: 'School supplies' },
    { category: 'Food' },
  ], ['Groove', 'Takeaways'])).toEqual(['Groove', 'School supplies', 'Takeaways']);
});

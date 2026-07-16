import {
  MAX_BUDGET_CATEGORIES,
  findMatchingBudgetCategory,
  normalizeStoredBudgetCategories,
  prepareBudgetCategories,
} from './budgetCategories';

test('prepares arbitrary category names and collapses whitespace', () => {
  expect(prepareBudgetCategories([
    { name: '  Student   groceries ', limit: '1200' },
    { name: 'Groove', limit: 350 },
  ])).toEqual({
    'Student groceries': 1200,
    Groove: 350,
  });
});

test('rejects blank, duplicate, and invalid custom budgets', () => {
  expect(() => prepareBudgetCategories([{ name: '', limit: 100 }]))
    .toThrow('Enter a name for budget category 1.');
  expect(() => prepareBudgetCategories([
    { name: 'Takeaways', limit: 100 },
    { name: ' takeaways ', limit: 200 },
  ])).toThrow('“takeaways” has already been added.');
  expect(() => prepareBudgetCategories([{ name: 'Data', limit: 0 }]))
    .toThrow('Enter a positive monthly limit for “Data”.');
  expect(() => prepareBudgetCategories(
    Array.from({ length: MAX_BUDGET_CATEGORIES + 1 }, (_, index) => ({
      name: `Category ${index + 1}`,
      limit: 100,
    }))
  )).toThrow(`You can add up to ${MAX_BUDGET_CATEGORIES} budget categories.`);
});

test('drops legacy zero placeholders and matches expense names case-insensitively', () => {
  const categories = normalizeStoredBudgetCategories({
    Food: 0,
    Rent: 0,
    Takeaways: 500,
    ' School   supplies ': 300,
  });

  expect(categories).toEqual({ Takeaways: 500, 'School supplies': 300 });
  expect(findMatchingBudgetCategory(categories, ' takeaways ')).toBe('Takeaways');
  expect(findMatchingBudgetCategory(categories, 'Groove')).toBeNull();
});

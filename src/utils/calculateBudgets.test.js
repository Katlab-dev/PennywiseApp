import {
  budgetCategorySumsThisMonth,
  categorySumsThisMonth,
} from './calculateBudgets';

const expenses = [
  { category: 'Other', amount: 100, date: '2026-07-02' },
  { category: 'Takeaways', amount: 250, date: '2026-07-03' },
  { category: 'School supplies', amount: 75, date: '2026-07-04' },
  { category: 'Food', amount: 300, date: '2026-07-05' },
  { category: 'Takeaways', amount: 999, date: '2026-06-30' },
];

test('keeps custom labels separate for reports and insights', () => {
  const sums = categorySumsThisMonth(expenses, '2026-07');

  expect(sums.get('Other')).toBe(100);
  expect(sums.get('Takeaways')).toBe(250);
  expect(sums.get('School supplies')).toBe(75);
});

test('matches spending to user-created budgets by category name', () => {
  const sums = budgetCategorySumsThisMonth(expenses, {
    Other: 200,
    takeaways: 500,
    'School supplies': 300,
  }, '2026-07');

  expect(sums.get('Other')).toBe(100);
  expect(sums.get('takeaways')).toBe(250);
  expect(sums.get('School supplies')).toBe(75);
  expect(sums.has('Food')).toBe(false);
});

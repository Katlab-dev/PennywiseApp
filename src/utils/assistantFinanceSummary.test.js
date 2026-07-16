import {
  buildSafeFinancialSummary,
  sanitizeSafeFinancialSummary,
} from './assistantFinanceSummary';

const now = new Date(2026, 6, 20, 12, 0, 0);

test('builds the 82 percent and R120 daily Food budget example', () => {
  const summary = buildSafeFinancialSummary({
    expenses: [
      {
        id: 'firestore-secret-id',
        title: 'Private family dinner',
        notes: 'Meet person@example.com',
        category: 'Food',
        amount: 6560,
        date: '2026-07-02',
      },
      { title: 'Old expense', category: 'Food', amount: 500, date: '2026-06-30' },
    ],
    budget: {
      total: 8000,
      categories: { Food: 8000, Transport: 0, Rent: 0, Other: 0 },
    },
    goals: [
      {
        id: 'private-goal-id',
        title: 'Confidential home deposit',
        target: 12347,
        current: 4567,
        deadline: '2026-10-18',
      },
    ],
    incomes: [{ title: 'Private employer', amount: 99999 }],
    accountNumber: '123456789',
  }, now);

  const food = summary.spending.categories[0];
  expect(summary.period).toEqual({
    month: '2026-07',
    daysRemainingIncludingToday: 12,
  });
  expect(food).toEqual(expect.objectContaining({
    categoryNumber: 1,
    spent: 6560,
    limit: 8000,
    usagePercent: 82,
    remaining: 1440,
    overspent: 0,
    suggestedDailyRemaining: 120,
  }));
  expect(summary.goals.items[0]).toEqual(expect.objectContaining({
    goalNumber: 1,
    daysUntilDeadline: 90,
    deadlineStatus: 'future',
  }));

  const serialized = JSON.stringify(summary);
  expect(serialized).not.toMatch(/Private family dinner|Meet person|firestore-secret-id/i);
  expect(serialized).not.toMatch(/Confidential home deposit|private-goal-id/i);
  expect(serialized).not.toMatch(/Private employer|accountNumber|123456789/i);
  expect(serialized).not.toMatch(/Food/i);
  expect(serialized).not.toMatch(/title|notes|\bid\b|income|balance/i);
});

test('keeps dynamic category names private while preserving anonymous budget metrics', () => {
  const summary = buildSafeFinancialSummary({
    expenses: [
      { category: 'Food', amount: 1200, date: '2026-07-10' },
      { category: 'Entertainment', amount: 300, date: '2026-07-11' },
      { category: 'Unplanned', amount: 50, date: '2026-07-12' },
      { category: 'Rent', amount: 100, date: 'not-a-date' },
    ],
    budget: {
      total: 1300,
      categories: { Food: 1000, Entertainment: 200 },
    },
  }, now);

  const food = summary.spending.categories[0];
  const entertainment = summary.spending.categories[1];
  expect(summary.schemaVersion).toBe(2);
  expect(summary.spending.totalThisMonth).toBe(1550);
  expect(summary.spending.unbudgetedSpent).toBe(50);
  expect(summary.budget).toEqual(expect.objectContaining({
    remaining: 0,
    overspent: 250,
    usagePercent: 119.2,
  }));
  expect(food).toEqual(expect.objectContaining({ categoryNumber: 1, remaining: 0, overspent: 200, usagePercent: 120 }));
  expect(entertainment).toEqual(expect.objectContaining({ categoryNumber: 2, spent: 300, overspent: 100, usagePercent: 150 }));
  expect(JSON.stringify(summary)).not.toMatch(/Food|Entertainment|Unplanned/i);
});

test('sanitizer drops unknown raw properties before a summary leaves the browser', () => {
  const source = buildSafeFinancialSummary({
    budget: { total: 100, categories: { 'Private category': 100 } },
  }, now);
  source.transactions = [{ title: 'Never forward this' }];
  source.spending.categories[0].notes = 'Secret note';
  source.spending.categories[0].name = 'Private category';
  source.goals.items.push({
    goalNumber: 99,
    progressPercent: 50,
    remainingPercent: 50,
    daysUntilDeadline: null,
    deadlineStatus: 'none',
    title: 'Secret goal',
  });

  const sanitized = sanitizeSafeFinancialSummary(source);
  const serialized = JSON.stringify(sanitized);
  expect(serialized).not.toMatch(/transactions|Never forward|notes|Secret note|Secret goal|Private category|title|name/i);
  expect(sanitized.spending.categories).toHaveLength(1);
});

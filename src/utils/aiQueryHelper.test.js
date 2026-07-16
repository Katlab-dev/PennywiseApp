import { answerFinanceQuery } from './aiQueryHelper';

const now = new Date(2026, 6, 20, 12, 0, 0);
const financeData = {
  incomes: [
    { amount: 3000, date: '2026-07-01' },
    { amount: 1000, date: '2026-06-01' },
  ],
  expenses: [
    { title: 'Groceries', amount: 820, category: 'Food', date: '2026-07-02' },
    { title: 'Taxi', amount: 200, category: 'Transport', date: '2026-07-03' },
    { title: 'Old meal', amount: 100, category: 'Food', date: '2026-06-03' },
  ],
  totals: { totalIncome: 4000, totalExpenses: 1120, balance: 2880 },
  budget: {
    total: 1000,
    categories: { Food: 1000, Transport: 100, Rent: 0, Other: 0 },
  },
  goals: [
    {
      title: 'Emergency Fund',
      target: 5000,
      current: 2000,
      deadline: '2026-12-31',
    },
  ],
};

test('answers exact balance and spending totals locally', () => {
  expect(answerFinanceQuery('What is my balance?', financeData, now))
    .toBe('Your current balance is R 2,880.00.');
  expect(answerFinanceQuery('How much have I spent this month?', financeData, now))
    .toBe('You have spent R 1,020.00 this month.');
  expect(answerFinanceQuery('What are my total expenses?', financeData, now))
    .toBe('Your total recorded spending is R 1,120.00.');
  expect(answerFinanceQuery('What is my income this month?', financeData, now))
    .toBe('Your income this month is R 3,000.00.');
  expect(answerFinanceQuery('Balance?', financeData, now))
    .toBe('Your current balance is R 2,880.00.');
  expect(answerFinanceQuery('Total spent', financeData, now))
    .toBe('Your total recorded spending is R 1,120.00.');
});

test('answers total and category budget status with exact local calculations', () => {
  expect(answerFinanceQuery('Am I over budget?', financeData, now))
    .toContain('are over by R 20.00.');
  expect(answerFinanceQuery('How much of my Food budget is left?', financeData, now))
    .toContain('R 180.00 remains');
  expect(answerFinanceQuery('Which categories are over budget?', financeData, now))
    .toBe('Over-budget categories: Transport by R 100.00.');
  expect(answerFinanceQuery('How much did I overspend?', financeData, now))
    .toContain('over by R 20.00');
});

test('reports category overages even while the total budget is still within its limit', () => {
  const answer = answerFinanceQuery('Am I overspending?', {
    ...financeData,
    budget: {
      total: 2000,
      categories: { Food: 500, Transport: 500, Rent: 0, Other: 0 },
    },
  }, now);

  expect(answer).toContain('within your total monthly budget');
  expect(answer).toContain('Food by R 320.00');
});

test('reports user-created category overages locally by their saved names', () => {
  const customData = {
    ...financeData,
    expenses: [
      { amount: 700, category: 'Groove', date: '2026-07-10' },
      { amount: 250, category: 'Takeaways', date: '2026-07-11' },
    ],
    budget: {
      total: 2000,
      categories: { Groove: 500, Takeaways: 300 },
    },
  };

  expect(answerFinanceQuery('Which categories are over budget?', customData, now))
    .toBe('Over-budget categories: Groove by R 200.00.');
  expect(answerFinanceQuery('What is my Groove budget status?', customData, now))
    .toContain('You are over by R 200.00.');
});

test('answers named goal progress locally with exact amounts', () => {
  const answer = answerFinanceQuery('What is my Emergency Fund goal progress?', financeData, now);
  expect(answer).toContain('Emergency Fund: R 2,000.00 of R 5,000.00 saved (40%)');
  expect(answer).toContain('R 3,000.00 remaining');
});

test('matches the longest overlapping goal title', () => {
  const answer = answerFinanceQuery('Show Emergency Fund goal progress', {
    ...financeData,
    goals: [
      { title: 'Fund', target: 100, current: 10, deadline: '' },
      { title: 'Emergency Fund', target: 5000, current: 2000, deadline: '' },
    ],
  }, now);

  expect(answer).toContain('Emergency Fund: R 2,000.00 of R 5,000.00');
  expect(answer).not.toContain('R 10.00 of R 100.00');
});

test('routes advice to Gemini and does not confuse balanced with account balance', () => {
  expect(answerFinanceQuery('How can I improve my budget?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('What is a balanced budget?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('How can I improve my balance?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('How can I increase my monthly income?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('How much should I be spending?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('How can I stop overspending?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('What is the difference between income and expenses?', financeData, now)).toBeNull();
  expect(answerFinanceQuery('How can I start my budget today?', financeData, now)).toBeNull();
});

test('does not label spending as overspending when no budget is configured', () => {
  const answer = answerFinanceQuery('Am I overspending?', {
    ...financeData,
    budget: { total: 0, categories: {} },
  }, now);
  expect(answer).toContain('You have not set a total monthly budget');
  expect(answer).not.toContain('over by');
});

test('does not answer historical questions with current-month figures', () => {
  const expected = 'I can calculate current balance, current-month figures, or all-time totals here. For another period, open History or Reports and use the recorded dates.';
  expect(answerFinanceQuery('How much did I spend last month?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('What was my balance yesterday?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('Was I over budget in June?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('How much did I spend in the last 30 days?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('How can I reduce last month spending?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('What was my Emergency Fund goal progress last month?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('How much did I spend in 2025?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('How much did I spend last weekend?', financeData, now)).toBe(expected);
  expect(answerFinanceQuery('How much did I spend two weeks ago?', financeData, now)).toBe(expected);
});

test('keeps legacy custom categories exact in local answers', () => {
  const data = {
    ...financeData,
    expenses: [
      { amount: 300, category: 'Entertainment', date: '2026-07-10' },
      { amount: 200, category: 'Other', date: '2026-07-11' },
    ],
    budget: {
      total: 1000,
      categories: { Food: 0, Transport: 0, Rent: 0, Other: 400, Entertainment: 500 },
    },
  };

  expect(answerFinanceQuery('How much did I spend on Entertainment?', data, now))
    .toBe('You spent R 300.00 on Entertainment this month.');
  expect(answerFinanceQuery('What is my Entertainment budget status?', data, now))
    .toContain('R 200.00 remains');
});

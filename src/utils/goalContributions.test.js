import { calculateGoalContribution } from './goalContributions';

test('adds a new contribution to the amount already saved', () => {
  expect(calculateGoalContribution(400, 1000, 150)).toEqual({
    previousCurrent: 400,
    target: 1000,
    contribution: 150,
    nextCurrent: 550,
    remainingBefore: 600,
    remainingAfter: 450,
    completed: false,
  });
});

test('rounds currency contributions safely to two decimal places', () => {
  expect(calculateGoalContribution(100.1, 500, 20.2).nextCurrent).toBe(120.3);
});

test.each(['', 0, -10])('rejects a non-positive contribution: %p', (amount) => {
  expect(() => calculateGoalContribution(400, 1000, amount)).toThrow(
    'Enter a positive amount to add.'
  );
});

test('does not allow a contribution above the remaining goal amount', () => {
  expect(() => calculateGoalContribution(900, 1000, 150)).toThrow(
    'Only R 100.00 remains to complete this goal.'
  );
});

test('marks a goal complete when a contribution reaches the target exactly', () => {
  const result = calculateGoalContribution(900, 1000, 100);

  expect(result.nextCurrent).toBe(1000);
  expect(result.remainingAfter).toBe(0);
  expect(result.completed).toBe(true);
});

test('does not accept more money after a goal is complete', () => {
  expect(() => calculateGoalContribution(1000, 1000, 1)).toThrow(
    'This goal is already complete.'
  );
});

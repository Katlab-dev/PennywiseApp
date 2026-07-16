import { formatCurrency } from './formatCurrency';

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateGoalContribution(currentValue, targetValue, contributionValue) {
  const current = roundCurrency(currentValue);
  const target = roundCurrency(targetValue);
  const contribution = roundCurrency(contributionValue);

  if (!Number.isFinite(target) || target <= 0) {
    throw new Error('This goal does not have a valid target.');
  }
  if (!Number.isFinite(current) || current < 0) {
    throw new Error('This goal does not have a valid saved amount.');
  }
  if (!Number.isFinite(contribution) || contribution <= 0) {
    throw new Error('Enter a positive amount to add.');
  }

  const previousCurrent = Math.min(current, target);
  const remainingBefore = roundCurrency(Math.max(target - previousCurrent, 0));
  if (remainingBefore === 0) throw new Error('This goal is already complete.');
  if (contribution > remainingBefore) {
    throw new Error(`Only ${formatCurrency(remainingBefore)} remains to complete this goal.`);
  }

  const nextCurrent = roundCurrency(previousCurrent + contribution);
  const remainingAfter = roundCurrency(Math.max(target - nextCurrent, 0));

  return {
    previousCurrent,
    target,
    contribution,
    nextCurrent,
    remainingBefore,
    remainingAfter,
    completed: remainingAfter === 0,
  };
}

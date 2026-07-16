import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFinance } from '../context/FinanceContext';
import Goals from './Goals';

jest.mock('../context/FinanceContext', () => ({
  useFinance: jest.fn(),
}));

const laptopGoal = {
  id: 'goal-1',
  title: 'Laptop',
  target: 1000,
  current: 400,
  deadline: '',
};

function mockFinance(overrides = {}) {
  const value = {
    goals: [laptopGoal],
    addGoal: jest.fn().mockResolvedValue(undefined),
    contributeToGoal: jest.fn().mockResolvedValue({ nextCurrent: 550 }),
    deleteGoal: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  useFinance.mockReturnValue(value);
  return value;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('adds a contribution without making the user re-enter the saved total', async () => {
  const finance = mockFinance();
  render(<Goals />);

  expect(screen.getByText('R 400.00 saved of R 1,000.00')).toBeInTheDocument();
  const contributionInput = screen.getByLabelText('Amount to add to Laptop');
  expect(contributionInput).toHaveValue(null);

  fireEvent.change(contributionInput, { target: { value: '150' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add money' }));

  await waitFor(() => expect(finance.contributeToGoal).toHaveBeenCalledWith('goal-1', 150));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Added R 150.00. Total saved: R 550.00.'
  );
  expect(contributionInput).toHaveValue(null);
});

test('uses the latest saved total for the next contribution', async () => {
  const contributeToGoal = jest.fn()
    .mockResolvedValueOnce({ nextCurrent: 550 })
    .mockResolvedValueOnce({ nextCurrent: 600 });
  mockFinance({ contributeToGoal });
  const view = render(<Goals />);

  fireEvent.change(screen.getByLabelText('Amount to add to Laptop'), {
    target: { value: '150' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add money' }));
  await waitFor(() => expect(contributeToGoal).toHaveBeenCalledWith('goal-1', 150));

  mockFinance({
    goals: [{ ...laptopGoal, current: 550 }],
    contributeToGoal,
  });
  view.rerender(<Goals />);
  expect(screen.getByText('R 550.00 saved of R 1,000.00')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Amount to add to Laptop'), {
    target: { value: '50' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add money' }));

  await waitFor(() => expect(contributeToGoal).toHaveBeenLastCalledWith('goal-1', 50));
});

test('blocks a contribution that is above the amount still needed', async () => {
  const finance = mockFinance();
  render(<Goals />);

  fireEvent.change(screen.getByLabelText('Amount to add to Laptop'), {
    target: { value: '700' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add money' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Only R 600.00 remains to complete this goal.'
  );
  expect(finance.contributeToGoal).not.toHaveBeenCalled();
});

test('shows a completed state and removes the contribution form at the target', () => {
  mockFinance({ goals: [{ ...laptopGoal, current: 1000 }] });
  render(<Goals />);

  expect(screen.getByText('Goal reached')).toBeInTheDocument();
  expect(screen.getByText('You have reached this savings target.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Amount to add to Laptop')).not.toBeInTheDocument();
});

test('creates a new goal with a zero saved balance', async () => {
  const finance = mockFinance({ goals: [] });
  render(<Goals />);

  fireEvent.change(screen.getByLabelText('Goal name'), { target: { value: '  Emergency fund  ' } });
  fireEvent.change(screen.getByLabelText('Target amount'), { target: { value: '5000' } });
  fireEvent.change(screen.getByLabelText('Deadline (optional)'), { target: { value: '2026-12-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create goal' }));

  await waitFor(() => expect(finance.addGoal).toHaveBeenCalledWith({
    title: 'Emergency fund',
    target: 5000,
    current: 0,
    deadline: '2026-12-31',
  }));
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFinance } from '../context/FinanceContext';
import History from './History';

jest.mock('../context/FinanceContext', () => ({
  useFinance: jest.fn(),
}));

jest.mock('../components/TransactionEditor', () => () => null);

const income = {
  id: 'income-document-id',
  title: 'Allowance',
  category: '-',
  amount: 1200,
  date: '2026-07-12',
};

const expense = {
  id: 'expense-document-id',
  title: 'Groceries',
  category: 'Food',
  amount: 250,
  date: '2026-07-11',
};

function renderHistory(deleteTransaction = jest.fn().mockResolvedValue(undefined)) {
  useFinance.mockReturnValue({
    loading: false,
    incomes: [income],
    expenses: [expense],
    deleteTransaction,
    updateExpense: jest.fn(),
    updateIncome: jest.fn(),
  });
  render(<History />);
  return deleteTransaction;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('confirms and deletes an income using its stable kind and document ID', async () => {
  const deleteTransaction = renderHistory();

  fireEvent.click(screen.getByRole('button', { name: 'Delete income Allowance' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete income Allowance' }));

  await waitFor(() => {
    expect(deleteTransaction).toHaveBeenCalledWith('income-document-id', 'income');
  });
  expect(await screen.findByRole('status')).toHaveTextContent('Income deleted.');
});

test('confirms and deletes an expense using its stable kind and document ID', async () => {
  const deleteTransaction = renderHistory();

  fireEvent.click(screen.getByRole('button', { name: 'Delete expense Groceries' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete expense Groceries' }));

  await waitFor(() => {
    expect(deleteTransaction).toHaveBeenCalledWith('expense-document-id', 'expense');
  });
});

test('allows deletion to be cancelled without changing data', () => {
  const deleteTransaction = renderHistory();

  fireEvent.click(screen.getByRole('button', { name: 'Delete income Allowance' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel deleting income Allowance' }));

  expect(deleteTransaction).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Delete income Allowance' })).toBeInTheDocument();
});

test('shows a clear error and restores the controls when deletion fails', async () => {
  const deleteTransaction = jest.fn().mockRejectedValue(new Error('permission denied'));
  renderHistory(deleteTransaction);

  fireEvent.click(screen.getByRole('button', { name: 'Delete expense Groceries' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete expense Groceries' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not delete this transaction/i);
  expect(screen.getByRole('button', { name: 'Confirm delete expense Groceries' })).toBeEnabled();
  expect(screen.getByText('Groceries')).toBeInTheDocument();
});

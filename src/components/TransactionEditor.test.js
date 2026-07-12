import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TransactionEditor from './TransactionEditor';

const expense = {
  id: 'expense-1',
  type: 'Expense',
  title: 'Groceries',
  amount: 250,
  category: 'Food',
  date: '2026-07-11',
  notes: 'Weekly shop',
};

test('loads and submits edited expense details', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  render(<TransactionEditor transaction={expense} onSave={onSave} onCancel={jest.fn()} />);

  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fresh groceries' } });
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '300' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  await waitFor(() => expect(onSave).toHaveBeenCalledWith({
    title: 'Fresh groceries',
    amount: 300,
    category: 'Food',
    date: '2026-07-11',
    notes: 'Weekly shop',
  }));
});

test('rejects a non-positive amount before saving', () => {
  const onSave = jest.fn();
  render(<TransactionEditor transaction={expense} onSave={onSave} onCancel={jest.fn()} />);

  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  expect(screen.getByRole('alert')).toHaveTextContent('Amount must be a positive number.');
  expect(onSave).not.toHaveBeenCalled();
});

test('uses source terminology and hides category for income', () => {
  render(<TransactionEditor transaction={{ ...expense, type: 'Income', title: 'Salary', category: '-' }} onSave={jest.fn()} onCancel={jest.fn()} />);

  expect(screen.getByLabelText('Source')).toHaveValue('Salary');
  expect(screen.queryByLabelText('Category')).not.toBeInTheDocument();
});

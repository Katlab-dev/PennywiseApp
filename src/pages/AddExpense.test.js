import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import AddExpense from './AddExpense';

jest.mock('../context/FinanceContext', () => ({
  useFinance: jest.fn(),
}));

function renderAddExpense() {
  return render(
    <MemoryRouter initialEntries={['/add-expense']}>
      <Routes>
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/" element={<div>Dashboard destination</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillRequiredExpenseFields() {
  fireEvent.change(screen.getByLabelText('Expense name'), {
    target: { value: '  Textbooks  ' },
  });
  fireEvent.change(screen.getByLabelText('Amount'), {
    target: { value: '350' },
  });
  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '2026-07-16' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows the custom category field only when Other is selected', () => {
  useFinance.mockReturnValue({ addExpense: jest.fn(), expenses: [] });
  renderAddExpense();

  expect(screen.queryByLabelText('Custom category (optional)')).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });
  expect(screen.getByLabelText('Custom category (optional)')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Food' } });
  expect(screen.queryByLabelText('Custom category (optional)')).not.toBeInTheDocument();
});

test('saves a cleaned custom category in the existing category field', async () => {
  const addExpense = jest.fn().mockResolvedValue(undefined);
  useFinance.mockReturnValue({ addExpense, expenses: [] });
  renderAddExpense();
  fillRequiredExpenseFields();

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });
  fireEvent.change(screen.getByLabelText('Custom category (optional)'), {
    target: { value: '  School   supplies  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit Expense' }));

  await waitFor(() => expect(addExpense).toHaveBeenCalledWith({
    title: 'Textbooks',
    amount: 350,
    category: 'School supplies',
    date: '2026-07-16',
    notes: '',
  }));
  expect(await screen.findByText('Dashboard destination')).toBeInTheDocument();
});

test('uses an existing custom spelling and falls back to Other when left blank', async () => {
  const addExpense = jest.fn().mockResolvedValue(undefined);
  useFinance.mockReturnValue({
    addExpense,
    expenses: [{ category: 'Takeaways' }],
  });
  renderAddExpense();
  fillRequiredExpenseFields();

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });
  fireEvent.change(screen.getByLabelText('Custom category (optional)'), {
    target: { value: 'takeaways' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit Expense' }));

  await waitFor(() => expect(addExpense).toHaveBeenCalledWith(
    expect.objectContaining({ category: 'Takeaways' })
  ));

  addExpense.mockClear();
  useFinance.mockReturnValue({ addExpense, expenses: [] });
  renderAddExpense();
  fillRequiredExpenseFields();
  fireEvent.change(screen.getAllByLabelText('Category')[0], { target: { value: 'Other' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Submit Expense' })[0]);

  await waitFor(() => expect(addExpense).toHaveBeenCalledWith(
    expect.objectContaining({ category: 'Other' })
  ));
});

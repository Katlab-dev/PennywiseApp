import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFinance } from '../context/FinanceContext';
import Budget from './Budget';

jest.mock('../context/FinanceContext', () => ({
  useFinance: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('starts without preset categories and saves categories created by the user', async () => {
  const setBudget = jest.fn().mockResolvedValue(undefined);
  useFinance.mockReturnValue({
    budget: { total: 0, categories: {} },
    setBudget,
    expenses: [],
  });
  render(<Budget />);

  expect(screen.getByText('No category limits yet')).toBeInTheDocument();
  expect(screen.queryByLabelText(/Category name 1/i)).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Total monthly budget (optional)'), {
    target: { value: '3000' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Add budget category/i }));
  fireEvent.change(screen.getByLabelText('Category name 1'), {
    target: { value: 'Groove' },
  });
  fireEvent.change(screen.getByLabelText('Monthly limit 1'), {
    target: { value: '350' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Add budget category/i }));
  fireEvent.change(screen.getByLabelText('Category name 2'), {
    target: { value: 'Takeaways' },
  });
  fireEvent.change(screen.getByLabelText('Monthly limit 2'), {
    target: { value: '600' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save Budget' }));

  await waitFor(() => expect(setBudget).toHaveBeenCalledWith(3000, {
    Groove: 350,
    Takeaways: 600,
  }));
  expect(await screen.findByText('Budget saved.')).toBeInTheDocument();
});

test('loads existing non-zero limits and allows a category to be removed', async () => {
  const setBudget = jest.fn().mockResolvedValue(undefined);
  useFinance.mockReturnValue({
    budget: { total: 2000, categories: { Food: 800 } },
    setBudget,
    expenses: [],
  });
  render(<Budget />);

  expect(screen.getByLabelText('Category name 1')).toHaveValue('Food');
  fireEvent.click(screen.getByRole('button', { name: 'Remove Food' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Budget' }));

  await waitFor(() => expect(setBudget).toHaveBeenCalledWith(2000, {}));
});

test('rejects duplicate category names regardless of casing', async () => {
  const setBudget = jest.fn();
  useFinance.mockReturnValue({
    budget: { total: 0, categories: {} },
    setBudget,
    expenses: [],
  });
  render(<Budget />);

  fireEvent.click(screen.getByRole('button', { name: /Add budget category/i }));
  fireEvent.click(screen.getByRole('button', { name: /Add budget category/i }));
  fireEvent.change(screen.getByLabelText('Category name 1'), { target: { value: 'Data' } });
  fireEvent.change(screen.getByLabelText('Monthly limit 1'), { target: { value: '300' } });
  fireEvent.change(screen.getByLabelText('Category name 2'), { target: { value: ' data ' } });
  fireEvent.change(screen.getByLabelText('Monthly limit 2'), { target: { value: '400' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Budget' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('“data” has already been added.');
  expect(setBudget).not.toHaveBeenCalled();
});

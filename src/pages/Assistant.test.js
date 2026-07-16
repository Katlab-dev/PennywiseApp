import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Assistant from './Assistant';
import { useFinance } from '../context/FinanceContext';
import { askGemini } from '../services/geminiAssistant';

jest.mock('../context/FinanceContext', () => ({
  useFinance: jest.fn(),
}));

jest.mock('../services/geminiAssistant', () => ({
  askGemini: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useFinance.mockReturnValue({
    incomes: [],
    expenses: [{
      id: 'private-expense-id',
      title: 'Private merchant',
      notes: 'Private note',
      amount: 50,
      category: 'Food',
      date: '2000-01-01',
    }],
    totals: { totalIncome: 3000, totalExpenses: 1000, balance: 2000 },
    budget: {
      total: 3000,
      categories: { Food: 1000, Transport: 500, Rent: 1000, Other: 500 },
    },
    goals: [{
      id: 'private-goal-id',
      title: 'Private goal name',
      target: 1000,
      current: 250,
      deadline: '',
    }],
    loading: false,
    dataError: '',
  });
});

test('answers personal totals locally without calling Gemini', async () => {
  render(<Assistant />);

  fireEvent.change(screen.getByLabelText('Ask PennyWise Assistant'), {
    target: { value: 'What is my balance?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

  await waitFor(() => expect(screen.getByText('Private calculation')).toBeInTheDocument());
  expect(askGemini).not.toHaveBeenCalled();
});

test('sends a general fallback question with only the safe aggregate summary', async () => {
  askGemini.mockResolvedValue('Start with a simple monthly spending plan.');
  render(<Assistant />);

  fireEvent.change(screen.getByLabelText('Ask PennyWise Assistant'), {
    target: { value: 'How can I start a budget?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

  await waitFor(() => expect(askGemini).toHaveBeenCalledTimes(1));
  const [question, context] = askGemini.mock.calls[0];
  expect(question).toBe('How can I start a budget?');
  expect(context).toEqual(expect.objectContaining({
    schemaVersion: 2,
    currency: 'ZAR',
    spending: expect.any(Object),
    budget: expect.any(Object),
    goals: expect.any(Object),
  }));
  expect(JSON.stringify(context)).not.toMatch(/Private merchant|Private note|private-expense-id/i);
  expect(JSON.stringify(context)).not.toMatch(/Private goal name|private-goal-id/i);
  expect(await screen.findByText('Start with a simple monthly spending plan.')).toBeInTheDocument();
});

test('redacts a stored goal title before an advice question reaches Gemini', async () => {
  askGemini.mockResolvedValue('Use a steady monthly contribution.');
  render(<Assistant />);

  fireEvent.change(screen.getByLabelText('Ask PennyWise Assistant'), {
    target: { value: 'How can I reach my Private goal name?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

  await waitFor(() => expect(askGemini).toHaveBeenCalledTimes(1));
  expect(askGemini.mock.calls[0][0]).toBe('How can I reach my Goal 1?');
  expect(askGemini.mock.calls[0][0]).not.toMatch(/Private goal name/i);
});

test('keeps the assistant disabled until the current user finance data is ready', () => {
  useFinance.mockReturnValue({
    incomes: [],
    expenses: [],
    totals: { totalIncome: 0, totalExpenses: 0, balance: 0 },
    budget: { total: 0, categories: {} },
    goals: [],
    loading: true,
    dataError: '',
  });

  render(<Assistant />);
  fireEvent.change(screen.getByLabelText('Ask PennyWise Assistant'), {
    target: { value: 'What is my balance?' },
  });

  expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  expect(screen.getByText(/Loading your PennyWise records/i)).toBeInTheDocument();
  expect(askGemini).not.toHaveBeenCalled();
});

test('checks the original question for sensitive details before stored-text redaction', async () => {
  useFinance.mockReturnValue({
    incomes: [],
    expenses: [{ title: 'Lunch', notes: 'owe', category: 'Food', amount: 10, date: '2000-01-01' }],
    totals: { totalIncome: 0, totalExpenses: 10, balance: -10 },
    budget: { total: 100, categories: { Food: 100, Transport: 0, Rent: 0, Other: 0 } },
    goals: [],
    loading: false,
    dataError: '',
  });
  render(<Assistant />);

  fireEvent.change(screen.getByLabelText('Ask PennyWise Assistant'), {
    target: { value: 'I owe R10 000. How can I budget?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

  expect(await screen.findByText(/do not type real personal amounts/i)).toBeInTheDocument();
  expect(askGemini).not.toHaveBeenCalled();
});

test('sends a clearly hypothetical student budget to Gemini without real account aggregates', async () => {
  const question = 'lets say i have 1700 as a student, and my expenses are food, groove and takeaways; can you advise how much to spend and provide a grocery list?';
  askGemini.mockResolvedValue('Example student plan: divide the R1,700 between essentials and limited leisure spending.');
  render(<Assistant />);

  fireEvent.change(screen.getByLabelText('Ask PennyWise Assistant'), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ask AI' }));

  await waitFor(() => expect(askGemini).toHaveBeenCalledTimes(1));
  const [sentQuestion, context] = askGemini.mock.calls[0];
  expect(sentQuestion).toBe(question);
  expect(context.spending.totalThisMonth).toBe(0);
  expect(context.budget.configured).toBe(false);
  expect(context.goals.totalCount).toBe(0);
  expect(await screen.findByText(/Example student plan/i)).toBeInTheDocument();
});

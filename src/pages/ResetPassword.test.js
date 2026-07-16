import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResetPassword from './ResetPassword';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('sends a normalized address and displays a non-enumerating success message', async () => {
  const resetPassword = jest.fn().mockResolvedValue(undefined);
  useAuth.mockReturnValue({ resetPassword });
  render(<ResetPassword />, { wrapper: MemoryRouter });

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: '  Student@Example.com  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

  await waitFor(() => expect(resetPassword).toHaveBeenCalledWith('student@example.com'));
  expect(await screen.findByText(/If an account exists for that email/i)).toBeInTheDocument();
});

test('does not reveal a missing account', async () => {
  const missingAccount = Object.assign(new Error('No user'), { code: 'auth/user-not-found' });
  useAuth.mockReturnValue({
    resetPassword: jest.fn().mockRejectedValue(missingAccount),
  });
  render(<ResetPassword />, { wrapper: MemoryRouter });

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'missing@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

  expect(await screen.findByText(/If an account exists for that email/i)).toBeInTheDocument();
  expect(screen.queryByText(/No account found/i)).not.toBeInTheDocument();
});

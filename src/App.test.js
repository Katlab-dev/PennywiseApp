import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App, { isPublicAuthPath } from './App';

test('renders Dashboard heading', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const heading = screen.getByRole('heading', { name: /dashboard/i });
  expect(heading).toBeInTheDocument();
});

test.each(['/auth', '/login', '/register', '/reset', '/reset-password'])(
  'allows the public authentication route %s',
  (pathname) => {
    expect(isPublicAuthPath(pathname)).toBe(true);
  }
);

test('does not treat a private finance route as public', () => {
  expect(isPublicAuthPath('/goals')).toBe(false);
});

test('redirects an unknown signed-out route to the public landing page', () => {
  render(
    <MemoryRouter initialEntries={['/does-not-exist']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /your money.*in focus/i })).toBeInTheDocument();
});

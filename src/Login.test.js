import { getLoginErrorMessage } from './Login';

test.each([
  ['auth/invalid-email', 'Please enter a valid email address.'],
  ['auth/invalid-credential', 'The email or password is incorrect.'],
  ['auth/too-many-requests', 'Too many unsuccessful attempts. Please wait and try again.'],
  ['auth/network-request-failed', 'Unable to connect. Check your internet connection and try again.'],
])('maps %s to a friendly login message', (code, expected) => {
  expect(getLoginErrorMessage({ code })).toBe(expected);
});

test('does not expose the supplied message for an unknown login error', () => {
  expect(getLoginErrorMessage({ code: 'auth/unknown', message: 'Something went wrong' }))
    .toBe('Failed to sign in. Please try again.');
});

import { getRegistrationErrorMessage } from './Register';

test.each([
  ['auth/invalid-email', 'Please enter a valid email address.'],
  ['auth/weak-password', 'Use a stronger password with at least 12 characters.'],
  ['auth/network-request-failed', 'Unable to connect. Check your internet connection and try again.'],
  ['auth/too-many-requests', 'Too many attempts. Please wait and try again.'],
])('maps %s to a safe registration message', (code, expected) => {
  expect(getRegistrationErrorMessage({ code })).toBe(expected);
});

test('does not expose raw Firebase registration errors', () => {
  expect(getRegistrationErrorMessage({
    code: 'auth/email-already-in-use',
    message: 'The email address is already in use.',
  })).toBe('We could not create the account. Check your details or try signing in.');
});

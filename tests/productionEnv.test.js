const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseEnvFile,
  validateProductionEnv,
} = require('../scripts/validateProductionEnv');

function validProductionEnv(overrides = {}) {
  return {
    REACT_APP_FIREBASE_API_KEY: 'firebase-browser-key',
    REACT_APP_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
    REACT_APP_FIREBASE_PROJECT_ID: 'example',
    REACT_APP_FIREBASE_APP_ID: '1:123:web:example',
    REACT_APP_AI_PROVIDER: 'firebase',
    REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY: 'recaptcha-site-key',
    REACT_APP_FIREBASE_APPCHECK_DEBUG: 'false',
    ...overrides,
  };
}

test('accepts a protected Firebase AI Logic production environment', () => {
  assert.deepEqual(validateProductionEnv(validProductionEnv()), []);
});

test('rejects a production build without App Check', () => {
  const errors = validateProductionEnv(validProductionEnv({
    REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY: '',
  }));
  assert.ok(errors.some((error) => error.includes('REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY')));
});

test('rejects the local proxy and App Check debug mode in production', () => {
  const errors = validateProductionEnv(validProductionEnv({
    REACT_APP_AI_PROVIDER: 'local-proxy',
    REACT_APP_FIREBASE_APPCHECK_DEBUG: 'true',
  }));
  assert.ok(errors.some((error) => error.includes('must be firebase')));
  assert.ok(errors.some((error) => error.includes('must not be true')));
});

test('rejects a Gemini key intended for a browser bundle', () => {
  const errors = validateProductionEnv(validProductionEnv({
    REACT_APP_GEMINI_API_KEY: 'do-not-ship-this',
  }));
  assert.ok(errors.some((error) => error.includes('must never be included')));
});

test('parses environment assignments without exposing comments', () => {
  assert.deepEqual(parseEnvFile(`
# comment
REACT_APP_AI_PROVIDER=firebase
REACT_APP_FIREBASE_PROJECT_ID="example-project"
`), {
    REACT_APP_AI_PROVIDER: 'firebase',
    REACT_APP_FIREBASE_PROJECT_ID: 'example-project',
  });
});

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_FIREBASE_KEYS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

function unquote(value) {
  const text = String(value || '').trim();
  if (
    text.length >= 2
    && ((text.startsWith('"') && text.endsWith('"'))
      || (text.startsWith("'") && text.endsWith("'")))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parseEnvFile(content) {
  const values = {};
  String(content || '').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) return;
    values[match[1]] = unquote(match[2]);
  });
  return values;
}

function loadProductionEnv(rootDirectory, processEnvironment = process.env) {
  const values = {};
  const filesByIncreasingPriority = [
    '.env',
    '.env.production',
    '.env.local',
    '.env.production.local',
  ];

  filesByIncreasingPriority.forEach((filename) => {
    const filenamePath = path.join(rootDirectory, filename);
    if (!fs.existsSync(filenamePath)) return;
    Object.assign(values, parseEnvFile(fs.readFileSync(filenamePath, 'utf8')));
  });

  return { ...values, ...processEnvironment };
}

function validateProductionEnv(values) {
  const errors = [];
  const provider = values.REACT_APP_AI_PROVIDER || 'firebase';

  REQUIRED_FIREBASE_KEYS.forEach((key) => {
    if (!String(values[key] || '').trim()) errors.push(`${key} is required.`);
  });

  if (provider !== 'firebase') {
    errors.push('REACT_APP_AI_PROVIDER must be firebase for a production build.');
  }
  if (!String(values.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY || '').trim()) {
    errors.push('REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY is required for production App Check.');
  }
  if (String(values.REACT_APP_FIREBASE_APPCHECK_DEBUG || '').toLowerCase() === 'true') {
    errors.push('REACT_APP_FIREBASE_APPCHECK_DEBUG must not be true in production.');
  }
  if (String(values.REACT_APP_GEMINI_API_KEY || '').trim()) {
    errors.push('REACT_APP_GEMINI_API_KEY must never be included in a browser build.');
  }

  return errors;
}

function main() {
  const values = loadProductionEnv(path.resolve(__dirname, '..'));
  const errors = validateProductionEnv(values);
  if (errors.length > 0) {
    console.error('Production environment validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log('Production environment validation passed.');
}

if (require.main === module) main();

module.exports = {
  loadProductionEnv,
  parseEnvFile,
  validateProductionEnv,
};

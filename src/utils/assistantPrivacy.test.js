import {
  containsSensitiveInformation,
  isHypotheticalFinanceScenario,
  normalizeAssistantQuestion,
  redactKnownFinanceText,
} from './assistantPrivacy';

test('allows general financial education questions', () => {
  expect(containsSensitiveInformation('What is the 50/30/20 budgeting rule?')).toBe(false);
  expect(containsSensitiveInformation('How can someone build an emergency fund?')).toBe(false);
});

test.each([
  'Email me at person@example.com',
  'Call me on 082 123 4567',
  'My ID number is 9001015009087',
  'My account number is 123456789',
  'My OTP is 123456',
  'I owe R10 000 on a loan',
  'My salary is 25000',
])('detects sensitive input: %s', (question) => {
  expect(containsSensitiveInformation(question)).toBe(true);
});

test('allows app-data questions because only an allowlisted aggregate summary can leave PennyWise', () => {
  expect(containsSensitiveInformation('Show me my spending patterns')).toBe(false);
  expect(containsSensitiveInformation('How can I improve my budget?')).toBe(false);
});

test.each([
  'lets say i have 1700 as a student, and my expenses are food, groove and takeaways; can you advise me and provide a grocery list?',
  "Let's say I have R1,700 for a sample student budget.",
  'Suppose I earn R1700 in this example.',
  'Imagine I have 1700 to divide between food and transport.',
])('allows clearly hypothetical planning amounts: %s', (question) => {
  expect(isHypotheticalFinanceScenario(question)).toBe(true);
  expect(containsSensitiveInformation(question)).toBe(false);
});

test.each([
  'I have 1700 for food and transport.',
  'My salary is R1700.',
  "My salary is R25000, let's say I spend R1000.",
  "Let's say I actually earn R1700.",
  "Let's say my current income is R1700.",
  "Let's say my account number is 123456789.",
  "Let's say my email is person@example.com.",
  "Let's say my OTP is 123456.",
])('still blocks real amounts or identifiers: %s', (question) => {
  expect(containsSensitiveInformation(question)).toBe(true);
});

test('normalizes whitespace without changing the wording', () => {
  expect(normalizeAssistantQuestion('  How   do I budget?\n')).toBe('How do I budget?');
});

test('redacts stored titles and notes from a fallback question', () => {
  const question = redactKnownFinanceText(
    'How can I spend less at Secret Merchant and reach Wedding in Cape Town?',
    {
      expenses: [{
        title: 'Secret Merchant',
        notes: 'Meet Jane after work',
        category: 'Food',
      }],
      goals: [{ title: 'Wedding in Cape Town' }],
    }
  );

  expect(question).toBe('How can I spend less at Food category spending and reach Goal 1?');
  expect(question).not.toMatch(/Secret Merchant|Wedding in Cape Town/i);
});

test('redacts short stored titles too', () => {
  expect(redactKnownFinanceText('How can I spend less at BP?', {
    expenses: [{ title: 'BP', category: 'Transport' }],
  })).toBe('How can I spend less at Transport category spending?');
});

test('redacts a stored custom category before an advice question reaches Gemini', () => {
  const redacted = redactKnownFinanceText(
    'How can I reduce my Takeaways spending?',
    { expenses: [{ title: 'Lunch', category: 'Takeaways' }] }
  );

  expect(redacted).toBe('How can I reduce my Other category spending?');
  expect(redacted).not.toMatch(/Takeaways/i);
});

test('redacts a custom budget name even before it has matching expenses', () => {
  const redacted = redactKnownFinanceText(
    'How can I reduce my Weekend groove budget?',
    { budget: { categories: { 'Weekend groove': 500 } } }
  );

  expect(redacted).toBe('How can I reduce my budget category budget?');
  expect(redacted).not.toMatch(/Weekend groove/i);
});

import {
  CORE_EXPENSE_CATEGORIES,
  cleanExpenseCategoryLabel,
  normalizeExpenseCategory,
} from './expenseCategories';

export const MAX_ASSISTANT_QUESTION_LENGTH = 500;

export const SENSITIVE_INPUT_MESSAGE =
  'For your privacy, do not type real personal amounts, account or card numbers, IDs, phone numbers, email addresses, passwords, PINs, CVVs, or OTPs. Hypothetical amounts are okay when clearly introduced with wording such as “let’s say” or “suppose”.';

export function normalizeAssistantQuestion(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function phrasePattern(value) {
  const phrase = normalizeAssistantQuestion(value);
  if (!phrase) return null;
  const pattern = phrase.split(' ').map(escapeRegExp).join('\\s+');
  return new RegExp(`(^|[^A-Z0-9])${pattern}(?=$|[^A-Z0-9])`, 'gi');
}

export function redactKnownFinanceText(
  value,
  { expenses = [], incomes = [], goals = [], budget = {} } = {}
) {
  const replacements = [];

  (Array.isArray(expenses) ? expenses : []).forEach((expense) => {
    const privateCategory = cleanExpenseCategoryLabel(expense?.category);
    const normalizedCategory = normalizeExpenseCategory(privateCategory);
    const category = CORE_EXPENSE_CATEGORIES.includes(normalizedCategory)
      ? normalizedCategory
      : 'Other';
    replacements.push([expense?.title, `${category} category spending`]);
    replacements.push([expense?.notes, '[private note]']);
    if (privateCategory && category === 'Other' && normalizedCategory !== 'Other') {
      replacements.push([privateCategory, 'Other category']);
    }
  });

  (Array.isArray(incomes) ? incomes : []).forEach((income) => {
    replacements.push([income?.title, '[income source]']);
    replacements.push([income?.notes, '[private note]']);
  });

  (Array.isArray(goals) ? goals : []).forEach((goal, index) => {
    replacements.push([goal?.title, `Goal ${index + 1}`]);
  });

  Object.keys(budget?.categories || {}).forEach((budgetCategory) => {
    const normalizedCategory = normalizeExpenseCategory(budgetCategory);
    if (!CORE_EXPENSE_CATEGORIES.includes(normalizedCategory)) {
      replacements.push([budgetCategory, 'budget category']);
    }
  });

  let redacted = String(value ?? '');
  replacements
    .filter(([privateText]) => normalizeAssistantQuestion(privateText).length > 0)
    .sort(([left], [right]) => String(right).length - String(left).length)
    .forEach(([privateText, replacement]) => {
      const pattern = phrasePattern(privateText);
      if (pattern) {
        redacted = redacted.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
      }
    });

  return normalizeAssistantQuestion(redacted);
}

const alwaysSensitivePatterns = [
  // Email addresses and South African phone numbers.
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:^|\D)(?:\+27|0)[\s-]?[1-8][0-9](?:[\s-]?\d){7}(?:\D|$)/,

  // South African identity numbers and payment-card-like digit sequences.
  /(?:^|\D)(?:\d[\s-]?){12}\d(?:\D|$)/,
  /(?:^|\D)(?:\d[\s-]?){15,18}\d(?:\D|$)/,

  // Banking identifiers or authentication secrets, even if partly redacted.
  /\b(?:bank\s+)?account\s*(?:number|no\.?|#)\b/i,
  /\b(?:credit|debit|bank)?\s*card\s*(?:number|no\.?|#)\b/i,
  /\b(?:identity|id)\s*(?:number|no\.?|#)\b/i,
  /\bmy\s+(?:password|passcode|pin|cvv|cvc|otp)\b/i,
  /\b(?:password|passcode|pin|cvv|cvc|otp)\s*(?:is|=|:)\s*\S+/i,

];

const personalFinancialAmountPattern =
  /\b(?:my\s+(?:(?:actual|real|current)\s+)?(?:salary|pay|income|debt|balance|savings?|expenses?)\s+(?:(?:actually|currently|really)\s+)?(?:is|are)|i\s+(?:(?:actually|currently|really)\s+)?(?:earn|make|owe|spend|save|have))\b[^.!?]{0,80}(?:\b(?:zar|r)\s*)?\d/i;

const hypotheticalScenarioPattern =
  /\b(?:let(?:'|’)?s\s+(?:say|assume)|let\s+us\s+(?:say|assume)|suppose|supposing|hypothetically|hypothetical(?:\s+scenario)?|imagine|assume|assuming|(?:for|as)\s+(?:an?\s+)?example|example\s+scenario|sample\s+(?:budget|scenario)|say\s+i)\b/i;

const explicitlyRealPattern =
  /\b(?:actually|in reality|in real life|real-life|my actual|my real|my current|currently|really|right now)\b/i;

export function isHypotheticalFinanceScenario(value) {
  return hypotheticalScenarioPattern.test(normalizeAssistantQuestion(value));
}

function containsRealPersonalAmount(question) {
  return question.split(/[.!?;]+/).some((clause) => {
    const financialMatch = personalFinancialAmountPattern.exec(clause);
    if (!financialMatch) return false;

    const prefix = clause.slice(Math.max(0, financialMatch.index - 160), financialMatch.index);
    return !hypotheticalScenarioPattern.test(prefix) || explicitlyRealPattern.test(clause);
  });
}

export function containsSensitiveInformation(value) {
  const question = normalizeAssistantQuestion(value);
  return alwaysSensitivePatterns.some((pattern) => pattern.test(question))
    || containsRealPersonalAmount(question);
}

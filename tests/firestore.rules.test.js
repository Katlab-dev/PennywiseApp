const fs = require('node:fs');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} = require('firebase/firestore');

const projectId = 'pennywise-rules-test';
let testEnv;

function validExpense(overrides = {}) {
  return {
    title: 'Groceries',
    amount: 250,
    category: 'Food',
    date: '2026-07-11',
    notes: '',
    type: 'expense',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

function validBudget(overrides = {}) {
  return {
    total: 5000,
    categories: { Groove: 500, Takeaways: 750 },
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function validIncome(overrides = {}) {
  return {
    title: 'Allowance',
    amount: 1200,
    category: '-',
    date: '2026-07-11',
    notes: '',
    type: 'income',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

function validGoal(overrides = {}) {
  return {
    title: 'Laptop',
    target: 1000,
    current: 0,
    deadline: '',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

test('signed-out users cannot read user finance data', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'users/alice/expenses/expense-1')));
});

test('users can create valid expenses in their own account', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(doc(db, 'users/alice/expenses/expense-1'), validExpense()));
});

test('users can save a custom expense category within the category length limit', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(
    doc(db, 'users/alice/expenses/custom-category'),
    validExpense({ category: 'School supplies' })
  ));
  await assertFails(setDoc(
    doc(db, 'users/alice/expenses/category-too-long'),
    validExpense({ category: 'x'.repeat(61) })
  ));
});

test('users cannot access another user account', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, 'users/bob/expenses/expense-1'), validExpense()));
  await assertFails(getDoc(doc(db, 'users/bob/expenses/expense-1')));
});

test('users can delete their own expense and income records', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  const expense = doc(db, 'users/alice/expenses/expense-to-delete');
  const income = doc(db, 'users/alice/income/income-to-delete');

  await assertSucceeds(setDoc(expense, validExpense()));
  await assertSucceeds(setDoc(income, validIncome()));
  await assertSucceeds(deleteDoc(expense));
  await assertSucceeds(deleteDoc(income));

  const deletedExpense = await assertSucceeds(getDoc(expense));
  const deletedIncome = await assertSucceeds(getDoc(income));
  if (deletedExpense.exists() || deletedIncome.exists()) {
    throw new Error('Expected both transaction documents to be deleted.');
  }
});

test('signed-out users and other accounts cannot delete transaction records', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'users/alice/expenses/protected-expense'), validExpense());
    await setDoc(doc(adminDb, 'users/alice/income/protected-income'), validIncome());
  });

  const signedOutDb = testEnv.unauthenticatedContext().firestore();
  const bobDb = testEnv.authenticatedContext('bob').firestore();
  await assertFails(deleteDoc(doc(signedOutDb, 'users/alice/expenses/protected-expense')));
  await assertFails(deleteDoc(doc(bobDb, 'users/alice/income/protected-income')));
});

test('invalid expense amounts and extra fields are rejected', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(
    doc(db, 'users/alice/expenses/negative'),
    validExpense({ amount: -1 })
  ));
  await assertFails(setDoc(
    doc(db, 'users/alice/expenses/extra-field'),
    validExpense({ owner: 'alice' })
  ));
});

test('goal progress cannot exceed its target', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(
    doc(db, 'users/alice/goals/goal-1'),
    validGoal({ target: 10000, current: 11000 })
  ));
});

test('goal progress can increase cumulatively up to the target', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  const goal = doc(db, 'users/alice/goals/goal-1');

  await assertSucceeds(setDoc(goal, validGoal({ current: 200 })));
  await assertSucceeds(updateDoc(goal, { current: 350, updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(goal, { current: 1000, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(goal, { current: 1000.01, updatedAt: serverTimestamp() }));

  const savedGoal = await assertSucceeds(getDoc(goal));
  if (savedGoal.data().current !== 1000) {
    throw new Error(`Expected the saved goal total to be 1000, received ${savedGoal.data().current}.`);
  }
});

test('only the current budget document is writable', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  const budget = validBudget();
  await assertSucceeds(setDoc(doc(db, 'users/alice/budgets/current'), budget));
  await assertFails(setDoc(doc(db, 'users/alice/budgets/archive'), budget));
});

test('dynamic budget categories are bounded and validated', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  const currentBudget = doc(db, 'users/alice/budgets/current');

  await assertSucceeds(setDoc(currentBudget, validBudget({
    categories: { Groove: 500, 'School supplies': 900 },
  })));
  await assertFails(setDoc(currentBudget, validBudget({
    categories: { ['x'.repeat(61)]: 100 },
  })));
  await assertFails(setDoc(currentBudget, validBudget({
    categories: { Data: 0 },
  })));
  await assertFails(setDoc(currentBudget, validBudget({
    categories: { Data: '300' },
  })));
  await assertFails(setDoc(currentBudget, validBudget({
    categories: Object.fromEntries(
      Array.from({ length: 13 }, (_, index) => [`Category ${index + 1}`, 100])
    ),
  })));
});

test('legacy fixed budget maps with zero placeholders remain writable during migration', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertSucceeds(setDoc(
    doc(db, 'users/alice/budgets/current'),
    validBudget({
      categories: { Food: 1000, Transport: 0, Rent: 2500, Other: 0 },
    })
  ));
});

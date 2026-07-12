const fs = require('node:fs');
const path = require('node:path');
const { before, beforeEach, after, test } = require('node:test');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

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

test('users cannot access another user account', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, 'users/bob/expenses/expense-1'), validExpense()));
  await assertFails(getDoc(doc(db, 'users/bob/expenses/expense-1')));
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
  await assertFails(setDoc(doc(db, 'users/alice/goals/goal-1'), {
    title: 'Laptop',
    target: 10000,
    current: 11000,
    deadline: '',
    createdAt: serverTimestamp(),
  }));
});

test('only the current budget document is writable', async () => {
  const db = testEnv.authenticatedContext('alice').firestore();
  const budget = {
    total: 5000,
    categories: { Food: 1000, Transport: 500, Rent: 2500, Other: 1000 },
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(db, 'users/alice/budgets/current'), budget));
  await assertFails(setDoc(doc(db, 'users/alice/budgets/archive'), budget));
});

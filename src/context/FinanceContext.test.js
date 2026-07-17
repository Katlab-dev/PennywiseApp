import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import {
  FinanceProvider,
  getTransactionDocumentPath,
  mapSnapshotDocument,
  normalizeTransactionKind,
  useFinance,
} from './FinanceContext';

const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn((database, ...segments) => ({ kind: 'document', segments }));
const mockCollection = jest.fn((database, ...segments) => ({ kind: 'collection', segments }));
const mockOnSnapshot = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../firebaseConfig', () => ({ db: { app: 'test' } }));

jest.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  doc: (...args) => mockDoc(...args),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  runTransaction: jest.fn(),
  query: (reference) => reference,
  orderBy: jest.fn(() => ({ field: 'createdAt', direction: 'desc' })),
  onSnapshot: (...args) => mockOnSnapshot(...args),
}));

const incomeDocument = {
  id: 'income-document-id',
  data: () => ({ id: 'legacy-income-id', title: 'Allowance', amount: 1200 }),
};

const expenseDocument = {
  id: 'expense-document-id',
  data: () => ({ id: 'legacy-expense-id', title: 'Groceries', amount: 250 }),
};

let financeApi;

function FinanceProbe() {
  financeApi = useFinance();
  return <div>{financeApi.loading ? 'loading' : 'ready'}</div>;
}

beforeEach(() => {
  financeApi = undefined;
  jest.clearAllMocks();
  mockDoc.mockImplementation((database, ...segments) => ({ kind: 'document', segments }));
  mockCollection.mockImplementation((database, ...segments) => ({ kind: 'collection', segments }));
  mockUseAuth.mockReturnValue({ currentUser: { uid: 'user-123' }, loading: false });
  mockDeleteDoc.mockResolvedValue(undefined);
  mockOnSnapshot.mockImplementation((reference, onNext) => {
    if (reference.kind === 'document') {
      onNext({ exists: () => false });
    } else if (reference.segments.at(-1) === 'income') {
      onNext({ docs: [incomeDocument] });
    } else if (reference.segments.at(-1) === 'expenses') {
      onNext({ docs: [expenseDocument] });
    } else {
      onNext({ docs: [] });
    }
    return jest.fn();
  });
});

test('uses the authoritative Firestore document ID for legacy records', () => {
  const record = mapSnapshotDocument({
    id: 'firestore-document-id',
    data: () => ({ id: 'legacy-stored-id', title: 'Allowance' }),
  });

  expect(record).toEqual({
    id: 'firestore-document-id',
    title: 'Allowance',
  });
});

test.each([
  ['Income', 'income'],
  ['income', 'income'],
  ['Expense', 'expense'],
  ['expense', 'expense'],
])('normalizes %s to the stable transaction kind %s', (value, expected) => {
  expect(normalizeTransactionKind(value)).toBe(expected);
});

test('rejects an unknown transaction kind', () => {
  expect(() => normalizeTransactionKind('transfer')).toThrow('Unknown transaction type.');
});

test.each([
  ['income', ['users', 'user-123', 'income', 'income-document-id']],
  ['expense', ['users', 'user-123', 'expenses', 'expense-document-id']],
])('builds the exact Firestore document path for %s', (kind, expected) => {
  expect(getTransactionDocumentPath('user-123', `${kind}-document-id`, kind)).toEqual({
    kind,
    segments: expected,
  });
});

test('deletes the authoritative income and expense documents and updates local state', async () => {
  render(
    <FinanceProvider>
      <FinanceProbe />
    </FinanceProvider>
  );

  await waitFor(() => expect(financeApi?.loading).toBe(false));
  expect(financeApi.incomes).toHaveLength(1);
  expect(financeApi.expenses).toHaveLength(1);

  mockDoc.mockClear();
  mockDeleteDoc.mockClear();

  await act(async () => {
    await financeApi.deleteTransaction('income-document-id', 'income');
  });

  expect(mockDoc).toHaveBeenCalledWith(
    expect.anything(),
    'users',
    'user-123',
    'income',
    'income-document-id'
  );
  expect(mockDeleteDoc).toHaveBeenCalledWith({
    kind: 'document',
    segments: ['users', 'user-123', 'income', 'income-document-id'],
  });
  expect(financeApi.incomes).toHaveLength(0);
  expect(financeApi.expenses).toHaveLength(1);

  await act(async () => {
    await financeApi.deleteTransaction('expense-document-id', 'Expense');
  });

  expect(mockDoc).toHaveBeenCalledWith(
    expect.anything(),
    'users',
    'user-123',
    'expenses',
    'expense-document-id'
  );
  expect(financeApi.expenses).toHaveLength(0);
});

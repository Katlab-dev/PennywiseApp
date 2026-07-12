import React, { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

const FinanceContext = createContext(null);

// Actions
export const HYDRATE = 'HYDRATE';
export const ADD_EXPENSE = 'ADD_EXPENSE';
export const ADD_INCOME = 'ADD_INCOME';
export const DELETE_TRANSACTION = 'DELETE_TRANSACTION';
export const RESET_ALL = 'RESET_ALL';
export const SET_BUDGET = 'SET_BUDGET';
export const ADD_GOAL = 'ADD_GOAL';
export const UPDATE_GOAL = 'UPDATE_GOAL';
export const SET_EXPENSES = 'SET_EXPENSES';
export const SET_INCOMES = 'SET_INCOMES';
export const SET_GOALS = 'SET_GOALS';

const initialState = {
  expenses: [],
  incomes: [],
  budget: {
    total: 0,
    categories: { Food: 0, Transport: 0, Rent: 0, Other: 0 },
  },
  goals: [],
};

function financeReducer(state, action) {
  switch (action.type) {
    case SET_EXPENSES:
      return { ...state, expenses: Array.isArray(action.payload) ? action.payload : [] };
    case SET_INCOMES:
      return { ...state, incomes: Array.isArray(action.payload) ? action.payload : [] };
    case SET_GOALS:
      return { ...state, goals: Array.isArray(action.payload) ? action.payload : [] };
    case HYDRATE: {
      const { expenses = [], incomes = [], budget, goals = [] } = action.payload || {};
      return { ...state, expenses, incomes, budget: budget ?? state.budget, goals };
    }
    case ADD_EXPENSE:
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case ADD_INCOME:
      return { ...state, incomes: [action.payload, ...state.incomes] };
    case RESET_ALL:
      return { ...initialState };
    case SET_BUDGET: {
      const { total = 0, categories = {} } = action.payload || {};
      return {
        ...state,
        budget: { total: Number(total) || 0, categories: { ...state.budget.categories, ...categories } },
      };
    }
    case ADD_GOAL:
      return { ...state, goals: [action.payload, ...state.goals] };
    case UPDATE_GOAL: {
      const { id, patch } = action.payload || {};
      return { ...state, goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) };
    }
    default:
      return state;
  }
}

function pathHelpers(uid) {
  return {
    expensesCol: collection(db, 'users', uid, 'expenses'),
    incomesCol: collection(db, 'users', uid, 'income'),
    goalsCol: collection(db, 'users', uid, 'goals'),
    budgetDoc: doc(db, 'users', uid, 'budgets', 'current'),
  };
}

function requireUser(user) {
  if (!user?.uid) throw new Error('You must be signed in to make this change.');
  return user.uid;
}

function cleanText(value, field, maxLength = 120, required = true) {
  const text = String(value ?? '').trim();
  if (required && !text) throw new Error(`${field} is required.`);
  if (text.length > maxLength) throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  return text;
}

function cleanAmount(value, field = 'Amount', allowZero = false) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount === 0)) {
    throw new Error(`${field} must be a valid ${allowZero ? 'non-negative' : 'positive'} number.`);
  }
  if (amount > 1000000000) throw new Error(`${field} is too large.`);
  return amount;
}

function cleanDate(value, field, required = true) {
  const date = cleanText(value, field, 10, required);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${field} must be a valid date.`);
  return date;
}

export function FinanceProvider({ children }) {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Real-time subscriptions per user
  useEffect(() => {
    let unsubs = [];
    if (!currentUser?.uid) {
      dispatch({ type: HYDRATE, payload: { ...initialState } });
      setLoading(false);
      setError('');
      return () => {};
    }

    setLoading(true);
    setError('');
    const { expensesCol, incomesCol, goalsCol, budgetDoc } = pathHelpers(currentUser.uid);
    const loaded = { e: false, i: false, g: false, b: false };
    const mark = (k) => {
      loaded[k] = true;
      if (loaded.e && loaded.i && loaded.g && loaded.b) setLoading(false);
    };

    unsubs.push(
      onSnapshot(
        query(expensesCol, orderBy('createdAt', 'desc')),
        (snap) => {
          const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          dispatch({ type: SET_EXPENSES, payload: arr });
          mark('e');
        },
        (err) => {
          console.error('Expenses snapshot error:', err);
          setError('Unable to load expenses.');
          mark('e');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(incomesCol, orderBy('createdAt', 'desc')),
        (snap) => {
          const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          dispatch({ type: SET_INCOMES, payload: arr });
          mark('i');
        },
        (err) => {
          console.error('Incomes snapshot error:', err);
          setError('Unable to load income.');
          mark('i');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        query(goalsCol, orderBy('createdAt', 'desc')),
        (snap) => {
          const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          dispatch({ type: SET_GOALS, payload: arr });
          mark('g');
        },
        (err) => {
          console.error('Goals snapshot error:', err);
          setError('Unable to load goals.');
          mark('g');
        }
      )
    );

    unsubs.push(
      onSnapshot(
        budgetDoc,
        (docSnap) => {
          const budget = docSnap.exists() ? docSnap.data() : initialState.budget;
          dispatch({
            type: SET_BUDGET,
            payload: {
              total: Number(budget?.total) || 0,
              categories: { ...initialState.budget.categories, ...(budget?.categories || {}) },
            },
          });
          mark('b');
        },
        (err) => {
          console.error('Budget snapshot error:', err);
          setError('Unable to load the budget.');
          mark('b');
        }
      )
    );

    return () => unsubs.forEach((u) => {
      try { u && u(); } catch {}
    });
  }, [currentUser]);

  // Actions -> Firestore
  const addExpense = useCallback(async (data) => {
    const uid = requireUser(currentUser);
    try {
      setError('');
      const { expensesCol } = pathHelpers(uid);
      const payload = {
        title: cleanText(data.title, 'Title'),
        amount: cleanAmount(data.amount),
        category: cleanText(data.category || 'Other', 'Category', 60),
        date: cleanDate(data.date, 'Date'),
        notes: cleanText(data.notes, 'Notes', 500, false),
        type: 'expense',
        createdAt: serverTimestamp(),
      };
      await addDoc(expensesCol, payload);
    } catch (e) {
      console.error('Failed to add expense:', e);
      setError(e.message || 'Failed to add expense.');
      throw e;
    }
  }, [currentUser]);

  const addIncome = useCallback(async (data) => {
    const uid = requireUser(currentUser);
    try {
      setError('');
      const { incomesCol } = pathHelpers(uid);
      const payload = {
        title: cleanText(data.title, 'Source'),
        amount: cleanAmount(data.amount),
        category: cleanText(data.category || '-', 'Category', 60),
        date: cleanDate(data.date, 'Date'),
        notes: cleanText(data.notes, 'Notes', 500, false),
        type: 'income',
        createdAt: serverTimestamp(),
      };
      await addDoc(incomesCol, payload);
    } catch (e) {
      console.error('Failed to add income:', e);
      setError(e.message || 'Failed to add income.');
      throw e;
    }
  }, [currentUser]);

  const addGoal = useCallback(async (data) => {
    const uid = requireUser(currentUser);
    try {
      setError('');
      const { goalsCol } = pathHelpers(uid);
      const payload = {
        title: cleanText(data.title, 'Goal title'),
        target: cleanAmount(data.target, 'Target'),
        current: cleanAmount(data.current || 0, 'Current amount', true),
        deadline: cleanDate(data.deadline, 'Deadline', false),
        createdAt: serverTimestamp(),
      };
      if (payload.current > payload.target) throw new Error('Current savings cannot exceed the target.');
      await addDoc(goalsCol, payload);
    } catch (e) {
      console.error('Failed to add goal:', e);
      setError(e.message || 'Failed to add goal.');
      throw e;
    }
  }, [currentUser]);

  const setBudget = useCallback(async (total, categories) => {
    const uid = requireUser(currentUser);
    try {
      setError('');
      const { budgetDoc } = pathHelpers(uid);
      const allowedCategories = ['Food', 'Transport', 'Rent', 'Other'];
      const payload = {
        total: cleanAmount(total, 'Total budget', true),
        categories: Object.fromEntries(allowedCategories.map((category) => [
          category,
          cleanAmount(categories?.[category] || 0, `${category} budget`, true),
        ])),
        updatedAt: serverTimestamp(),
      };
      await setDoc(budgetDoc, payload, { merge: true });
    } catch (e) {
      console.error('Failed to set budget:', e);
      setError(e.message || 'Failed to save budget.');
      throw e;
    }
  }, [currentUser]);

  const updateExpense = useCallback(async (id, patch) => {
    const uid = requireUser(currentUser);
    if (!id) throw new Error('Expense ID is required.');
    try {
      setError('');
      const cleanPatch = { ...patch };
      if ('title' in cleanPatch) cleanPatch.title = cleanText(cleanPatch.title, 'Title');
      if ('amount' in cleanPatch) cleanPatch.amount = cleanAmount(cleanPatch.amount);
      if ('category' in cleanPatch) cleanPatch.category = cleanText(cleanPatch.category, 'Category', 60);
      if ('date' in cleanPatch) cleanPatch.date = cleanDate(cleanPatch.date, 'Date');
      if ('notes' in cleanPatch) cleanPatch.notes = cleanText(cleanPatch.notes, 'Notes', 500, false);
      delete cleanPatch.type;
      delete cleanPatch.createdAt;
      const ref = doc(db, 'users', uid, 'expenses', id);
      await updateDoc(ref, { ...cleanPatch, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to update expense:', e);
      setError(e.message || 'Failed to update expense.');
      throw e;
    }
  }, [currentUser]);

  const updateIncome = useCallback(async (id, patch) => {
    const uid = requireUser(currentUser);
    if (!id) throw new Error('Income ID is required.');
    try {
      setError('');
      const cleanPatch = { ...patch };
      if ('title' in cleanPatch) cleanPatch.title = cleanText(cleanPatch.title, 'Source');
      if ('amount' in cleanPatch) cleanPatch.amount = cleanAmount(cleanPatch.amount);
      if ('category' in cleanPatch) cleanPatch.category = cleanText(cleanPatch.category, 'Category', 60);
      if ('date' in cleanPatch) cleanPatch.date = cleanDate(cleanPatch.date, 'Date');
      if ('notes' in cleanPatch) cleanPatch.notes = cleanText(cleanPatch.notes, 'Notes', 500, false);
      delete cleanPatch.type;
      delete cleanPatch.createdAt;
      const ref = doc(db, 'users', uid, 'income', id);
      await updateDoc(ref, { ...cleanPatch, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to update income:', e);
      setError(e.message || 'Failed to update income.');
      throw e;
    }
  }, [currentUser]);

  const updateGoal = useCallback(async (id, patch) => {
    const uid = requireUser(currentUser);
    if (!id) throw new Error('Goal ID is required.');
    try {
      setError('');
      const existing = state.goals.find((goal) => goal.id === id);
      const cleanPatch = { ...patch };
      if ('title' in cleanPatch) cleanPatch.title = cleanText(cleanPatch.title, 'Goal title');
      if ('target' in cleanPatch) cleanPatch.target = cleanAmount(cleanPatch.target, 'Target');
      if ('current' in cleanPatch) cleanPatch.current = cleanAmount(cleanPatch.current, 'Current amount', true);
      if ('deadline' in cleanPatch) cleanPatch.deadline = cleanDate(cleanPatch.deadline, 'Deadline', false);
      const target = cleanPatch.target ?? existing?.target;
      const current = cleanPatch.current ?? existing?.current ?? 0;
      if (Number(current) > Number(target)) throw new Error('Current savings cannot exceed the target.');
      delete cleanPatch.createdAt;
      const ref = doc(db, 'users', uid, 'goals', id);
      await updateDoc(ref, { ...cleanPatch, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to update goal:', e);
      setError(e.message || 'Failed to update goal.');
      throw e;
    }
  }, [currentUser, state.goals]);

  const deleteTransaction = useCallback(async (id, txType) => {
    const uid = requireUser(currentUser);
    if (!id) throw new Error('Transaction ID is required.');
    try {
      setError('');
      if (txType === 'Income') {
        await deleteDoc(doc(db, 'users', uid, 'income', id));
      } else if (txType === 'Expense') {
        await deleteDoc(doc(db, 'users', uid, 'expenses', id));
      } else {
        throw new Error('Unknown transaction type.');
      }
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      setError(e.message || 'Failed to delete transaction.');
      throw e;
    }
  }, [currentUser]);

  const deleteGoal = useCallback(async (id) => {
    const uid = requireUser(currentUser);
    if (!id) throw new Error('Goal ID is required.');
    try {
      setError('');
      await deleteDoc(doc(db, 'users', uid, 'goals', id));
    } catch (e) {
      console.error('Failed to delete goal:', e);
      setError(e.message || 'Failed to delete goal.');
      throw e;
    }
  }, [currentUser]);

  const totals = useMemo(() => {
    const incomes = Array.isArray(state.incomes) ? state.incomes : [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];
    const totalIncome = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [state.incomes, state.expenses]);

  const value = useMemo(
    () => ({
      loading,
      error,
      expenses: Array.isArray(state.expenses) ? state.expenses : [],
      incomes: Array.isArray(state.incomes) ? state.incomes : [],
      totals,
      addExpense,
      addIncome,
      deleteTransaction,
      resetAll: () => dispatch({ type: RESET_ALL }),
      budget: state.budget || { ...initialState.budget },
      setBudget,
      goals: Array.isArray(state.goals) ? state.goals : [],
      addGoal,
      updateGoal,
      updateExpense,
      updateIncome,
      deleteGoal,
    }),
    [
      loading,
      error,
      state.expenses,
      state.incomes,
      state.budget,
      state.goals,
      totals,
      addExpense,
      addIncome,
      deleteTransaction,
      setBudget,
      addGoal,
      updateGoal,
      updateExpense,
      updateIncome,
      deleteGoal,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

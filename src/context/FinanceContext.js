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
          mark('b');
        }
      )
    );

    return () => unsubs.forEach((u) => {
      try { u && u(); } catch {}
    });
  }, [currentUser?.uid]);

  // Actions -> Firestore
  const addExpense = useCallback(async (data) => {
    if (!currentUser?.uid) return;
    try {
      const { expensesCol } = pathHelpers(currentUser.uid);
      const payload = {
        title: data.title,
        amount: Number(data.amount) || 0,
        category: data.category || 'Other',
        date: data.date || '',
        type: 'expense',
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(expensesCol, payload);
      dispatch({ type: ADD_EXPENSE, payload: { id: ref.id, ...payload, createdAt: new Date().toISOString() } });
    } catch (e) {
      console.error('Failed to add expense:', e);
      alert('Failed to add expense. Please try again.');
    }
  }, [currentUser?.uid]);

  const addIncome = useCallback(async (data) => {
    if (!currentUser?.uid) return;
    try {
      const { incomesCol } = pathHelpers(currentUser.uid);
      const payload = {
        title: data.title,
        amount: Number(data.amount) || 0,
        category: data.category || '-',
        date: data.date || '',
        type: 'income',
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(incomesCol, payload);
      dispatch({ type: ADD_INCOME, payload: { id: ref.id, ...payload, createdAt: new Date().toISOString() } });
    } catch (e) {
      console.error('Failed to add income:', e);
      alert('Failed to add income. Please try again.');
    }
  }, [currentUser?.uid]);

  const addGoal = useCallback(async (data) => {
    if (!currentUser?.uid) return;
    try {
      const { goalsCol } = pathHelpers(currentUser.uid);
      const payload = {
        title: data.title,
        target: Number(data.target) || 0,
        current: Number(data.current) || 0,
        deadline: data.deadline || '',
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(goalsCol, payload);
      dispatch({ type: ADD_GOAL, payload: { id: ref.id, ...payload, createdAt: new Date().toISOString() } });
    } catch (e) {
      console.error('Failed to add goal:', e);
      alert('Failed to add goal. Please try again.');
    }
  }, [currentUser?.uid]);

  const setBudget = useCallback(async (total, categories) => {
    if (!currentUser?.uid) return;
    try {
      const { budgetDoc } = pathHelpers(currentUser.uid);
      const payload = {
        total: Number(total) || 0,
        categories: { ...(categories || {}) },
        updatedAt: serverTimestamp(),
      };
      await setDoc(budgetDoc, payload, { merge: true });
      dispatch({ type: SET_BUDGET, payload: { total: payload.total, categories: payload.categories } });
    } catch (e) {
      console.error('Failed to set budget:', e);
      alert('Failed to save budget. Please try again.');
    }
  }, [currentUser?.uid]);

  const updateExpense = useCallback(async (id, patch) => {
    if (!currentUser?.uid || !id) return;
    try {
      const ref = doc(db, 'users', currentUser.uid, 'expenses', id);
      await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to update expense:', e);
      alert('Failed to update expense');
    }
  }, [currentUser?.uid]);

  const updateIncome = useCallback(async (id, patch) => {
    if (!currentUser?.uid || !id) return;
    try {
      const ref = doc(db, 'users', currentUser.uid, 'income', id);
      await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to update income:', e);
      alert('Failed to update income');
    }
  }, [currentUser?.uid]);

  const updateGoal = useCallback(async (id, patch) => {
    if (!currentUser?.uid || !id) return;
    try {
      const ref = doc(db, 'users', currentUser.uid, 'goals', id);
      await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error('Failed to update goal:', e);
      alert('Failed to update goal');
    }
  }, [currentUser?.uid]);

  const deleteTransaction = useCallback(async (id, txType) => {
    if (!currentUser?.uid || !id) return;
    try {
      if (txType === 'Income') {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'income', id));
      } else if (txType === 'Expense') {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'expenses', id));
      }
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      alert('Failed to delete');
    }
  }, [currentUser?.uid]);

  const deleteGoal = useCallback(async (id) => {
    if (!currentUser?.uid || !id) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'goals', id));
    } catch (e) {
      console.error('Failed to delete goal:', e);
      alert('Failed to delete goal');
    }
  }, [currentUser?.uid]);

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

import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from './slices/expensesSlice';
import incomeReducer from './slices/incomeSlice';
import goalsReducer from './slices/goalsSlice';

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    incomes: incomeReducer,
    goals: goalsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['expenses/fetchExpenses/fulfilled', 'incomes/fetchIncomes/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.date'],
      },
    }),
});
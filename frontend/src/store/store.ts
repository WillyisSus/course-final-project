import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.ts';
// import cartReducer from './slices/cartSlice'; // Future extension!

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // cart: cartReducer, 
    // notifications: notificationReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
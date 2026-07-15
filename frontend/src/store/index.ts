import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hcpReducer from './slices/hcpSlice';
import interactionReducer from './slices/interactionSlice';
import chatReducer from './slices/chatSlice';
import agentReducer from './slices/agentSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hcp: hcpReducer,
    interaction: interactionReducer,
    chat: chatReducer,
    agent: agentReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

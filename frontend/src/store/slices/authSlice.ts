import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  } | null;
  isAuthenticated: boolean;
  token: string | null;
}

const initialState: AuthState = {
  user: {
    id: 1,
    email: 'alex.mercer@veevacrm.health',
    full_name: 'Alex Mercer (Lead Representative)',
    role: 'Senior Medical Representative'
  },
  isAuthenticated: true,
  token: 'crm-enterprise-jwt-demo-token-89123'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthState['user']>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
    }
  }
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;

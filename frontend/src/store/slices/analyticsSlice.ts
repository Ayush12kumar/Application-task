import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AnalyticsSummary, Followup } from '@/types';

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  followups: Followup[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  followups: [],
  loading: false,
  error: null,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async () => {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return await res.json() as AnalyticsSummary;
  }
);

export const fetchFollowups = createAsyncThunk(
  'analytics/fetchFollowups',
  async (hcpId?: number) => {
    let url = `${API_BASE}/followups`;
    if (hcpId) url += `?hcp_id=${hcpId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch followups');
    return await res.json() as Followup[];
  }
);

export const generateFollowupPlan = createAsyncThunk(
  'analytics/generateFollowupPlan',
  async ({ hcpId, interactionId }: { hcpId: number; interactionId?: number }) => {
    const res = await fetch(`${API_BASE}/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hcp_id: hcpId,
        interaction_id: interactionId,
        user_id: 1,
        strategy: 'auto',
        suggested_date: 'Next Tuesday'
      })
    });
    if (!res.ok) throw new Error('Failed to generate follow-up plan');
    return await res.json() as Followup;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error loading analytics';
      })
      .addCase(fetchFollowups.fulfilled, (state, action) => {
        state.followups = action.payload;
      })
      .addCase(generateFollowupPlan.fulfilled, (state, action) => {
        state.followups.unshift(action.payload);
      });
  }
});

export default analyticsSlice.reducer;

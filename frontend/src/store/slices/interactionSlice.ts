import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Interaction } from '@/types';

interface InteractionState {
  interactions: Interaction[];
  activeMode: 'structured' | 'chat';
  currentDraft: Partial<Interaction> | null;
  selectedInteractionForHistory: Interaction | null;
  loading: boolean;
  error: string | null;
}

const initialState: InteractionState = {
  interactions: [],
  activeMode: 'structured',
  currentDraft: null,
  selectedInteractionForHistory: null,
  loading: false,
  error: null,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchInteractions',
  async (params?: { search?: string; hcp_id?: number; sentiment?: string; interaction_type?: string }) => {
    let url = `${API_BASE}/interactions?limit=100`;
    if (params?.search) url += `&search=${encodeURIComponent(params.search)}`;
    if (params?.hcp_id) url += `&hcp_id=${params.hcp_id}`;
    if (params?.sentiment) url += `&sentiment=${encodeURIComponent(params.sentiment)}`;
    if (params?.interaction_type) url += `&interaction_type=${encodeURIComponent(params.interaction_type)}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch interactions');
    const data = await res.json();
    return data.items as Interaction[];
  }
);

export const createInteraction = createAsyncThunk(
  'interaction/createInteraction',
  async (payload: Partial<Interaction>) => {
    const res = await fetch(`${API_BASE}/interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create interaction');
    return await res.json() as Interaction;
  }
);

export const updateInteraction = createAsyncThunk(
  'interaction/updateInteraction',
  async ({ id, data }: { id: number; data: Partial<Interaction> }) => {
    const res = await fetch(`${API_BASE}/interaction/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update interaction');
    return await res.json() as Interaction;
  }
);

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    setActiveMode(state, action: PayloadAction<'structured' | 'chat'>) {
      state.activeMode = action.payload;
    },
    setCurrentDraft(state, action: PayloadAction<Partial<Interaction> | null>) {
      state.currentDraft = action.payload;
    },
    setSelectedInteractionForHistory(state, action: PayloadAction<Interaction | null>) {
      state.selectedInteractionForHistory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching interactions';
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.interactions.unshift(action.payload);
        state.currentDraft = null;
      })
      .addCase(updateInteraction.fulfilled, (state, action) => {
        const idx = state.interactions.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) {
          state.interactions[idx] = action.payload;
        }
      });
  }
});

export const { setActiveMode, setCurrentDraft, setSelectedInteractionForHistory } = interactionSlice.actions;
export default interactionSlice.reducer;

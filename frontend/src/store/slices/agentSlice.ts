import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LangGraphStep } from '@/types';
import { sendChatMessage } from './chatSlice';

interface AgentState {
  activeTrace: LangGraphStep[];
  history: LangGraphStep[];
  activeNode: string | null;
  totalLatencyMs: number;
  lastIntentDetected: string | null;
}

const initialState: AgentState = {
  activeTrace: [],
  history: [],
  activeNode: null,
  totalLatencyMs: 0,
  lastIntentDetected: null,
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    setActiveNode(state, action: PayloadAction<string | null>) {
      state.activeNode = action.payload;
    },
    clearTrace(state) {
      state.activeTrace = [];
      state.activeNode = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.activeNode = 'IntentDetection';
        state.activeTrace = [];
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const trace = action.payload.trace || [];
        state.activeTrace = trace;
        state.history.push(...trace);
        state.activeNode = 'DatabaseUpdater';
        state.lastIntentDetected = action.payload.intent;
        state.totalLatencyMs = trace.reduce((acc, step) => acc + (step.latency_ms || 0), 0);
      });
  }
});

export const { setActiveNode, clearTrace } = agentSlice.actions;
export default agentSlice.reducer;

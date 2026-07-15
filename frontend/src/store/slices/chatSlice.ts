import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, ExtractedPreview, LangGraphStep } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  editablePreview: ExtractedPreview | null;
  latestConfidence: number;
  isStreaming: boolean;
  sessionId: string;
}

const initialState: ChatState = {
  messages: [
    {
      id: 'welcome-1',
      session_id: 'session-demo',
      role: 'assistant',
      content: '👋 **Welcome to the AI-First CRM Assistant!**\n\nType naturally or use voice input to log your HCP interactions, request profile insights, edit past notes, or generate strategic follow-up plans. For example:\n> *"Visited Dr. Sharma today. Discussed new diabetes therapy. Doctor showed interest and requested sample packs. Follow up next Tuesday."*',
      timestamp: new Date().toLocaleTimeString()
    }
  ],
  editablePreview: null,
  latestConfidence: 0.98,
  isStreaming: false,
  sessionId: 'session-' + Math.random().toString(36).substring(2, 9),
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, sessionId, hcpId }: { message: string; sessionId: string; hcpId?: number }) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: 1,
        hcp_id: hcpId,
        message,
        mode: 'chat'
      })
    });
    if (!res.ok) throw new Error('Failed to send message to AI engine');
    return await res.json() as {
      session_id: string;
      reply: string;
      intent: string;
      extracted_preview?: ExtractedPreview;
      trace: LangGraphStep[];
      confidence_score: number;
    };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    updateEditablePreview(state, action: PayloadAction<Partial<ExtractedPreview>>) {
      if (state.editablePreview) {
        state.editablePreview = { ...state.editablePreview, ...action.payload };
      } else {
        state.editablePreview = action.payload as ExtractedPreview;
      }
    },
    clearEditablePreview(state) {
      state.editablePreview = null;
    },
    clearChatHistory(state) {
      state.messages = [
        {
          id: 'welcome-reset',
          session_id: state.sessionId,
          role: 'assistant',
          content: 'Chat session reset. Ready to log your next interaction or analyze CRM metrics!',
          timestamp: new Date().toLocaleTimeString()
        }
      ];
      state.editablePreview = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.isStreaming = true;
        // Add user message instantly
        state.messages.push({
          id: 'user-' + Date.now(),
          session_id: action.meta.arg.sessionId,
          role: 'user',
          content: action.meta.arg.message,
          timestamp: new Date().toLocaleTimeString()
        });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isStreaming = false;
        const { reply, intent, extracted_preview, trace, confidence_score } = action.payload;
        
        state.latestConfidence = confidence_score || 0.96;
        if (extracted_preview) {
          state.editablePreview = extracted_preview;
        }

        state.messages.push({
          id: 'assistant-' + Date.now(),
          session_id: state.sessionId,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString(),
          intent,
          extracted_preview,
          trace,
          confidence_score
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isStreaming = false;
        state.messages.push({
          id: 'error-' + Date.now(),
          session_id: state.sessionId,
          role: 'assistant',
          content: `❌ **AI Execution Error:** ${action.error.message || 'Unable to connect to LangGraph service.'}`,
          timestamp: new Date().toLocaleTimeString()
        });
      });
  }
});

export const { addMessage, updateEditablePreview, clearEditablePreview, clearChatHistory } = chatSlice.actions;
export default chatSlice.reducer;

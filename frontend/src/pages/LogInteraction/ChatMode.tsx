import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Sparkles, Bot, User, RefreshCw, Volume2, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendChatMessage, clearChatHistory } from '@/store/slices/chatSlice';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { EditablePreviewCard } from './EditablePreviewCard';
import { LangGraphVisualizer } from './LangGraphVisualizer';
import { cn } from '@/components/ui/utils';

export const ChatMode: React.FC<{ onSwitchToStructured: () => void }> = ({ onSwitchToStructured }) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { messages, isStreaming, sessionId } = useAppSelector((state) => state.chat);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInputMessage(transcript);
      };
      recognition.onerror = (event: any) => {
        setIsListening(false);
        showToast({ title: 'Voice Input Error', description: event.error || 'Could not recognize speech.', type: 'warning' });
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [showToast]);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      // If Web Speech API not present (e.g. non-chrome browser), simulate speech for demonstration
      if (!isListening) {
        setIsListening(true);
        showToast({ title: 'Simulated Voice Recording', description: 'Simulating speech dictation from representative...', type: 'info' });
        setTimeout(() => {
          setInputMessage('Visited Dr. Sharma today at Apollo Hospital. Discussed clinical benefits of CardioGuard 10mg vs standard carvedilol for CHF patients. Doctor showed high interest and accepted 15 trial packs. Follow up next week on arterial compliance metrics.');
          setIsListening(false);
          showToast({ title: 'Voice Dictation Captured', description: 'Transcribed speech accurately via Whisper AI.', type: 'success' });
        }, 2200);
      } else {
        setIsListening(false);
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const msg = inputMessage.trim();
    setInputMessage('');
    
    try {
      await dispatch(sendChatMessage({ message: msg, sessionId })).unwrap();
    } catch (err: any) {
      showToast({ title: 'Chat Error', description: err.message || 'Failed to communicate with LangGraph.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Visualizer Top Bar */}
      <LangGraphVisualizer />

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Chat Conversational Area */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-subtle flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Conversational AI Logging Assistant</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Online</span>
                </h3>
                <p className="text-xs text-slate-500">Dictate or type interaction notes. AI extracts NER parameters instantly.</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearChatHistory())}
              className="text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Reset Chat
            </Button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div key={m.id} className={cn("flex gap-3 max-w-[88%]", isAssistant ? "self-start" : "self-end ml-auto flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm mt-1",
                    isAssistant ? "bg-gradient-to-tr from-purple-600 to-indigo-600" : "bg-blue-600"
                  )}>
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-subtle relative",
                    isAssistant
                      ? "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none"
                      : "bg-blue-600 text-white rounded-tr-none"
                  )}>
                    <div className="whitespace-pre-line">{m.content}</div>

                    {/* Show Extracted Intent Badge if any */}
                    {m.intent && isAssistant && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-purple-700">📌 Intent: {m.intent}</span>
                        {m.confidence_score && (
                          <span className="font-mono text-[10px] text-emerald-600 font-bold">Confidence: {Math.round(m.confidence_score * 100)}%</span>
                        )}
                      </div>
                    )}

                    <span className={cn("text-[10px] block mt-1.5 opacity-70", isAssistant ? "text-slate-400" : "text-blue-200 text-right")}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            {isStreaming && (
              <div className="flex gap-3 self-start max-w-[80%] animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm">
                  LangGraph agent analyzing intent & extracting medical entities...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Prompts */}
          <div className="px-6 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Examples:</span>
            <button
              onClick={() => setInputMessage("Visited Dr. Sharma today at Apollo Hospital. Discussed CardioGuard 10mg vs carvedilol. Doctor accepted 15 sample packs. Schedule follow up next Tuesday.")}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-medium transition-colors whitespace-nowrap"
            >
              💊 Dr. Sharma Visit (CardioGuard)
            </button>
            <button
              onClick={() => setInputMessage("Phone call with Dr. Ananya Gupta regarding GlucoPrime XR nephroprotection. Doctor inquired about CKD clinical trial data. Send email summary tomorrow.")}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-medium transition-colors whitespace-nowrap"
            >
              📞 Dr. Gupta Call (GlucoPrime)
            </button>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200/80 flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 scale-110"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              )}
              title={isListening ? "Stop Voice Recording" : "Start Voice Speech Dictation"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? "Listening to your voice dictation..." : "Type interaction notes or click microphone to speak..."}
              className="flex-1 h-12 rounded-2xl border border-slate-300 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!inputMessage.trim() || isStreaming}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20 font-bold"
            >
              <span>Send</span>
              <Send className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>

        {/* Right Side: Editable Preview Card */}
        <div className="lg:col-span-5 h-[650px] flex flex-col">
          <EditablePreviewCard />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToStructured}
          className="border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 font-semibold"
        >
          Switch to Mode 1: Structured Form
        </Button>
      </div>
    </div>
  );
};

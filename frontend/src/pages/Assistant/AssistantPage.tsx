import React, { useState } from 'react';
import { Bot, Sparkles, Send, Cpu, CheckCircle2, Zap, ShieldCheck, Activity, HelpCircle, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendChatMessage } from '@/store/slices/chatSlice';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LangGraphVisualizer } from '@/pages/LogInteraction/LangGraphVisualizer';

export const AssistantPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { isStreaming, sessionId } = useAppSelector((state) => state.chat);
  const [query, setQuery] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(
    'Hello Alex! I am your LangGraph Agent powered by Groq (`gemma2-9b-it`). Ask me for doctor coaching insights, competitor analysis, or meeting preparation strategies across your 15 assigned HCPs.'
  );

  const handleRunQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isStreaming) return;

    const q = query.trim();
    setQuery('');
    try {
      const res = await dispatch(sendChatMessage({ message: q, sessionId })).unwrap();
      setLastResponse(res.reply);
      showToast({ title: 'Agent Inference Complete', description: `Executed via LangGraph state machine.`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'AI Assistant Error', description: err.message || 'Could not connect to AI engine.', type: 'error' });
    }
  };

  const samplePrompts = [
    "Provide coaching advice for my upcoming visit with Dr. Rajesh Sharma regarding CardioGuard 10mg.",
    "Summarize clinical questions and objections raised by Dr. Ananya Gupta during our last diabetes review.",
    "Generate a 3-month multi-channel engagement plan for all Priority A endocrinologists in Delhi.",
    "Analyze sentiment trends and high priority actions pending across my territory."
  ];

  const toolsList = [
    { name: 'Tool 1: Log Interaction', desc: 'Parses natural language notes into structured HCP visit records with NER extraction.', icon: '📝' },
    { name: 'Tool 2: Edit Interaction', desc: 'Applies targeted revisions and maintains versioned audit trails.', icon: '✏️' },
    { name: 'Tool 3: Retrieve HCP Profile', desc: 'Fetches 360° doctor relationship metrics, risk indices, and sample histories.', icon: '🩺' },
    { name: 'Tool 4: Generate Follow-up Plan', desc: 'Synthesizes clinical dossiers and talking points for next interaction cycles.', icon: '📅' },
    { name: 'Tool 5: Meeting Insights & Scoring', desc: 'Calculates engagement score and evaluates sample uptake velocity.', icon: '🧠' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-elevated border border-purple-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>LangGraph Multi-Tool State Machine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            AI Clinical Coaching & Strategic Assistant
          </h1>
          <p className="text-sm text-purple-100 leading-relaxed">
            Harness the power of Groq inference (`gemma2-9b-it` & `llama-3.3-70b-versatile`) with 5 specialized LangGraph tools. Ask complex strategic questions or simulate doctor negotiations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Badge variant="purple" className="px-3 py-1.5 text-xs font-bold bg-purple-500/30 text-purple-200 border-purple-400/40">
            ● 5/5 Tools Armed
          </Badge>
        </div>
      </div>

      {/* Visualizer */}
      <LangGraphVisualizer />

      {/* Main Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Query Interface */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <span>Ask the Strategic Assistant</span>
            </h3>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 min-h-[160px] text-sm text-slate-800 leading-relaxed relative font-medium">
              <div className="absolute top-3 right-3 text-xs font-mono text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded">
                AI Response Output
              </div>
              {isStreaming ? (
                <div className="flex items-center gap-2.5 text-purple-700 font-semibold py-8 justify-center animate-pulse">
                  <Activity className="w-5 h-5 animate-spin" />
                  <span>LangGraph Agent Reasoning & Querying Tools...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line pt-4">{lastResponse}</div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleRunQuery} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your strategic coaching prompt or query..."
                className="flex-1 h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!query.trim() || isStreaming}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold"
              >
                <span>Infer</span>
                <Send className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Recommended Strategy Prompts:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="text-left text-xs p-3 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-900 font-medium transition-colors border border-transparent hover:border-purple-200"
                  >
                    💡 {p}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: The 5 Tools breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-t-4 border-t-purple-600 space-y-4">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <span>Armed LangGraph Tool Ecosystem</span>
            </h4>
            <p className="text-xs text-slate-500">
              When you prompt the agent, our deterministic heuristic selector matches user intent and executes these specialized Python modules:
            </p>

            <div className="space-y-3">
              {toolsList.map((tool, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 hover:border-purple-300 transition-all">
                  <span className="text-xl mt-0.5">{tool.icon}</span>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 flex items-center justify-between">
                      <span>{tool.name}</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Active</span>
                    </h5>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Bot, Cpu, ArrowRight, CheckCircle2, Clock, Sparkles, Activity } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/components/ui/utils';

export const LangGraphVisualizer: React.FC = () => {
  const { activeTrace, activeNode, totalLatencyMs } = useAppSelector((state) => state.agent);
  const { isStreaming } = useAppSelector((state) => state.chat);

  const defaultNodes = [
    { id: 'IntentDetection', label: 'Intent Detection', icon: '🎯' },
    { id: 'EntityExtraction', label: 'Entity Extraction (NER)', icon: '🧬' },
    { id: 'ToolSelector', label: 'Tool Selector', icon: '⚡' },
    { id: 'ExecuteTool', label: 'Execute Tool', icon: '🛠️' },
    { id: 'LLMResponseGenerator', label: 'LLM Response', icon: '✨' },
    { id: 'DatabaseUpdater', label: 'Database Updater', icon: '💾' }
  ];

  const getStepData = (nodeId: string) => {
    return activeTrace.find((step) => step.node === nodeId);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-0 shadow-premium p-6">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-slate-700/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>LangGraph Execution Trace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Multi-Agent StateGraph
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Real-time node transitions, tool selection, and model inference trace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isStreaming ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Inference in Progress...</span>
            </div>
          ) : activeTrace.length > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed in {totalLatencyMs.toFixed(1)} ms</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Node Flow Diagram */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {defaultNodes.map((node, idx) => {
          const stepData = getStepData(node.id);
          const isCurrent = activeNode === node.id || (isStreaming && !stepData && idx === 0);
          const isCompleted = !!stepData;

          return (
            <div
              key={node.id}
              className={cn(
                "p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[105px]",
                isCompleted
                  ? "bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                  : isCurrent
                  ? "bg-purple-900/60 border-purple-400 animate-pulse shadow-lg shadow-purple-500/20"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-500"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{node.icon}</span>
                {isCompleted ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded">
                    {stepData?.latency_ms ? `${stepData.latency_ms}ms` : '✓'}
                  </span>
                ) : isCurrent ? (
                  <span className="text-[9px] font-bold text-purple-300 uppercase animate-pulse bg-purple-950 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                ) : null}
              </div>

              <div>
                <h5 className={cn("text-xs font-bold leading-tight", isCompleted || isCurrent ? "text-white" : "text-slate-400")}>
                  {node.label}
                </h5>
                {stepData?.tool_used && stepData.tool_used !== 'none' && (
                  <div className="mt-1">
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      🛠️ {stepData.tool_used.replace('tool_', '')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Step Summary Log if trace exists */}
      {activeTrace.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/80 space-y-2 max-h-40 overflow-y-auto pr-2 font-mono text-[11px] bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
          {activeTrace.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
              <span className="text-purple-400 font-bold">[{step.node}]</span>
              {step.tool_used && step.tool_used !== 'none' && (
                <span className="text-blue-300 font-semibold">({step.tool_used}):</span>
              )}
              <span className="text-slate-300 flex-1 leading-snug">{step.output_summary}</span>
              <span className="text-slate-500 text-[10px] ml-1">{step.latency_ms}ms</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

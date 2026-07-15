import React, { useState } from 'react';
import { FileText, Bot, Sparkles, ShieldCheck, Activity, HelpCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveMode } from '@/store/slices/interactionSlice';
import { StructuredFormMode } from './StructuredFormMode';
import { ChatMode } from './ChatMode';
import { cn } from '@/components/ui/utils';

export const LogInteractionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeMode } = useAppSelector((state) => state.interaction);

  const handleModeChange = (mode: 'structured' | 'chat') => {
    dispatch(setActiveMode(mode));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-elevated relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI-First CRM HCP Module</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Log Medical Representative Interaction
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Record healthcare professional visits, sample distributions, and clinical sentiment using our dual-mode interface. Choose between traditional structured validation or conversational speech dictation.
          </p>
        </div>

        {/* Master Switch Mode Selector */}
        <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1.5 relative z-10 flex-shrink-0 self-start md:self-center">
          <button
            onClick={() => handleModeChange('structured')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
              activeMode === 'structured'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Mode 1: Structured Form</span>
          </button>

          <button
            onClick={() => handleModeChange('chat')}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
              activeMode === 'chat'
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            )}
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span>Mode 2: Conversational AI Chat</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
              Voice + NER
            </span>
          </button>
        </div>
      </div>

      {/* Mode Render Area */}
      <div className="mt-6">
        {activeMode === 'structured' ? (
          <StructuredFormMode onSwitchToChat={() => handleModeChange('chat')} />
        ) : (
          <ChatMode onSwitchToStructured={() => handleModeChange('structured')} />
        )}
      </div>
    </div>
  );
};

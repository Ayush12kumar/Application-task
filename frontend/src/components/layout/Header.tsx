import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, PlusCircle, User, ShieldAlert } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAppSelector((state) => state.auth);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/hcps?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-18 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
      {/* Global HCP Search */}
      <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Doctor, Hospital, or Specialization..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 rounded-2xl border border-transparent focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-800 placeholder:text-slate-400"
        />
      </form>

      {/* Right Action Area */}
      <div className="flex items-center gap-4">
        {/* Model Indicator Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Groq AI: <strong className="font-mono">gemma2-9b-it</strong></span>
        </div>

        {/* Quick Log Interaction Shortcut */}
        <button
          onClick={() => navigate('/log-interaction')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Interaction</span>
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">{user?.full_name || 'Alex Mercer'}</h4>
            <p className="text-[11px] font-medium text-slate-500">{user?.role || 'Lead Representative'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

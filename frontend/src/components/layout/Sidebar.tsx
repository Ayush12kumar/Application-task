import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  History, 
  Bot, 
  BarChart3, 
  Settings, 
  Activity,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { cn } from '@/components/ui/utils';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { 
      to: '/log-interaction', 
      label: 'Log Interaction', 
      icon: <FileText className="w-5 h-5" />, 
      badge: 'AI Active',
      badgeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-sm'
    },
    { to: '/hcps', label: 'HCP Directory', icon: <Users className="w-5 h-5" /> },
    { to: '/interactions', label: 'Interactions Audit', icon: <History className="w-5 h-5" /> },
    { 
      to: '/assistant', 
      label: 'AI Assistant', 
      icon: <Bot className="w-5 h-5 text-purple-600" />,
      badge: 'LangGraph',
      badgeColor: 'bg-purple-100 text-purple-800 font-bold'
    },
    { to: '/analytics', label: 'Analytics & KPIs', icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-30 shadow-subtle flex-shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-b from-blue-50/50 to-transparent">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight flex items-center gap-1.5">
            HealthCloud
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">AI</span>
          </h1>
          <p className="text-[11px] font-medium text-slate-500 tracking-wide">Veeva CRM HCP Suite</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <span className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600")}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                      isActive ? "bg-white/20 text-white" : item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer / AI Status Card */}
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-bold tracking-wide uppercase text-slate-300">LangGraph Active</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
          Powered by Groq <code className="text-amber-300 font-mono text-[10px]">gemma2-9b-it</code> for real-time clinical NER & sentiment extraction.
        </p>
        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-700 text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            PostgreSQL ORM
          </span>
          <span className="text-emerald-400 font-semibold">● Online</span>
        </div>
      </div>
    </aside>
  );
};

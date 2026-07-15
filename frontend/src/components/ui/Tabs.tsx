import React from 'react';
import { cn } from './utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex space-x-1 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-1",
              isActive
                ? "bg-white text-blue-700 shadow-sm border border-slate-200/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            {tab.icon && <span className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-slate-500")}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", isActive ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700")}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

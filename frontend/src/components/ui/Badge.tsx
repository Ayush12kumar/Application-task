import React from 'react';
import { cn } from './utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'neutral', ...props }) => {
  const variants = {
    primary: "bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200 font-medium",
    purple: "bg-purple-50 text-purple-700 border border-purple-200/60 font-semibold",
  };

  return (
    <span
      className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs transition-colors", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};

import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 transition-all duration-300",
        hoverEffect && "hover:shadow-premium hover:border-blue-200/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

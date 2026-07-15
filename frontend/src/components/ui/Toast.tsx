import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from './utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(({ title, description, type }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
            error: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
          };
          const borders = {
            success: 'border-emerald-200 bg-emerald-50/90',
            error: 'border-rose-200 bg-rose-50/90',
            warning: 'border-amber-200 bg-amber-50/90',
            info: 'border-blue-200 bg-blue-50/90',
          };

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-premium backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-8",
                borders[t.type]
              )}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800">{t.title}</h4>
                {t.description && <p className="text-xs text-slate-600 mt-0.5">{t.description}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

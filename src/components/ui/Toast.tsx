'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'drink';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  showDrinkToast: (message: string, drinkCount?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const showDrinkToast = useCallback((message: string, drinkCount = 1) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = {
      id,
      message: `🍺 ${message} ${drinkCount > 1 ? `x${drinkCount}` : ''}`,
      type: 'drink',
      duration: 4000
    };

    setToasts(prev => [...prev, toast]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  function getToastClasses(type: Toast['type']) {
    const baseClasses = 'toast';
    const typeClasses = {
      info: 'bg-blue-500/90 text-white',
      success: 'bg-success/90 text-white',
      warning: 'bg-warning/90 text-gray-900',
      error: 'bg-danger/90 text-white',
      drink: 'toast-drink'
    };
    return `${baseClasses} ${typeClasses[type]}`;
  }

  return (
    <ToastContext.Provider value={{ showToast, showDrinkToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={getToastClasses(toast.type)}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Simple toast utility hook
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// Simple in-memory store for toasts
let toastStore: ToastStore = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  clearAll: () => {},
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Update store reference
  toastStore = {
    toasts,
    addToast: (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = { ...toast, id };
      
      setToasts(prev => [...prev, newToast]);
      
      // Auto remove after duration
      const duration = toast.duration || 5000;
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    },
    removeToast: (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    },
    clearAll: () => {
      setToasts([]);
    },
  };

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    toastStore.addToast(options);
  }, []);

  return {
    toast,
    toasts,
    removeToast: toastStore.removeToast,
    clearAll: toastStore.clearAll,
  };
}

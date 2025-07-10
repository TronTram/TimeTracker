"use client";

import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
        success:
          'border-green-500 bg-green-50 text-green-900 dark:bg-green-900/10 dark:text-green-400',
        warning:
          'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/10 dark:text-yellow-400',
        info:
          'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/10 dark:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  duration?: number;
  persistent?: boolean;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({
    className,
    variant,
    title,
    description,
    action,
    onClose,
    duration = 5000,
    persistent = false,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (!persistent && duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleClose();
        }, duration);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [duration, persistent]);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 150); // Wait for animation to complete
    };

    if (!isVisible) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          toastVariants({ variant }),
          'animate-in slide-in-from-right-full',
          !isVisible && 'animate-out slide-out-to-right-full',
          className
        )}
        {...props}
      >
        <div className="grid gap-1">
          {title && (
            <div className="text-sm font-semibold">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        {action}
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

// Toast Container for managing multiple toasts
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: ToastProps) => {
    const id = Math.random().toString(36).substring(2);
    const newToast = { ...toast, id };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });
  }, [maxToasts]);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Expose addToast function globally
  React.useEffect(() => {
    (window as any).addToast = addToast;
    return () => {
      delete (window as any).addToast;
    };
  }, [addToast]);

  return (
    <div
      className={cn(
        'fixed z-[100] flex max-h-screen w-full flex-col-reverse space-y-4 space-y-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:space-y-0',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id!)}
        />
      ))}
    </div>
  );
};

// Toast hook for easy usage
export const useToast = () => {
  const toast = React.useCallback((props: ToastProps) => {
    if ((window as any).addToast) {
      (window as any).addToast(props);
    }
  }, []);

  return {
    toast,
    success: (title: string, description?: string) =>
      toast({ variant: 'success', title, description }),
    error: (title: string, description?: string) =>
      toast({ variant: 'destructive', title, description }),
    warning: (title: string, description?: string) =>
      toast({ variant: 'warning', title, description }),
    info: (title: string, description?: string) =>
      toast({ variant: 'info', title, description }),
  };
};

export { Toast, ToastContainer, toastVariants };

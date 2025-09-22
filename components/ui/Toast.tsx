import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    { id, title, description, type = "info", duration = 5000, onClose },
    ref
  ) => {
    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          onClose(id);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [id, duration, onClose]);

    const icons = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: Info,
    };

    const colors = {
      success: "bg-accent-600 text-white",
      error: "bg-danger-600 text-white",
      warning: "bg-warn-600 text-white",
      info: "bg-primary-600 text-white",
    };

    const Icon = icons[type];

    return (
      <div
        ref={ref}
        className={cn(
          "animate-slide-up relative flex w-full items-center space-x-4 overflow-hidden rounded-lg p-4 pr-8 shadow-lg",
          colors[type]
        )}
        role="alert"
        aria-live="polite"
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          {title && <p className="text-sm font-medium">{title}</p>}
          {description && (
            <p className="mt-1 text-sm opacity-90">{description}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="absolute top-2 right-2 rounded-md p-1 transition-colors hover:bg-black/10"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);

Toast.displayName = "Toast";

// Toast context and provider
interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: removeToast,
      };
      setToasts(prev => [...prev, newToast]);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast container component
function ToastContainer({ toasts }: { toasts: ToastProps[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}

// Simple Toast component for basic usage
export interface SimpleToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export function SimpleToast({ message, type, onClose }: SimpleToastProps) {
  const colors = {
    success: "bg-accent-600 text-white",
    error: "bg-danger-600 text-white",
    warning: "bg-warn-600 text-white",
    info: "bg-primary-600 text-white",
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex w-full max-w-sm items-center space-x-4 overflow-hidden rounded-lg p-4 pr-8 shadow-lg animate-slide-up",
        colors[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 rounded-md p-1 transition-colors hover:bg-black/10"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Convenience functions
export const toast = {
  success: (title: string, description?: string) => ({
    type: "success" as const,
    title,
    description,
  }),
  error: (title: string, description?: string) => ({
    type: "error" as const,
    title,
    description,
  }),
  warning: (title: string, description?: string) => ({
    type: "warning" as const,
    title,
    description,
  }),
  info: (title: string, description?: string) => ({
    type: "info" as const,
    title,
    description,
  }),
};

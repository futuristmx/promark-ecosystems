'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  show: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  success: {
    bg: 'rgba(47,107,79,0.08)',
    border: 'rgba(47,107,79,0.3)',
    color: '#2F6B4F',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  error: {
    bg: 'rgba(180,35,24,0.08)',
    border: 'rgba(180,35,24,0.3)',
    color: '#B42318',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  warning: {
    bg: 'rgba(211,154,43,0.1)',
    border: 'rgba(211,154,43,0.3)',
    color: '#D39A2B',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  info: {
    bg: 'rgba(53,91,111,0.1)',
    border: 'rgba(53,91,111,0.3)',
    color: '#355B6F',
    icon: <Info className="h-4 w-4" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const success = useCallback((title: string, description?: string) => show({ tone: 'success', title, description }), [show]);
  const error = useCallback((title: string, description?: string) => show({ tone: 'error', title, description }), [show]);
  const info = useCallback((title: string, description?: string) => show({ tone: 'info', title, description }), [show]);
  const warning = useCallback((title: string, description?: string) => show({ tone: 'warning', title, description }), [show]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      {/* Toast viewport */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const s = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in slide-in-from-right-4"
              style={{
                background: '#FBF6EC',
                borderColor: s.border,
                boxShadow: '0 10px 30px rgba(11,31,42,0.12)',
              }}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: '#0F2E3D' }}>
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-xs" style={{ color: '#355B6F' }}>
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 transition-colors hover:bg-[#E2DED6]"
                style={{ color: '#355B6F' }}
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback noop in case provider missing
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    } satisfies ToastContextValue;
  }
  return ctx;
}

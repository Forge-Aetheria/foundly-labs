'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Stack, Typography } from '@foundly/ui';

/**
 * Global toast system (feature 016, US1). Lives in `apps/book` shared components
 * and reuses `@foundly/ui` tokens (no third-party dependency). Four semantic
 * kinds map to the canonical accent palette; toasts are dismissible, announced
 * to assistive tech and auto-hide.
 */
export type ToastKind = 'success' | 'warning' | 'info' | 'error';

export interface ToastOptions {
  durationMs?: number;
}

export interface ToastApi {
  success(message: string, opts?: ToastOptions): void;
  warning(message: string, opts?: ToastOptions): void;
  info(message: string, opts?: ToastOptions): void;
  error(message: string, opts?: ToastOptions): void;
  dismiss(id: string): void;
}

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  durationMs: number;
}

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 4000,
  warning: 4000,
  info: 4000,
  error: 8000,
};

const PALETTE: Record<ToastKind, { main: string; soft: string }> = {
  success: { main: 'success.main', soft: 'success.light' },
  warning: { main: 'warning.main', soft: 'warning.light' },
  info: { main: 'info.main', soft: 'info.light' },
  error: { main: 'error.main', soft: 'error.light' },
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, opts?: ToastOptions) => {
      const id = `toast-${++counter.current}`;
      const durationMs = opts?.durationMs ?? DEFAULT_DURATION[kind];
      setToasts((prev) => [...prev, { id, kind, message, durationMs }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), durationMs),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        clearTimeout(timer);
      }
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, opts) => push('success', message, opts),
      warning: (message, opts) => push('warning', message, opts),
      info: (message, opts) => push('info', message, opts),
      error: (message, opts) => push('error', message, opts),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Stack
        role="region"
        aria-label="Notificaciones"
        spacing={1}
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.snackbar,
          bottom: 16,
          right: 16,
          width: { xs: 'calc(100% - 32px)', sm: 360 },
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const palette = PALETTE[toast.kind];
          return (
            <Stack
              key={toast.id}
              direction="row"
              alignItems="center"
              spacing={1}
              role={toast.kind === 'error' ? 'alert' : 'status'}
              aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
              sx={{
                pointerEvents: 'auto',
                backgroundColor: palette.soft,
                border: '1px solid',
                borderColor: palette.main,
                borderLeftWidth: 4,
                borderRadius: 2,
                p: 1.5,
                boxShadow: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.primary', flex: 1 }}>
                {toast.message}
              </Typography>
              <Button
                variant="secondary"
                aria-label="Cerrar notificación"
                onClick={() => dismiss(toast.id)}
                sx={{ minHeight: 0, minWidth: 0, px: 1, py: 0.5 }}
              >
                Cerrar
              </Button>
            </Stack>
          );
        })}
      </Stack>
    </ToastContext.Provider>
  );
}

/** Access the toast API. Throws when used outside `ToastProvider`. */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

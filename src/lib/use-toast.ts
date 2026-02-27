'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  onUndo?: () => void;
}

interface ToastContextValue {
  toast: Toast | null;
  show: (message: string, onUndo?: () => void) => void;
  dismiss: () => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toast: null,
  show: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function useToastState() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const show = useCallback((message: string, onUndo?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = crypto.randomUUID();
    setToast({ id, message, onUndo });
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = undefined;
    }, 5000);
  }, []);

  return { toast, show, dismiss };
}

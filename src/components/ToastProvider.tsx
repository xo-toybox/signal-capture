'use client';

import { type ReactNode } from 'react';
import { ToastContext, useToastState } from '@/lib/use-toast';
import Toast from './Toast';

export default function ToastProvider({ children }: { children: ReactNode }) {
  const state = useToastState();

  return (
    <ToastContext value={state}>
      {children}
      <Toast />
    </ToastContext>
  );
}

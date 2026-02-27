'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isInputFocused } from '@/lib/is-input-focused';

const G_ROUTES: Record<string, string> = {
  s: '/',
  p: '/projects',
  b: '/blog',
  d: '/docs',
};

/**
 * Handles G-prefixed navigation: G+S → Signals, G+P → Projects, etc.
 * Returns `pending` when G is pressed and waiting for second key.
 */
export function useKeySequence() {
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const cancel = useCallback(() => {
    setPending(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused() || e.metaKey || e.ctrlKey || e.altKey) return;

      if (pending) {
        cancel();
        const route = G_ROUTES[e.key];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        return;
      }

      if (e.key === 'g') {
        setPending(true);
        timerRef.current = setTimeout(cancel, 1000);
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pending, cancel, router]);

  return { pending };
}

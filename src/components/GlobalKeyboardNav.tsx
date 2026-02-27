'use client';

import { useEffect, useState } from 'react';
import { useKeySequence } from '@/lib/use-key-sequence';
import { isInputFocused } from '@/lib/is-input-focused';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

export default function GlobalKeyboardNav() {
  const { pending } = useKeySequence();
  const [helpOpen, setHelpOpen] = useState(false);

  // ? to open help
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInputFocused()) return;
      e.preventDefault();
      setHelpOpen(true);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* G-prefix indicator */}
      {pending && (
        <div className="fixed top-3 right-3 z-[60] px-2.5 py-1 rounded border border-white/[0.08] bg-[#1a1a1a] text-[10px] font-mono text-[#888888] toast-enter">
          g...
        </div>
      )}

      {helpOpen && <KeyboardShortcutsModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}

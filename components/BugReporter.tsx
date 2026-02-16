'use client';

import { useCallback, useEffect, useState } from 'react';
import { initErrorBuffer } from '@/lib/console-error-buffer';
import BugReporterModal from './BugReporterModal';

export default function BugReporter() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ url: string; number: number } | null>(null);

  // Init error buffer once on mount
  useEffect(() => {
    initErrorBuffer();
  }, []);

  // Cmd+Shift+B shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleSuccess = useCallback((url: string, number: number) => {
    setModalOpen(false);
    setToast({ url, number });
  }, []);

  return (
    <>
      <BugReporterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {toast && (
        <a
          href={toast.url}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-[#22c55e]/15 bg-[#22c55e]/[0.05] rounded-[8px] toast-enter no-underline hover:border-[#22c55e]/30 transition-colors"
        >
          <span className="block w-[5px] h-[5px] rounded-full bg-[#22c55e]" style={{ boxShadow: '0 0 6px #22c55e' }} />
          <span className="font-mono text-[12px] text-[#22c55e]">
            Issue #{toast.number} created
          </span>
          <span className="text-[#22c55e]/60 text-[12px]">↗</span>
        </a>
      )}
    </>
  );
}

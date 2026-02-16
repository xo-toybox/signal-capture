'use client';

import { useCallback, useEffect, useState } from 'react';
import { initErrorBuffer } from '@/lib/console-error-buffer';
import BugReporterModal from './BugReporterModal';

export default function BugReporter() {
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ url: string; number: number } | null>(null);

  useEffect(() => {
    initErrorBuffer();
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
      {/* Trigger — fixed bottom-right pill */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Report a bug"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 border border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-sm rounded-full cursor-pointer transition-all duration-150 hover:border-[#ef4444]/25 hover:bg-[#ef4444]/[0.04] group"
      >
        <span className="block w-1.5 h-1.5 rounded-full bg-[#ef4444] transition-shadow duration-150 group-hover:shadow-[0_0_6px_#ef4444]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#525252] transition-colors duration-150 group-hover:text-[#737373]">
          report
        </span>
      </button>

      <BugReporterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Success toast — positioned above trigger */}
      {toast && (
        <a
          href={toast.url}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-14 right-4 z-50 flex items-center gap-2 px-3 py-2 border border-[#22c55e]/15 bg-[#0a0a0a]/90 backdrop-blur-sm rounded-[8px] toast-enter no-underline hover:border-[#22c55e]/30 transition-colors"
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

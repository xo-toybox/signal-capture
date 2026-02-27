'use client';

import { useToast } from '@/lib/use-toast';

export default function Toast() {
  const { toast, dismiss } = useToast();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] toast-enter">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-lg shadow-black/40">
        <span className="text-xs font-mono text-[#e5e5e5]">
          {toast.message}
        </span>
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              dismiss();
            }}
            className="text-xs font-mono font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors duration-150 uppercase tracking-wider"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

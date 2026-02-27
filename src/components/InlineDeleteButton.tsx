'use client';

import { useCallback } from 'react';
import { deleteSignal, restoreSignal } from '@/lib/signal-actions';
import { useToast } from '@/lib/use-toast';
import type { SignalFeedItem } from '@/lib/types';

interface Props {
  signal: SignalFeedItem;
}

export default function InlineDeleteButton({ signal }: Props) {
  const { show } = useToast();

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic: realtime will remove from feed
    deleteSignal(signal.id).catch(() => {});

    show('Signal deleted', () => {
      restoreSignal(signal.raw_input, signal.source_url).catch(() => {});
    });
  }, [signal.id, signal.raw_input, signal.source_url, show]);

  return (
    <button
      onClick={handleClick}
      className="px-2 py-1 min-w-[28px] min-h-[28px] flex items-center justify-center text-[#888888] text-base leading-none group-hover:text-[#a0a0a0] hover:text-[#ef4444] transition-all duration-150"
    >
      ×
    </button>
  );
}

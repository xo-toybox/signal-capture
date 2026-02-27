'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSignal, restoreSignal } from '@/lib/signal-actions';
import { useToast } from '@/lib/use-toast';

interface Props {
  id: string;
  rawInput: string;
  sourceUrl: string | null;
}

export default function DeleteButton({ id, rawInput, sourceUrl }: Props) {
  const router = useRouter();
  const { show } = useToast();

  const handleClick = useCallback(async () => {
    deleteSignal(id).catch(() => {});
    router.push('/');
    show('Signal deleted', () => {
      restoreSignal(rawInput, sourceUrl).catch(() => {});
    });
  }, [id, rawInput, sourceUrl, router, show]);

  return (
    <button
      onClick={handleClick}
      className="text-xs font-mono uppercase tracking-wider border px-3 py-1.5 text-[#888888] border-white/[0.06] hover:text-[#ef4444] hover:border-[#ef4444]/40 transition-colors"
    >
      delete
    </button>
  );
}

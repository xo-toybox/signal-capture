'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const handleClick = useCallback(async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    const res = await fetch(`/api/signals?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/');
    } else {
      setDeleting(false);
      setConfirming(false);
    }
  }, [confirming, id, router]);

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className={`text-xs font-mono uppercase tracking-wider border px-3 py-1.5 transition-colors ${
        confirming
          ? 'text-[#ef4444] border-[#ef4444]/40 hover:bg-[#ef4444]/10'
          : 'text-[#525252] border-white/[0.06] hover:text-[#737373] hover:border-white/10'
      } disabled:opacity-50`}
    >
      {deleting ? 'deleting...' : confirming ? 'confirm delete' : 'delete'}
    </button>
  );
}

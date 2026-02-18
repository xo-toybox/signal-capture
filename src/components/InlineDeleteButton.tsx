'use client';

import { useState, useEffect, useRef } from 'react';

export default function InlineDeleteButton({ signalId }: { signalId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setDeleting(true);

    try {
      const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, { method: 'DELETE' });
      if (!res.ok) {
        setDeleting(false);
        setConfirming(false);
      }
      // Realtime will handle UI removal on success
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (deleting) {
    return (
      <span className="text-[10px] font-mono text-[#888888] px-2">...</span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`px-2 py-1 min-w-[28px] min-h-[28px] flex items-center justify-center transition-all duration-150 ${
        confirming
          ? 'text-[#ef4444] text-[10px] font-mono opacity-100'
          : 'text-[#888888] text-base leading-none group-hover:text-[#a0a0a0] hover:text-[#ef4444]'
      }`}
    >
      {confirming ? 'delete?' : '×'}
    </button>
  );
}

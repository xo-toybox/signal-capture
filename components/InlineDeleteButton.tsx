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
      <span className="text-[10px] font-mono text-[#525252] px-1">...</span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`px-1 text-xs font-mono transition-all duration-150 ${
        confirming
          ? 'text-[#ef4444] opacity-100'
          : 'text-[#525252] opacity-0 group-hover:opacity-100 hover:text-[#ef4444]'
      }`}
    >
      {confirming ? 'delete?' : '×'}
    </button>
  );
}

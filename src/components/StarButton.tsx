'use client';

import { useEffect, useState } from 'react';
import { toggleStar } from '@/lib/signal-actions';

interface Props {
  signalId: string;
  isStarred: boolean;
  onChange?: (starred: boolean) => void;
}

export default function StarButton({ signalId, isStarred, onChange }: Props) {
  const [starred, setStarred] = useState(isStarred);
  const [busy, setBusy] = useState(false);

  // Sync with prop changes (e.g. from realtime updates)
  useEffect(() => {
    setStarred(isStarred);
  }, [isStarred]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const next = !starred;
    setBusy(true);
    setStarred(next);
    onChange?.(next);

    try {
      await toggleStar(signalId, starred);
    } catch {
      setStarred(!next);
      onChange?.(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`px-1 text-sm transition-all duration-150 ${
        starred
          ? 'text-[#eab308] opacity-100'
          : 'text-[#525252] group-hover:text-[#737373] hover:text-[#eab308]'
      }`}
      aria-label={starred ? 'Unstar signal' : 'Star signal'}
    >
      {starred ? '\u2605' : '\u2606'}
    </button>
  );
}

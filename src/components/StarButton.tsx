'use client';

import { useState } from 'react';

interface Props {
  signalId: string;
  isStarred: boolean;
  onChange?: (starred: boolean) => void;
}

export default function StarButton({ signalId, isStarred, onChange }: Props) {
  const [starred, setStarred] = useState(isStarred);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const next = !starred;
    setBusy(true);
    setStarred(next);
    onChange?.(next);

    try {
      const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: next }),
      });
      if (!res.ok) throw new Error();
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
          : 'text-[#525252] opacity-0 group-hover:opacity-100 hover:text-[#eab308]'
      }`}
      aria-label={starred ? 'Unstar signal' : 'Star signal'}
    >
      {starred ? '\u2605' : '\u2606'}
    </button>
  );
}

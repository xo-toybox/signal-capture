'use client';

import { useState } from 'react';

interface Props {
  signalId: string;
  isArchived: boolean;
  onChange?: (archived: boolean) => void;
}

export default function ArchiveButton({ signalId, isArchived, onChange }: Props) {
  const [archived, setArchived] = useState(isArchived);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const next = !archived;
    setBusy(true);
    setArchived(next);
    onChange?.(next);

    try {
      const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setArchived(!next);
      onChange?.(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`px-1 text-[10px] font-mono transition-all duration-150 ${
        archived
          ? 'text-[#737373] opacity-100'
          : 'text-[#525252] opacity-0 group-hover:opacity-100 hover:text-[#737373]'
      }`}
      aria-label={archived ? 'Unarchive signal' : 'Archive signal'}
    >
      {archived ? 'archived' : 'archive'}
    </button>
  );
}

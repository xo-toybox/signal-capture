'use client';

import { useEffect, useState } from 'react';
import { toggleArchive } from '@/lib/signal-actions';

interface Props {
  signalId: string;
  isArchived: boolean;
  onChange?: (archived: boolean) => void;
}

export default function ArchiveButton({ signalId, isArchived, onChange }: Props) {
  const [archived, setArchived] = useState(isArchived);

  // Sync with prop changes (e.g. from realtime updates)
  useEffect(() => {
    setArchived(isArchived);
  }, [isArchived]);
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
      await toggleArchive(signalId, archived);
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
      className={`px-1 transition-all duration-150 ${
        archived
          ? 'text-[#737373] opacity-100'
          : 'text-[#525252] group-hover:text-[#737373] hover:text-[#a3a3a3]'
      }`}
      aria-label={archived ? 'Unarchive signal' : 'Archive signal'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="5" rx="1" fill={archived ? 'currentColor' : 'none'} />
        <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" fill={archived ? 'currentColor' : 'none'} />
        <line x1="10" y1="14" x2="14" y2="14" stroke={archived ? '#0a0a0a' : 'currentColor'} />
      </svg>
    </button>
  );
}

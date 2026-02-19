'use client';

import { useEffect, useState } from 'react';
import { togglePublish } from '@/lib/signal-actions';

interface Props {
  signalId: string;
  isPublished: boolean;
  onChange?: (published: boolean) => void;
}

export default function PublishButton({ signalId, isPublished, onChange }: Props) {
  const [published, setPublished] = useState(isPublished);
  const [busy, setBusy] = useState(false);

  // Sync with prop changes (e.g. from realtime updates)
  useEffect(() => {
    setPublished(isPublished);
  }, [isPublished]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    const next = !published;
    setBusy(true);
    setPublished(next);
    onChange?.(next);

    try {
      await togglePublish(signalId, published);
    } catch {
      setPublished(!next);
      onChange?.(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`px-1 transition-all duration-150 ${
        published
          ? 'text-[#22c55e] opacity-100'
          : 'text-[#888888] group-hover:text-[#a0a0a0] hover:text-[#a3a3a3]'
      }`}
      aria-label={published ? 'Unpublish signal' : 'Publish signal'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={published ? 'currentColor' : 'none'} />
        <path d="M2 12h20" stroke={published ? '#0a0a0a' : 'currentColor'} />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" fill={published ? 'currentColor' : 'none'} stroke={published ? '#0a0a0a' : 'currentColor'} />
      </svg>
    </button>
  );
}

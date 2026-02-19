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
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="3" cy="13" r="2" />
        <path d="M1 1a14 14 0 0 1 14 14h-3A11 11 0 0 0 1 4V1Z" />
        <path d="M1 6a9 9 0 0 1 9 9H7A6 6 0 0 0 1 9V6Z" />
      </svg>
    </button>
  );
}

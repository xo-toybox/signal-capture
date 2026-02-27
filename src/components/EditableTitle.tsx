'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  signalId: string;
  initialTitle: string | null;
  fallbackTitle: string;
  isFallback: boolean;
}

export default function EditableTitle({ signalId, initialTitle, fallbackTitle, isFallback }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialTitle ?? '');
  const [saved, setSaved] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    }
  }, [editing]);

  const save = useCallback(async () => {
    if (saving) return;
    const trimmed = value.trim();
    setSaving(true);
    const prev = saved;
    setSaved(trimmed || null);
    setEditing(false);

    try {
      const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_title: trimmed || null }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSaved(prev);
      setValue(prev ?? '');
      setEditing(true);
    } finally {
      setSaving(false);
    }
  }, [value, saved, saving, signalId]);

  const cancel = useCallback(() => {
    setValue(saved ?? '');
    setEditing(false);
  }, [saved]);

  // Ghost text: show remainder of suggestion when typed value is a prefix
  const suggestion = saved ?? fallbackTitle;
  const ghostSuffix =
    value.length > 0 && suggestion.toLowerCase().startsWith(value.toLowerCase())
      ? suggestion.slice(value.length)
      : value.length === 0
        ? suggestion
        : '';

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Tab' && ghostSuffix) {
      e.preventDefault();
      const completed = value + ghostSuffix;
      setValue(completed);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      });
    }
  }, [cancel, save, ghostSuffix, value]);

  const displayTitle = saved ?? fallbackTitle;
  const showAsFallback = saved === null && isFallback;

  if (editing) {
    return (
      <div className="space-y-1.5">
        <div className="relative">
          {ghostSuffix && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none flex items-center px-2 py-1 text-lg leading-tight overflow-hidden whitespace-nowrap"
            >
              <span className="invisible">{value}</span>
              <span className="text-[#666666]">{ghostSuffix}</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            className="relative w-full bg-transparent border border-white/10 rounded px-2 py-1 text-lg text-[#e5e5e5] leading-tight outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1 border border-white/20 rounded text-[#e5e5e5] hover:bg-[#3b82f6] hover:border-[#3b82f6] disabled:opacity-30 transition-all"
          >
            {saving ? '...' : 'save'}
          </button>
          <button
            onClick={cancel}
            className="px-3 py-1 text-[#a0a0a0] hover:text-[#e5e5e5] transition-colors"
          >
            cancel
          </button>
          <span className="text-[#888888] self-center ml-auto">
            tab complete · esc cancel · enter save
          </span>
        </div>
      </div>
    );
  }

  return (
    <h1
      className={`group/title text-lg leading-tight cursor-pointer ${showAsFallback ? 'font-mono text-[#e5e5e5]' : 'text-[#e5e5e5]'}`}
      onClick={() => {
        setValue(saved ?? '');
        setEditing(true);
      }}
    >
      {displayTitle}
      <span className="ml-2 text-[#888888] text-xs opacity-0 group-hover/title:opacity-100 transition-opacity font-normal">
        edit
      </span>
    </h1>
  );
}

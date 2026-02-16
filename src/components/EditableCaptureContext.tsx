'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVoiceInsert } from '@/lib/use-voice-insert';
import VoiceInput from './VoiceInput';

interface Props {
  signalId: string;
  initialValue: string | null;
}

export default function EditableCaptureContext({ signalId, initialValue }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');
  const [saved, setSaved] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const voice = useVoiceInsert(textareaRef, () => value, setValue, (el) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const save = useCallback(async () => {
    if (saving) return;
    const trimmed = value.trim();
    setSaving(true);
    // Optimistic
    const prev = saved;
    setSaved(trimmed);
    setEditing(false);

    try {
      const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_context: trimmed || null }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      setSaved(prev);
      setValue(prev);
      setEditing(true);
    } finally {
      setSaving(false);
    }
  }, [value, saved, saving, signalId]);

  const cancel = useCallback(() => {
    setValue(saved);
    setEditing(false);
  }, [saved]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    }
  }, [cancel, save]);

  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border border-white/10 rounded px-3 py-2 font-mono text-sm text-[#737373] italic resize-none outline-none focus:border-white/20 transition-colors"
            rows={2}
          />
          <VoiceInput
            onStart={voice.onStart}
            onTranscript={voice.onTranscript}
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
            className="px-3 py-1 text-[#737373] hover:text-[#e5e5e5] transition-colors"
          >
            cancel
          </button>
          <span className="text-[#525252] self-center ml-auto">
            esc cancel · cmd+enter save
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group/edit mt-2 cursor-pointer"
      onClick={() => setEditing(true)}
    >
      {saved ? (
        <div className="text-sm text-[#737373] italic whitespace-pre-wrap inline">
          {saved}
          <span className="ml-2 text-[#525252] opacity-0 group-hover/edit:opacity-100 transition-opacity text-xs">
            edit
          </span>
        </div>
      ) : (
        <div className="text-xs text-[#525252] opacity-0 group-hover/edit:opacity-100 transition-opacity font-mono">
          + add note
        </div>
      )}
    </div>
  );
}

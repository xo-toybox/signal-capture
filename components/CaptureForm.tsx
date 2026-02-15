'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isConfigured } from '@/lib/supabase';
import VoiceInput from './VoiceInput';
import type { InputMethod } from '@/lib/types';

export default function CaptureForm() {
  const [rawInput, setRawInput] = useState('');
  const [captureContext, setCaptureContext] = useState('');
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const rawRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  // Handle share target params
  useEffect(() => {
    const sharedUrl = searchParams.get('shared_url');
    const sharedText = searchParams.get('shared_text');
    const sharedTitle = searchParams.get('shared_title');

    if (sharedUrl || sharedText) {
      setInputMethod('share');
      if (sharedUrl) {
        setRawInput(sharedTitle || sharedUrl);
      } else if (sharedText) {
        setRawInput(sharedText);
      }
      setTimeout(() => contextRef.current?.focus(), 100);
    }
  }, [searchParams]);

  const autoGrow = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim() || submitting) return;

    setSubmitting(true);

    const urlPattern = /https?:\/\/[^\s]+/;
    const urlMatch = rawInput.match(urlPattern);
    const sharedUrl = searchParams.get('shared_url');

    try {
      if (!isConfigured) {
        // Demo mode — just show the toast
        await new Promise(r => setTimeout(r, 300));
      } else {
        const res = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_input: rawInput.trim(),
            source_url: sharedUrl || (urlMatch ? urlMatch[0] : null),
            capture_context: captureContext.trim() || null,
            input_method: inputMethod,
          }),
        });

        if (!res.ok) throw new Error('Capture failed');
      }

      setRawInput('');
      setCaptureContext('');
      setInputMethod('text');
      if (rawRef.current) rawRef.current.style.height = 'auto';
      if (contextRef.current) contextRef.current.style.height = 'auto';

      setToast('Captured');
      setTimeout(() => setToast(null), 2000);
      rawRef.current?.focus();
    } catch {
      setToast('Failed to capture');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="border border-white/[0.06] rounded p-3 space-y-2">
        <div className="flex gap-2">
          <textarea
            ref={rawRef}
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              if (inputMethod !== 'share') setInputMethod('text');
              autoGrow(e.target);
            }}
            placeholder="URL or thought..."
            rows={1}
            className="flex-1 bg-transparent border-l-2 border-l-transparent border border-transparent focus:border-white/10 focus:border-l-[var(--accent)] rounded px-3 py-2 font-mono text-sm text-[#e5e5e5] placeholder:text-[#525252] resize-none outline-none transition-colors duration-150 overflow-hidden"
            required
          />
          <VoiceInput
            onTranscript={(text) => {
              setRawInput(text);
              setInputMethod('voice');
              if (rawRef.current) autoGrow(rawRef.current);
            }}
          />
        </div>

        <div className="flex gap-2">
          <textarea
            ref={contextRef}
            value={captureContext}
            onChange={(e) => {
              setCaptureContext(e.target.value);
              autoGrow(e.target);
            }}
            placeholder="Why interesting? (optional)"
            rows={1}
            className="flex-1 bg-transparent border-l-2 border-l-transparent border border-transparent focus:border-white/10 focus:border-l-[var(--accent)] rounded px-3 py-2 font-mono text-sm text-[#e5e5e5] placeholder:text-[#525252] resize-none outline-none transition-colors duration-150 overflow-hidden"
          />
          <VoiceInput
            onTranscript={(text) => {
              setCaptureContext(text);
              if (contextRef.current) autoGrow(contextRef.current);
            }}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!rawInput.trim() || submitting}
            className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider border border-white/20 rounded text-[#e5e5e5] hover:bg-[#3b82f6] hover:border-[#3b82f6] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/20 transition-all duration-150"
          >
            {submitting ? '...' : 'Capture'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 toast-enter">
          <span className={`px-3 py-1 rounded text-xs font-mono ${
            toast === 'Captured'
              ? 'text-[#22c55e] border border-[#22c55e]/20 bg-[#22c55e]/5'
              : 'text-[#ef4444] border border-[#ef4444]/20 bg-[#ef4444]/5'
          }`}>
            {toast}
          </span>
        </div>
      )}
    </form>
  );
}

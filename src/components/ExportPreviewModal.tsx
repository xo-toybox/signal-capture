'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Prose from './Prose';

type Tab = 'preview' | 'markdown';

interface Props {
  open: boolean;
  markdown: string;
  onClose: () => void;
}

export default function ExportPreviewModal({ open, markdown, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('preview');
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- resetting state in response to prop change */
  useEffect(() => {
    if (open) {
      setTab('preview');
      setCopied(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select all text in markdown tab
      setTab('markdown');
    }
  }, [markdown]);

  // Focus trap
  const handleTabTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    window.addEventListener('keydown', handleTabTrap);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('keydown', handleTabTrap);
    };
  }, [open, onClose, handleTabTrap]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Export Preview"
      style={{ animation: 'epm-fadeIn 150ms ease-out forwards' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px) saturate(0.5)' }}
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl"
        style={{
          animation: 'epm-scaleIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          background: '#0e0e0e',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-0.5 p-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['preview', 'markdown'] as Tab[]).map(t => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="px-3 py-1.5 rounded-full font-mono text-[11px] tracking-wide transition-all duration-200"
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.28)',
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  }}
                >
                  {t === 'preview' ? 'Preview' : 'Markdown'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-mono text-[12px] font-medium transition-all duration-200 min-h-[36px]"
              style={{
                color: copied ? '#22c55e' : '#fff',
                background: copied ? 'rgba(34,197,94,0.1)' : '#3b82f6',
                boxShadow: copied ? 'none' : '0 2px 12px -4px rgba(59,130,246,0.3)',
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="4" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M1 4v5.5a1.5 1.5 0 001.5 1.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              aria-label="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {tab === 'preview' ? (
            <Prose content={markdown} />
          ) : (
            <pre
              className="font-mono text-[13px] text-[#a3a3a3] leading-relaxed whitespace-pre-wrap break-words select-all"
              style={{ tabSize: 2 }}
            >
              {markdown}
            </pre>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes epm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes epm-scaleIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

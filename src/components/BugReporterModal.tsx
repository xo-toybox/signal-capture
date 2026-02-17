'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrors } from '@/lib/console-error-buffer';
import type { Severity, ReportKind, BugReportSuccess } from '@/lib/bug-report-types';
import { SEVERITY_COLORS } from '@/lib/bug-report-types';
import { useVoiceInsert } from '@/lib/use-voice-insert';
import VoiceInput from './VoiceInput';

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
const KINDS: { key: ReportKind; label: string; color: string }[] = [
  { key: 'bug', label: 'Bug', color: '#ef4444' },
  { key: 'feature', label: 'Feature', color: '#3b82f6' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (url: string, number: number) => void;
}

export default function BugReporterModal({ open, onClose, onSuccess }: Props) {
  const [kind, setKind] = useState<ReportKind>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [assignClaude, setAssignClaude] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const descVoice = useVoiceInsert(
    descriptionRef, () => description, setDescription,
  );

  const accent = kind === 'bug' ? '#ef4444' : '#3b82f6';

  useEffect(() => {
    if (open) {
      setKind('bug');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setAssignClaude(true);
      setSubmitting(false);
      setError('');
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open]);

  const handleTabTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'input, textarea, button, [tabindex]:not([tabindex="-1"])'
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
    window.addEventListener('keydown', handleTabTrap);
    return () => window.removeEventListener('keydown', handleTabTrap);
  }, [open, handleTabTrap]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          kind,
          severity,
          assignClaude,
          url: location.href,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          consoleErrors: getErrors(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(data.error || `Error ${res.status}`);
        return;
      }

      const data: BugReportSuccess = await res.json();
      onSuccess(data.issue_url, data.issue_number);
    } catch {
      setError('Network error — check your connection');
    } finally {
      setSubmitting(false);
    }
  }, [title, submitting, description, kind, severity, assignClaude, onSuccess]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [open, onClose, handleSubmit]);

  if (!open) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={kind === 'bug' ? 'Bug Report' : 'Feature Request'}
      style={{ animation: 'brm-fadeIn 150ms ease-out forwards' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px) saturate(0.5)' }}
      />

      <div
        ref={panelRef}
        className="relative w-full sm:max-w-[26rem] max-h-[88vh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
        style={{
          animation: 'brm-slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          background: '#0e0e0e',
          border: '1px solid rgba(255,255,255,0.07)',
          borderBottom: 'none',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex-shrink-0 pt-2.5 pb-1 sm:hidden">
          <div className="w-9 h-[3px] rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header: kind toggle + close */}
        <div className="flex-shrink-0 px-5 pt-3 sm:pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-0.5 p-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {KINDS.map(k => {
              const active = kind === k.key;
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => { setKind(k.key); setAssignClaude(k.key === 'bug'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[11px] tracking-wide transition-all duration-200"
                  style={{
                    color: active ? '#fff' : 'rgba(255,255,255,0.28)',
                    background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                    style={{
                      background: active ? k.color : 'rgba(255,255,255,0.1)',
                      boxShadow: active ? `0 0 6px ${k.color}50` : 'none',
                    }}
                  />
                  {k.label}
                </button>
              );
            })}
          </div>

          <button
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

        {/* Form */}
        <div className="px-5 pb-3 space-y-4 overflow-y-auto flex-1">
          {/* Title + Claude toggle inline */}
          <div className="flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={256}
              className="flex-1 min-w-0 bg-transparent border-0 px-0 py-2.5 font-mono text-[15px] text-white/90 placeholder:text-white/20 outline-none"
              placeholder="What happened?"
              onFocus={() => {
                const row = titleRef.current?.parentElement;
                if (row) row.style.borderColor = `${accent}35`;
              }}
              onBlur={() => {
                const row = titleRef.current?.parentElement;
                if (row) row.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            />
            <button
              type="button"
              onClick={() => setAssignClaude(prev => !prev)}
              aria-label={assignClaude ? 'Claude will work on this — click to disable' : 'Click to assign to Claude'}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full font-mono text-[10px] tracking-wide transition-all duration-200"
              style={{
                background: assignClaude ? 'rgba(212,165,116,0.06)' : 'transparent',
                border: `1px solid ${assignClaude ? 'rgba(212,165,116,0.16)' : 'rgba(255,255,255,0.06)'}`,
                color: assignClaude ? 'rgba(212,165,116,0.8)' : 'rgba(255,255,255,0.13)',
              }}
            >
              <span className="text-[8px] leading-none" style={{ filter: assignClaude ? 'drop-shadow(0 0 2px rgba(212,165,116,0.4))' : 'none' }}>✦</span>
              claude
            </button>
          </div>

          {/* Description */}
          <div
            className="rounded-xl overflow-hidden transition-colors duration-200"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 px-3.5 pt-3 pb-1 font-mono text-sm leading-relaxed text-white/85 placeholder:text-white/18 outline-none resize-none"
              placeholder="Details (optional)"
              onFocus={() => {
                const c = descriptionRef.current?.parentElement;
                if (c) c.style.borderColor = `${accent}20`;
              }}
              onBlur={() => {
                const c = descriptionRef.current?.parentElement;
                if (c) c.style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            />
            <div className="flex justify-end px-2 pb-2">
              <VoiceInput onStart={descVoice.onStart} onTranscript={descVoice.onTranscript} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-mono text-[12px]" style={{ color: '#ef4444', animation: 'brm-fadeIn 150ms ease-out' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pb-5 pt-1 flex items-center justify-between">
          {/* Severity dots — bugs only */}
          <div className="flex items-center gap-1">
            {kind === 'bug' ? (
              <>
                {SEVERITIES.map(s => {
                  const sel = severity === s;
                  const c = SEVERITY_COLORS[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      aria-label={`Severity: ${s}`}
                      className="w-6 h-6 flex items-center justify-center"
                    >
                      <span
                        className="rounded-full transition-all duration-200"
                        style={{
                          width: sel ? 8 : 5,
                          height: sel ? 8 : 5,
                          background: sel ? c.dot : 'rgba(255,255,255,0.08)',
                          boxShadow: sel ? `0 0 8px ${c.dot}45` : 'none',
                        }}
                      />
                    </button>
                  );
                })}
                <span className="font-mono text-[10px] tracking-wide ml-0.5" style={{ color: `${SEVERITY_COLORS[severity].dot}cc` }}>
                  {severity}
                </span>
              </>
            ) : (
              <span />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-2 font-mono text-[13px] rounded-xl transition-colors duration-150 disabled:opacity-40"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-mono text-[13px] font-medium text-white transition-all duration-200 disabled:opacity-20"
              style={{
                background: !title.trim() || submitting ? 'rgba(255,255,255,0.05)' : accent,
                boxShadow: title.trim() && !submitting ? `0 2px 16px -4px ${accent}50` : 'none',
              }}
            >
              {submitting ? (
                <span className="flex items-center gap-1.5 px-1">
                  <span className="w-1 h-1 rounded-full bg-white" style={{ animation: 'brm-pulse 1s ease-in-out infinite' }} />
                  <span className="w-1 h-1 rounded-full bg-white" style={{ animation: 'brm-pulse 1s ease-in-out infinite', animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-white" style={{ animation: 'brm-pulse 1s ease-in-out infinite', animationDelay: '300ms' }} />
                </span>
              ) : (
                <>
                  Submit
                  <kbd className="hidden sm:inline text-[10px] opacity-40">{isMac ? '⌘↵' : 'Ctrl↵'}</kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes brm-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes brm-slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes brm-pulse {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }

        @media (min-width: 640px) {
          @keyframes brm-slideUp {
            from { opacity: 0; transform: scale(0.97) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
    </div>
  );
}

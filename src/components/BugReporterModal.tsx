'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrors } from '@/lib/console-error-buffer';
import type { Severity, ReportKind, BugReportSuccess } from '@/lib/bug-report-types';
import { SEVERITY_COLORS } from '@/lib/bug-report-types';

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
const KINDS: { key: ReportKind; label: string; dot: string }[] = [
  { key: 'bug', label: 'Bug', dot: '#ef4444' },
  { key: 'feature', label: 'Feature', dot: '#3b82f6' },
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setKind('bug');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setSubmitting(false);
      setError('');
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Focus trap
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

  const handleSubmit = async () => {
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
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-[26rem] mx-4 bg-[#141414] border border-white/[0.15] rounded-[10px] overflow-hidden modal-enter shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      >
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-[#3b82f6] to-[#3b82f6]/0" style={{ animation: 'border-draw 400ms ease-out forwards' }} />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full" style={{ background: kind === 'bug' ? '#ef4444' : '#3b82f6', boxShadow: `0 0 6px ${kind === 'bug' ? '#ef4444' : '#3b82f6'}` }} />
              <span id="bug-report-title" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#737373]">
                {kind === 'bug' ? 'Bug Report' : 'Feature Request'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#525252]">esc to close</span>
          </div>

          {/* Kind toggle */}
          <div className="flex gap-[3px] border border-white/[0.08] rounded-[8px] p-[3px]">
            {KINDS.map(k => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] font-mono text-[11px] transition-colors"
                style={{
                  background: kind === k.key ? `${k.dot}12` : 'transparent',
                  color: kind === k.key ? k.dot : '#525252',
                }}
              >
                <span
                  className="block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: k.dot,
                    opacity: kind === k.key ? 1 : 0.5,
                    boxShadow: kind === k.key ? `0 0 6px ${k.dot}` : 'none',
                  }}
                />
                {k.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#525252]">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={256}
              className="w-full bg-transparent border border-white/[0.10] rounded-[6px] px-3 py-2 font-mono text-[13px] text-[#e5e5e5] placeholder:text-[#525252] outline-none focus:border-white/[0.20] transition-colors"
              placeholder={kind === 'bug' ? 'Brief description of the issue' : 'What would you like to see?'}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#525252]">
              Description <span className="text-[#3a3a3a]">optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent border border-white/[0.10] rounded-[6px] px-3 py-2 font-mono text-[13px] text-[#e5e5e5] placeholder:text-[#525252] outline-none focus:border-white/[0.20] transition-colors resize-none"
              placeholder={kind === 'bug' ? 'Steps to reproduce, expected vs actual behavior...' : 'Describe the feature and why it would be useful...'}
            />
          </div>

          {/* Severity — bugs only */}
          {kind === 'bug' && (
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#525252]">Severity</label>
              <div className="flex gap-[3px] border border-white/[0.08] rounded-[8px] p-[3px]">
                {SEVERITIES.map((s) => {
                  const selected = severity === s;
                  const colors = SEVERITY_COLORS[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] font-mono text-[11px] capitalize transition-colors"
                      style={{
                        background: selected ? colors.bg : 'transparent',
                        color: selected ? colors.text : '#525252',
                      }}
                    >
                      <span
                        className="block w-1.5 h-1.5 rounded-full"
                        style={{
                          background: colors.dot,
                          opacity: selected ? 1 : 0.5,
                          boxShadow: selected ? `0 0 6px ${colors.dot}` : 'none',
                        }}
                      />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border border-[#ef4444]/15 rounded-[6px] bg-[#ef4444]/[0.04] px-3 py-2">
              <p className="font-mono text-[11px] text-[#ef4444]">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-[6px] border border-white/[0.10] bg-transparent font-mono text-[13px] text-[#737373] transition-colors hover:border-white/[0.20] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="px-4 py-2 rounded-[6px] bg-[#3b82f6] font-medium text-[13px] text-white transition-opacity disabled:opacity-30"
            >
              {submitting ? (
                <span className="flex items-center gap-1">
                  <span className="block w-1 h-1 rounded-full bg-white" style={{ animation: 'dot-pulse 1.2s infinite 0ms' }} />
                  <span className="block w-1 h-1 rounded-full bg-white" style={{ animation: 'dot-pulse 1.2s infinite 200ms' }} />
                  <span className="block w-1 h-1 rounded-full bg-white" style={{ animation: 'dot-pulse 1.2s infinite 400ms' }} />
                </span>
              ) : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

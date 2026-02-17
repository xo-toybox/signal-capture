'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrors } from '@/lib/console-error-buffer';
import type { Severity, ReportKind, BugReportSuccess } from '@/lib/bug-report-types';
import { SEVERITY_COLORS } from '@/lib/bug-report-types';
import { useVoiceInsert } from '@/lib/use-voice-insert';
import VoiceInput from './VoiceInput';

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
  const [assignClaude, setAssignClaude] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const descVoice = useVoiceInsert(
    descriptionRef, () => description, setDescription,
  );

  // Reset form when opening
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

  // Escape to close, Cmd+Enter to submit
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, handleSubmit]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={kind === 'bug' ? 'Bug Report' : 'Feature Request'}
      style={{
        animation: 'fadeIn 200ms ease-out forwards'
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-[32rem] max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
        style={{
          animation: 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 20px 60px -10px rgba(0,0,0,0.9),
            0 0 80px -20px ${kind === 'bug' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}
          `
        }}
      >
        {/* Accent gradient header */}
        <div
          className="h-[2px] flex-shrink-0"
          style={{
            background: kind === 'bug'
              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 50%, transparent 100%)'
              : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, transparent 100%)',
            animation: 'slideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        />

        {/* Scrollable content */}
        <div className="px-8 pt-7 pb-6 space-y-7 overflow-y-auto flex-1">
          {/* Kind toggle + ESC — no container, just typography */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {KINDS.map(k => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => { setKind(k.key); setAssignClaude(k.key === 'bug'); }}
                  className={`font-mono text-sm tracking-[0.08em] transition-all duration-400 ${
                    kind !== k.key ? 'hover:opacity-60' : ''
                  }`}
                  style={{
                    color: kind === k.key ? k.dot : 'rgba(255,255,255,0.15)',
                    textShadow: kind === k.key ? `0 0 20px ${k.dot}40` : 'none',
                  }}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.2em] text-white/25 hover:text-white/50 transition-colors duration-200"
            >
              ESC
            </button>
          </div>

          {/* Title — bottom border only */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={256}
            className="w-full bg-transparent border-0 border-b border-white/[0.08] rounded-none px-0 py-3 font-mono text-base text-white/90 placeholder:text-white/25 outline-none transition-all duration-300"
            placeholder="Title"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = kind === 'bug' ? '#ef444450' : '#3b82f650';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          />

          {/* Description with voice input */}
          <div className="flex items-end gap-2 border-b border-white/[0.08]">
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex-1 bg-transparent border-0 rounded-none px-0 py-3 font-mono text-sm leading-relaxed text-white/90 placeholder:text-white/25 outline-none resize-none"
              placeholder="Description (optional)"
            />
            <div className="py-2">
              <VoiceInput
                onStart={descVoice.onStart}
                onTranscript={descVoice.onTranscript}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              className="font-mono text-sm text-[#ef4444]"
              style={{ animation: 'slideDown 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer — two rows so controls + actions don't overflow on mobile */}
        <div className="flex-shrink-0 px-8 py-5 space-y-4">
          <div className="flex items-center gap-3">
            {/* Severity — colored marks, bugs only */}
            {kind === 'bug' && (
              <div className="flex items-center gap-2.5">
                {SEVERITIES.map((s) => {
                  const selected = severity === s;
                  const colors = SEVERITY_COLORS[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      aria-label={`Severity: ${s}`}
                      className="flex items-center justify-center w-7 h-7 transition-all duration-400"
                    >
                      <span
                        className="block rounded-full transition-all duration-400"
                        style={{
                          width: selected ? 8 : 6,
                          height: selected ? 8 : 6,
                          background: selected ? colors.dot : 'rgba(255,255,255,0.12)',
                          boxShadow: selected ? `0 0 10px ${colors.dot}70, 0 0 4px ${colors.dot}40` : 'none',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            {/* Divider — only when severity dots are visible */}
            {kind === 'bug' && (
              <div className="w-px h-3 bg-white/[0.06]" />
            )}
            {/* Claude auto-assign toggle */}
            <button
              type="button"
              onClick={() => setAssignClaude(prev => !prev)}
              aria-label={assignClaude ? 'Claude will work on this — click to disable' : 'Click to assign to Claude'}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-300"
              style={{
                background: assignClaude ? 'rgba(212,165,116,0.07)' : 'transparent',
                border: `1px solid ${assignClaude ? 'rgba(212,165,116,0.2)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: assignClaude
                  ? '0 0 16px -4px rgba(212,165,116,0.15), inset 0 0 12px -4px rgba(212,165,116,0.05)'
                  : 'none',
              }}
            >
              <span
                className="text-[9px] leading-none transition-all duration-300"
                style={{
                  color: assignClaude ? '#d4a574' : 'rgba(255,255,255,0.1)',
                  filter: assignClaude ? 'drop-shadow(0 0 3px rgba(212,165,116,0.5))' : 'none',
                }}
              >
                ✦
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.08em] leading-none transition-all duration-300"
                style={{
                  color: assignClaude ? 'rgba(212,165,116,0.85)' : 'rgba(255,255,255,0.12)',
                }}
              >
                claude
              </span>
            </button>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="font-mono text-sm text-white/30 hover:text-white/60 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="px-5 py-2 rounded-lg font-mono text-sm font-medium text-white transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
              style={{
                background: kind === 'bug'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: submitting ? 'none' : `0 4px 16px -4px ${kind === 'bug' ? '#ef4444' : '#3b82f6'}60`,
              }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="block w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="block w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="block w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
              ) : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

      `}</style>
    </div>
  );
}

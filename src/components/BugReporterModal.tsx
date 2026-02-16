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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
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
        <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="relative"
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                <span
                  className="block w-2 h-2 rounded-full"
                  style={{
                    background: kind === 'bug' ? '#ef4444' : '#3b82f6',
                    boxShadow: `0 0 12px ${kind === 'bug' ? '#ef4444' : '#3b82f6'}`
                  }}
                />
              </div>
              <h2
                id="bug-report-title"
                className="font-mono text-xs uppercase tracking-[0.2em] text-white/60 font-semibold"
              >
                {kind === 'bug' ? 'Bug Report' : 'Feature Request'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-xs font-mono text-white/40 hover:text-white/60 transition-colors duration-200"
            >
              ESC
            </button>
          </div>

          {/* Kind toggle */}
          <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl backdrop-blur-sm">
            {KINDS.map(k => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-mono text-sm font-medium transition-all duration-300"
                style={{
                  background: kind === k.key ? `linear-gradient(135deg, ${k.dot}15, ${k.dot}08)` : 'transparent',
                  color: kind === k.key ? k.dot : '#666',
                  borderWidth: kind === k.key ? '1px' : '0px',
                  borderColor: kind === k.key ? `${k.dot}30` : 'transparent',
                  transform: kind === k.key ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <span
                  className="block w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: k.dot,
                    opacity: kind === k.key ? 1 : 0.4,
                    boxShadow: kind === k.key ? `0 0 8px ${k.dot}` : 'none',
                  }}
                />
                {k.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="space-y-3">
            <label className="block font-mono text-xs uppercase tracking-widest text-white/70 font-semibold">
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={256}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 font-mono text-base text-white/90 placeholder:text-white/30 outline-none transition-all duration-200"
              placeholder={kind === 'bug' ? 'Brief description of the issue' : 'What would you like to see?'}
              style={{
                boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = kind === 'bug' ? '#ef444440' : '#3b82f640';
                e.currentTarget.style.boxShadow = `0 0 0 3px ${kind === 'bug' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block font-mono text-xs uppercase tracking-widest text-white/70 font-semibold">
              Description <span className="text-white/30 font-normal">optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 font-mono text-sm leading-relaxed text-white/90 placeholder:text-white/30 outline-none transition-all duration-200 resize-none"
              placeholder={kind === 'bug' ? 'Steps to reproduce, expected vs actual behavior...' : 'Describe the feature and why it would be useful...'}
              style={{
                boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = kind === 'bug' ? '#ef444440' : '#3b82f640';
                e.currentTarget.style.boxShadow = `0 0 0 3px ${kind === 'bug' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
              }}
            />
          </div>

          {/* Severity — bugs only */}
          {kind === 'bug' && (
            <div className="space-y-3">
              <label className="block font-mono text-xs uppercase tracking-widest text-white/70 font-semibold">
                Severity
              </label>
              <div className="grid grid-cols-4 gap-2 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                {SEVERITIES.map((s) => {
                  const selected = severity === s;
                  const colors = SEVERITY_COLORS[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className="flex flex-col items-center justify-center gap-2 py-3 rounded-lg font-mono text-xs capitalize transition-all duration-300"
                      style={{
                        background: selected ? `linear-gradient(135deg, ${colors.dot}20, ${colors.dot}10)` : 'transparent',
                        color: selected ? colors.text : '#666',
                        borderWidth: selected ? '1px' : '0px',
                        borderColor: selected ? `${colors.dot}30` : 'transparent',
                        transform: selected ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <span
                        className="block w-2 h-2 rounded-full transition-all duration-300"
                        style={{
                          background: colors.dot,
                          opacity: selected ? 1 : 0.4,
                          boxShadow: selected ? `0 0 10px ${colors.dot}` : 'none',
                        }}
                      />
                      <span className="font-medium">{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="border border-[#ef4444]/20 rounded-xl bg-[#ef4444]/5 px-4 py-3 backdrop-blur-sm"
              style={{
                animation: 'slideDown 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <p className="font-mono text-sm text-[#ef4444]">{error}</p>
            </div>
          )}
        </div>

        {/* Actions - Sticky footer */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] font-mono text-sm text-white/60 transition-all duration-200 hover:bg-white/[0.04] hover:text-white/80 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="px-6 py-2.5 rounded-xl font-mono text-sm font-medium text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: kind === 'bug'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: submitting ? 'none' : `0 4px 20px -4px ${kind === 'bug' ? '#ef4444' : '#3b82f6'}80`,
              }}
              onMouseEnter={(e) => {
                if (!submitting && title.trim()) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 24px -4px ${kind === 'bug' ? '#ef4444' : '#3b82f6'}aa`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px -4px ${kind === 'bug' ? '#ef4444' : '#3b82f6'}80`;
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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

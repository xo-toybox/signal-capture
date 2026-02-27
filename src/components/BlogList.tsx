'use client';

import { useState } from 'react';
import Link from 'next/link';
import { safeArray, type SignalFeedItem } from '@/lib/types';

function safeUrl(s: string | null): string | null {
  if (!s) return null;
  try {
    const parsed = new URL(s);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-4 mb-1.5">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function BlogEntry({ signal, isOpen, onToggle }: { signal: SignalFeedItem; isOpen: boolean; onToggle: () => void }) {
  const tags = safeArray(signal.domain_tags).slice(0, 3);
  const displayTitle = signal.source_title ?? signal.fetched_title ?? signal.raw_input.slice(0, 100);
  const publishDate = signal.published_at
    ? new Date(signal.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const editedDate = signal.edited_at ? (() => {
    const ed = new Date(signal.edited_at);
    const ref = signal.published_at ? new Date(signal.published_at) : null;
    const sameDay = ref && ed.toDateString() === ref.toDateString();
    return sameDay ? 'edited' : `edited ${ed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })() : null;

  return (
    <div className="border border-white/[0.06] rounded overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-white/[0.02] transition-colors flex items-start gap-3"
      >
        <span className="text-[#888888] mt-0.5 flex-shrink-0 text-xs font-mono">
          {isOpen ? '▼' : '▶'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-[#e5e5e5] line-clamp-2">
            {displayTitle}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#888888] font-mono">
            {publishDate && <span>{publishDate}</span>}
            {editedDate && <span className="text-[#666666]">· {editedDate}</span>}
            {tags.length > 0 && (
              <>
                {(publishDate || editedDate) && <span className="text-white/10">|</span>}
                <span className="truncate">{tags.join(' · ')}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {isOpen && <BlogEntryDetail signal={signal} />}
    </div>
  );
}

function BlogEntryDetail({ signal: s }: { signal: SignalFeedItem }) {
  const isEnriched = s.processing_status === 'complete' && s.key_claims;
  const validatedSourceUrl = safeUrl(s.source_url);

  return (
    <div className="px-4 pb-4 border-t border-white/[0.06]">
      <SectionHeader label="Raw Capture" />
      <div className="font-mono text-sm text-[#e5e5e5] whitespace-pre-wrap leading-relaxed">
        {s.raw_input}
      </div>
      {s.capture_context && (
        <div className="mt-2 text-xs text-[#a0a0a0] whitespace-pre-wrap">{s.capture_context}</div>
      )}
      {validatedSourceUrl && (
        <a
          href={validatedSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-mono text-[#3b82f6] hover:underline truncate max-w-full"
        >
          {s.source_url}
        </a>
      )}

      {isEnriched && (() => {
        const claims = safeArray(s.key_claims);
        const tags = safeArray(s.domain_tags);
        return (
          <>
            {claims.length > 0 && (
              <>
                <SectionHeader label="Key Claims" />
                <ul className="space-y-1.5">
                  {claims.map((claim, i) => (
                    <li key={i} className="flex gap-2 text-sm font-mono">
                      <span className="text-[#888888] flex-shrink-0">-</span>
                      <span className="text-[#e5e5e5]">{claim}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {s.novelty_assessment && (
              <>
                <SectionHeader label="Novelty" />
                <p className="text-sm text-[#e5e5e5] leading-relaxed">{s.novelty_assessment}</p>
              </>
            )}

            {tags.length > 0 && (
              <>
                <SectionHeader label="Tags" />
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs font-mono text-[#a0a0a0] border border-white/[0.06] rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}

            {s.cross_signal_notes && (
              <>
                <SectionHeader label="Cross-Signal Notes" />
                <p className="text-sm text-[#e5e5e5] leading-relaxed">{s.cross_signal_notes}</p>
              </>
            )}

            {s.confidence !== null && s.confidence !== undefined && (
              <>
                <SectionHeader label="Confidence" />
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3b82f6] rounded-full"
                      style={{ width: `${(s.confidence ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#a0a0a0]">
                    {((s.confidence ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
          </>
        );
      })()}

      {(s.human_note || s.human_rating) && (
        <>
          <SectionHeader label="Notes" />
          {s.human_rating && (
            <div className="text-xs font-mono text-[#a0a0a0] mb-1">
              Rating: {s.human_rating}/5
            </div>
          )}
          {s.human_note && (
            <p className="text-sm text-[#e5e5e5]">{s.human_note}</p>
          )}
        </>
      )}

      <div className="mt-4">
        <Link
          href={`/blog/${s.id}`}
          className="text-xs font-mono text-[#3b82f6] hover:underline"
        >
          permalink →
        </Link>
      </div>
    </div>
  );
}

export default function BlogList({ signals }: { signals: SignalFeedItem[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const allOpen = signals.length > 0 && signals.every(s => openIds.has(s.id));

  const toggleAll = () => {
    if (allOpen) {
      setOpenIds(new Set());
    } else {
      setOpenIds(new Set(signals.map(s => s.id)));
    }
  };

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (signals.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[#888888] font-mono">
        no published signals yet
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-mono text-[#e5e5e5]">Blog</h1>
        <button
          onClick={toggleAll}
          className="text-xs font-mono text-[#888888] hover:text-[#a0a0a0] transition-colors"
        >
          {allOpen ? 'collapse all' : 'expand all'}
        </button>
      </div>

      <div className="space-y-3">
        {signals.map(s => (
          <BlogEntry
            key={s.id}
            signal={s}
            isOpen={openIds.has(s.id)}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </div>
    </>
  );
}

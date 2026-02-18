'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, isConfigured } from '@/lib/supabase';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import SwipeableCard from './SwipeableCard';
import SelectionBar from './SelectionBar';
import ExportPreviewModal from './ExportPreviewModal';
import { signalsToMarkdown } from '@/lib/signals-to-markdown';
import type { SignalFeedItem } from '@/lib/types';

const PAGE_SIZE = 20;

type FilterTab = 'active' | 'starred' | 'archived' | 'all';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'starred', label: 'Starred' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
];

const EMPTY_MESSAGES: Record<FilterTab, string> = {
  active: 'no signals yet',
  starred: 'no starred signals',
  archived: 'no archived signals',
  all: 'no signals yet',
};

const NULL_ENRICHMENT: Partial<SignalFeedItem> = {
  fetched_title: null,
  is_starred: false,
  is_archived: false,
  source_title: null,
  key_claims: null,
  novelty_assessment: null,
  domain_tags: null,
  signal_type: null,
  source_tier: null,
  frontier_status: null,
  confidence: null,
  cross_signal_notes: null,
  human_note: null,
  human_rating: null,
  tier_override: null,
};

interface Props {
  initialSignals?: SignalFeedItem[];
}

export default function SignalFeed({ initialSignals }: Props) {
  const hasInitial = initialSignals && initialSignals.length > 0;
  const [signals, setSignals] = useState<SignalFeedItem[]>(hasInitial ? initialSignals : []);
  const [loading, setLoading] = useState(!hasInitial);
  const [hasMore, setHasMore] = useState(hasInitial ? initialSignals.length === PAGE_SIZE : true);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<FilterTab>('active');

  // Selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState('');

  const fetchSignals = useCallback(async (currentOffset: number, currentFilter: FilterTab) => {
    if (!isConfigured) {
      const filtered = MOCK_SIGNALS.filter(s => {
        if (currentFilter === 'active') return !s.is_archived;
        if (currentFilter === 'starred') return s.is_starred && !s.is_archived;
        if (currentFilter === 'archived') return s.is_archived;
        return true;
      });
      setSignals(filtered);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/signals?limit=${PAGE_SIZE}&offset=${currentOffset}&filter=${currentFilter}`);
      const data = await res.json();
      if (data.signals) {
        if (currentOffset === 0) {
          setSignals(data.signals);
        } else {
          setSignals(prev => [...prev, ...data.signals]);
        }
        setHasMore(data.signals.length === PAGE_SIZE);
      }
    } catch {
      // ignored
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch client-side if no initial data was provided
  useEffect(() => {
    if (!hasInitial) {
      fetchSignals(0, filter);
    }
  }, [fetchSignals, hasInitial, filter]);

  // Re-fetch when filter changes (after initial load)
  const changeFilter = useCallback((tab: FilterTab) => {
    setFilter(tab);
    setOffset(0);
    setLoading(true);
    setSelectMode(false);
    setSelectedIds([]);
    fetchSignals(0, tab);
  }, [fetchSignals]);

  // Listen for instant signal capture events
  useEffect(() => {
    const handler = (e: Event) => {
      const raw = (e as CustomEvent).detail;
      if (!raw?.id) return;
      const newSignal: SignalFeedItem = { ...raw, ...NULL_ENRICHMENT };
      // Only add to feed if it matches current filter
      if (filter === 'archived') return; // new signals aren't archived
      if (filter === 'starred') return; // new signals aren't starred
      setSignals(prev =>
        prev.some(s => s.id === newSignal.id) ? prev : [newSignal, ...prev]
      );
    };
    window.addEventListener('signal-captured', handler);
    return () => window.removeEventListener('signal-captured', handler);
  }, [filter]);

  // Realtime subscription
  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();

    const channel = supabase
      .channel('signals-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals_raw' },
        (payload) => {
          const newSignal: SignalFeedItem = {
            ...payload.new as SignalFeedItem,
            ...NULL_ENRICHMENT,
          };
          // Only add if matches current filter
          if (filter === 'archived' || filter === 'starred') return;
          setSignals(prev =>
            prev.some(s => s.id === newSignal.id) ? prev : [newSignal, ...prev]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'signals_raw' },
        (payload) => {
          const updated = payload.new as Partial<SignalFeedItem>;
          setSignals(prev => prev
            .map(s => s.id === updated.id ? { ...s, ...updated } : s)
            .filter(s => {
              if (filter === 'active' && s.is_archived) return false;
              if (filter === 'starred' && (!s.is_starred || s.is_archived)) return false;
              if (filter === 'archived' && !s.is_archived) return false;
              return true;
            }),
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'signals_raw' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setSignals(prev => prev.filter(s => s.id !== deletedId));
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime subscription error:', status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Dismiss open swipe panel on outside tap
  useEffect(() => {
    if (!openCardId) return;

    const handler = (e: PointerEvent) => {
      if (feedRef.current && !feedRef.current.contains(e.target as Node)) {
        setOpenCardId(null);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [openCardId]);

  const loadMore = async () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    setLoadingMore(true);
    await fetchSignals(newOffset, filter);
    setLoadingMore(false);
  };

  // Selection helpers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds([]);
  }, []);

  const getMatchingIds = useCallback((days: number | null): string[] => {
    if (days === null) return signals.map(s => s.id);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return signals.filter(s => new Date(s.created_at).getTime() >= cutoff).map(s => s.id);
  }, [signals]);

  const selectByDays = useCallback((days: number | null) => {
    const matchingIds = getMatchingIds(days);
    const allAlreadySelected = matchingIds.length > 0 && matchingIds.every(id => selectedIds.includes(id));
    if (allAlreadySelected) {
      setSelectedIds(prev => prev.filter(id => !matchingIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const existing = new Set(prev);
        const toAdd = matchingIds.filter(id => !existing.has(id));
        return [...prev, ...toAdd];
      });
    }
  }, [getMatchingIds, selectedIds]);

  const getSelectedSignals = useCallback((): SignalFeedItem[] => {
    // Maintain tap-selection order
    const signalMap = new Map(signals.map(s => [s.id, s]));
    return selectedIds.map(id => signalMap.get(id)).filter((s): s is SignalFeedItem => !!s);
  }, [signals, selectedIds]);

  const openPreview = useCallback(() => {
    const selected = getSelectedSignals();
    if (selected.length === 0) return;
    setPreviewMarkdown(signalsToMarkdown(selected));
    setPreviewOpen(true);
  }, [getSelectedSignals]);

  const copyMarkdown = useCallback(async () => {
    const selected = getSelectedSignals();
    if (selected.length === 0) return;
    const md = signalsToMarkdown(selected);
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      // Fallback: open preview so user can manually copy
      setPreviewMarkdown(md);
      setPreviewOpen(true);
    }
  }, [getSelectedSignals]);

  // Keyboard shortcuts for select mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: close modal first, then exit select mode
      if (e.key === 'Escape') {
        if (previewOpen) {
          // Modal handles its own Escape
          return;
        }
        if (selectMode) {
          e.preventDefault();
          exitSelectMode();
          return;
        }
      }

      if (!selectMode) return;

      // Cmd/Ctrl+A: select all visible signals
      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const allIds = signals.map(s => s.id);
        setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
        return;
      }

      // Cmd/Ctrl+C: copy markdown directly
      if (e.key === 'c' && (e.metaKey || e.ctrlKey) && selectedIds.length > 0) {
        // Only intercept if no text is selected (don't break normal copy)
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;
        e.preventDefault();
        copyMarkdown();
        return;
      }

      // Enter: open preview
      if (e.key === 'Enter' && selectedIds.length > 0 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openPreview();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectMode, previewOpen, signals, selectedIds, exitSelectMode, copyMarkdown, openPreview]);

  // In active view, partition into starred (pinned) and unstarred
  const starred = filter === 'active' ? signals.filter(s => s.is_starred) : [];
  const unstarred = filter === 'active' ? signals.filter(s => !s.is_starred) : signals;

  const renderCard = (signal: SignalFeedItem) => (
    <SwipeableCard
      key={signal.id}
      signal={signal}
      isOpen={openCardId === signal.id}
      onOpenChange={setOpenCardId}
      selectMode={selectMode}
      isSelected={selectedIds.includes(signal.id)}
      onToggleSelect={handleToggleSelect}
    />
  );

  return (
    <div ref={feedRef}>
      {/* Filter tabs + Select toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 text-xs font-mono">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => changeFilter(tab.key)}
              className={`px-3 py-1 rounded transition-colors duration-150 ${
                filter === tab.key
                  ? 'text-[#e5e5e5] bg-white/[0.06]'
                  : 'text-[#888888] hover:text-[#a0a0a0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {signals.length > 0 && (
          <button
            type="button"
            onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            className={`px-3 py-1 rounded font-mono text-xs transition-colors duration-150 ${
              selectMode
                ? 'text-[#3b82f6] bg-[#3b82f6]/10'
                : 'text-[#888888] hover:text-[#a0a0a0]'
            }`}
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
        )}
      </div>

      {/* Time-range selection chips (select mode only) */}
      {selectMode && signals.length > 0 && (
        <div className="flex gap-1.5 mb-3 text-[11px] font-mono">
          {([
            { label: 'Today', days: 1 },
            { label: '7d', days: 7 },
            { label: '30d', days: 30 },
            { label: 'All', days: null },
          ] as { label: string; days: number | null }[]).map(opt => {
            const matchingIds = getMatchingIds(opt.days);
            const isActive = matchingIds.length > 0 && matchingIds.every(id => selectedIds.includes(id));

            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => selectByDays(opt.days)}
                className={`px-2.5 py-1 rounded-full border transition-all duration-150 ${
                  isActive
                    ? 'text-[#3b82f6] border-[#3b82f6]/30 bg-[#3b82f6]/10'
                    : 'text-[#888888] border-white/[0.06] hover:text-[#a0a0a0] hover:border-white/10'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-[#888888] font-mono">
          loading...
        </div>
      ) : signals.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#888888] font-mono">
          {EMPTY_MESSAGES[filter]}
        </div>
      ) : (
        <>
          <div className="border-t border-white/[0.06]">
            {/* Pinned starred section (active tab only) */}
            {starred.length > 0 && (
              <>
                {starred.map(renderCard)}
                <div className="h-px bg-[#eab308]/20" />
              </>
            )}
            {unstarred.map(renderCard)}
          </div>

          {hasMore && (
            <div className="py-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-1.5 text-xs font-mono text-[#a0a0a0] hover:text-[#e5e5e5] disabled:opacity-30 transition-colors duration-150"
              >
                {loadingMore ? '...' : 'load more'}
              </button>
            </div>
          )}

          {/* Bottom padding when selection bar is visible */}
          {selectMode && <div className="h-16" />}
        </>
      )}

      {/* Selection bar */}
      {selectMode && (
        <SelectionBar
          count={selectedIds.length}
          onPreview={openPreview}
          onCancel={exitSelectMode}
        />
      )}

      {/* Export preview modal */}
      <ExportPreviewModal
        open={previewOpen}
        markdown={previewMarkdown}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient, isConfigured } from '@/lib/supabase';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import SignalCard from './SignalCard';
import type { SignalFeedItem } from '@/lib/types';

const PAGE_SIZE = 20;

type FilterTab = 'active' | 'starred' | 'archived' | 'all';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'starred', label: 'Starred' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
];

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

  const fetchSignals = useCallback(async (currentOffset: number, currentFilter: FilterTab) => {
    if (!isConfigured) {
      setSignals(MOCK_SIGNALS);
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
          setSignals(prev => {
            return prev
              .map(s => s.id === updated.id ? { ...s, ...updated } : s)
              .filter(s => {
                // Remove items that no longer match current filter
                if (filter === 'active' && s.is_archived) return false;
                if (filter === 'starred' && !s.is_starred) return false;
                if (filter === 'archived' && !s.is_archived) return false;
                return true;
              });
          });
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    setLoadingMore(true);
    await fetchSignals(newOffset, filter);
    setLoadingMore(false);
  };

  // In active view, partition into starred (pinned) and unstarred
  const starred = filter === 'active' ? signals.filter(s => s.is_starred) : [];
  const unstarred = filter === 'active' ? signals.filter(s => !s.is_starred) : signals;

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-3 text-xs font-mono">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => changeFilter(tab.key)}
            className={`px-3 py-1 rounded transition-colors duration-150 ${
              filter === tab.key
                ? 'text-[#e5e5e5] bg-white/[0.06]'
                : 'text-[#525252] hover:text-[#737373]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#525252] font-mono">
          loading...
        </div>
      ) : signals.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#525252] font-mono">
          {filter === 'active' ? 'no signals yet' :
           filter === 'starred' ? 'no starred signals' :
           filter === 'archived' ? 'no archived signals' :
           'no signals yet'}
        </div>
      ) : (
        <>
          <div className="border-t border-white/[0.06]">
            {/* Pinned starred section (active tab only) */}
            {starred.length > 0 && (
              <>
                {starred.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
                <div className="h-px bg-[#eab308]/20" />
              </>
            )}
            {unstarred.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>

          {hasMore && (
            <div className="py-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-1.5 text-xs font-mono text-[#737373] hover:text-[#e5e5e5] disabled:opacity-30 transition-colors duration-150"
              >
                {loadingMore ? '...' : 'load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

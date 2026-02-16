'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient, isConfigured } from '@/lib/supabase';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import SignalCard from './SignalCard';
import type { SignalFeedItem } from '@/lib/types';

const PAGE_SIZE = 20;

const NULL_ENRICHMENT: Partial<SignalFeedItem> = {
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

  const fetchSignals = useCallback(async (currentOffset: number) => {
    if (!isConfigured) {
      setSignals(MOCK_SIGNALS);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/signals?limit=${PAGE_SIZE}&offset=${currentOffset}`);
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
      fetchSignals(0);
    }
  }, [fetchSignals, hasInitial]);

  // Listen for instant signal capture events
  useEffect(() => {
    const handler = (e: Event) => {
      const raw = (e as CustomEvent).detail;
      if (!raw?.id) return;
      const newSignal: SignalFeedItem = { ...raw, ...NULL_ENRICHMENT };
      setSignals(prev =>
        prev.some(s => s.id === newSignal.id) ? prev : [newSignal, ...prev]
      );
    };
    window.addEventListener('signal-captured', handler);
    return () => window.removeEventListener('signal-captured', handler);
  }, []);

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
          setSignals(prev =>
            prev.map(s =>
              s.id === updated.id ? { ...s, ...updated } : s
            )
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    setLoadingMore(true);
    await fetchSignals(newOffset);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-[#525252] font-mono">
        loading...
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[#525252] font-mono">
        no signals yet
      </div>
    );
  }

  return (
    <div>
      <div className="border-t border-white/[0.06]">
        {signals.map((signal) => (
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
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient, isConfigured } from '@/lib/supabase';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import SignalCard from './SignalCard';
import type { SignalFeedItem } from '@/lib/types';

const PAGE_SIZE = 20;

export default function SignalFeed() {
  const [signals, setSignals] = useState<SignalFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
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

  useEffect(() => {
    fetchSignals(0);
  }, [fetchSignals]);

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
          setSignals(prev => [newSignal, ...prev]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchSignals(newOffset);
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
            className="px-4 py-1.5 text-xs font-mono text-[#737373] hover:text-[#e5e5e5] transition-colors duration-150"
          >
            load more
          </button>
        </div>
      )}
    </div>
  );
}

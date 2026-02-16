'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import type { SignalFeedItem } from '@/lib/types';
import { useSwipe, PANEL_WIDTH, type RevealedSide } from '@/lib/use-swipe';
import { toggleStar, toggleArchive } from '@/lib/signal-actions';
import SignalCard from './SignalCard';

interface Props {
  signal: SignalFeedItem;
  isOpen: boolean;
  onOpenChange: (id: string | null) => void;
}

export default function SwipeableCard({ signal, isOpen, onOpenChange }: Props) {
  const onCommitLeft = useCallback(() => {
    toggleArchive(signal.id, signal.is_archived).catch(() => {});
  }, [signal.id, signal.is_archived]);

  const onCommitRight = useCallback(() => {
    toggleStar(signal.id, signal.is_starred).catch(() => {});
  }, [signal.id, signal.is_starred]);

  const onRevealChange = useCallback(
    (side: RevealedSide) => {
      if (side !== null) {
        onOpenChange(signal.id);
      } else if (isOpen) {
        onOpenChange(null);
      }
    },
    [signal.id, isOpen, onOpenChange],
  );

  const swipe = useSwipe({
    onCommitLeft,
    onCommitRight,
    onRevealChange,
    forceClose: !isOpen,
  });

  const transitionStyle = swipe.isAnimating
    ? 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1)'
    : 'none';

  return (
    <div className="relative overflow-hidden border-b border-white/5">
      {/* Left panel (star) — revealed by swiping right — touch only */}
      <div
        className="absolute inset-y-0 left-0 hidden pointer-coarse:flex items-center justify-center bg-[#eab308]/20 text-[#eab308]"
        style={{ width: PANEL_WIDTH }}
      >
        <span className="text-xl">{signal.is_starred ? '\u2605' : '\u2606'}</span>
      </div>

      {/* Right panel (archive) — revealed by swiping left — touch only */}
      <div
        className="absolute inset-y-0 right-0 hidden pointer-coarse:flex items-center justify-center bg-white/5 text-[#737373]"
        style={{ width: PANEL_WIDTH }}
      >
        <span className="text-xs font-mono">
          {signal.is_archived ? 'unarchive' : 'archive'}
        </span>
      </div>

      {/* Sliding surface */}
      <div
        style={{
          transform: `translateX(${swipe.offsetX}px)`,
          transition: transitionStyle,
          touchAction: 'pan-y pinch-zoom',
        }}
        onPointerDown={swipe.handlers.onPointerDown}
        onPointerMove={swipe.handlers.onPointerMove}
        onPointerUp={swipe.handlers.onPointerUp}
        onPointerCancel={swipe.handlers.onPointerCancel}
        className="relative bg-[#0a0a0a]"
      >
        <Link
          href={`/signal/${signal.id}`}
          onClick={(e) => {
            if (swipe.isSwiping || swipe.revealedSide) {
              e.preventDefault();
              if (swipe.revealedSide) {
                swipe.close();
                onOpenChange(null);
              }
            }
          }}
          className="group block hover:bg-white/[0.02] transition-colors duration-150"
        >
          <SignalCard signal={signal} />
        </Link>
      </div>
    </div>
  );
}

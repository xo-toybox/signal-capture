'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const DEADZONE = 10;
export const EDGE_MARGIN = 20;
export const REVEAL_THRESHOLD = 80;
export const DAMPING = 0.2;
export const PANEL_WIDTH = 80;

export type RevealedSide = 'left' | 'right' | null;

export interface UseSwipeOptions {
  onCommitLeft?: () => void;
  onCommitRight?: () => void;
  onRevealChange?: (side: RevealedSide) => void;
  forceClose?: boolean;
  enabled?: boolean;
}

export interface UseSwipeReturn {
  offsetX: number;
  isSwiping: boolean;
  revealedSide: RevealedSide;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  close: () => void;
  isAnimating: boolean;
}

export function useSwipe({
  onCommitLeft,
  onCommitRight,
  onRevealChange,
  forceClose = false,
  enabled = true,
}: UseSwipeOptions = {}): UseSwipeReturn {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [revealedSide, setRevealedSide] = useState<RevealedSide>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const directionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);
  const activeRef = useRef(false);
  const swipedRef = useRef(false);
  const cardWidthRef = useRef(0);

  const close = useCallback(() => {
    setIsAnimating(true);
    setOffsetX(0);
    setRevealedSide(null);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // Reset state when parent signals this card should close (another card opened).
  /* eslint-disable react-hooks/set-state-in-effect -- resetting state in response to prop change */
  useEffect(() => {
    if (forceClose && revealedSide !== null) {
      setIsAnimating(true);
      setOffsetX(0);
      setRevealedSide(null);
      const t = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(t);
    }
  }, [forceClose, revealedSide]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pointerIdRef = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      // Ignore non-primary buttons (right click, etc.)
      if (e.button !== 0) return;
      // Ignore edge swipes (iOS back gesture)
      if (e.clientX < EDGE_MARGIN || e.clientX > window.innerWidth - EDGE_MARGIN) return;

      activeRef.current = true;
      swipedRef.current = false;
      directionLockedRef.current = null;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      cardWidthRef.current = (e.currentTarget as HTMLElement).offsetWidth;
      pointerIdRef.current = e.pointerId;

      setIsAnimating(false);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeRef.current) return;

      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;

      // Determine direction lock
      if (directionLockedRef.current === null) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx < DEADZONE && absDy < DEADZONE) return;

        if (absDy > absDx) {
          // Vertical — let browser scroll
          directionLockedRef.current = 'vertical';
          activeRef.current = false;
          return;
        }

        directionLockedRef.current = 'horizontal';
        // Capture pointer now that we know it's a horizontal swipe
        if (pointerIdRef.current !== null) {
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(pointerIdRef.current);
          } catch {
            // element may have been unmounted
          }
        }
        setIsSwiping(true);
      }

      if (directionLockedRef.current !== 'horizontal') return;

      e.preventDefault();
      swipedRef.current = true;

      // Apply resistance beyond panel width
      let clampedDx = dx;
      if (Math.abs(dx) > PANEL_WIDTH) {
        const overflow = Math.abs(dx) - PANEL_WIDTH;
        clampedDx = (PANEL_WIDTH + overflow * DAMPING) * Math.sign(dx);
      }

      setOffsetX(clampedDx);
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!activeRef.current && !swipedRef.current) return;
      activeRef.current = false;

      const dx = e.clientX - startXRef.current;
      const absDx = Math.abs(dx);
      const commitThreshold = cardWidthRef.current * 0.5;

      setIsSwiping(false);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      if (directionLockedRef.current !== 'horizontal') {
        // Was a tap or vertical scroll
        setOffsetX(0);
        return;
      }

      // Full swipe — auto-commit
      if (absDx >= commitThreshold) {
        if (dx < 0) onCommitLeft?.();
        else onCommitRight?.();
        setOffsetX(0);
        setRevealedSide(null);
        onRevealChange?.(null);
        return;
      }

      // Partial swipe — snap to reveal or close
      if (absDx >= REVEAL_THRESHOLD) {
        if (dx < 0) {
          setOffsetX(-PANEL_WIDTH);
          setRevealedSide('left');
          onRevealChange?.('left');
        } else {
          setOffsetX(PANEL_WIDTH);
          setRevealedSide('right');
          onRevealChange?.('right');
        }
      } else {
        setOffsetX(0);
        setRevealedSide(null);
        onRevealChange?.(null);
      }
    },
    [onCommitLeft, onCommitRight, onRevealChange],
  );

  const onPointerCancel = useCallback(
    () => {
      activeRef.current = false;
      setIsSwiping(false);
      setIsAnimating(true);
      setOffsetX(0);
      setRevealedSide(null);
      onRevealChange?.(null);
      setTimeout(() => setIsAnimating(false), 300);
    },
    [onRevealChange],
  );

  return {
    offsetX,
    isSwiping,
    revealedSide,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    close,
    isAnimating,
  };
}

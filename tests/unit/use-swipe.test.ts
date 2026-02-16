// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSwipe,
  DEADZONE,
  EDGE_MARGIN,
  REVEAL_THRESHOLD,
  PANEL_WIDTH,
} from '@/lib/use-swipe';

// Helper to create pointer events with required fields
function makeMockElement() {
  const el = document.createElement('div');
  Object.defineProperty(el, 'offsetWidth', { value: 375 });
  el.setPointerCapture = vi.fn();
  el.releasePointerCapture = vi.fn();
  return el;
}

function pointerEvent(
  clientX: number,
  clientY: number,
  overrides: Partial<React.PointerEvent> = {},
): React.PointerEvent {
  const el = makeMockElement();

  return {
    clientX,
    clientY,
    button: 0,
    pointerId: 1,
    currentTarget: el,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as React.PointerEvent;
}

// Simulate a full gesture: down → move(s) → up
function swipeGesture(
  handlers: ReturnType<typeof useSwipe>['handlers'],
  startX: number,
  endX: number,
  startY = 100,
  endY = 100,
) {
  act(() => handlers.onPointerDown(pointerEvent(startX, startY)));

  // Move past deadzone first, then to destination
  const midX = startX + Math.sign(endX - startX) * (DEADZONE + 1);
  act(() => handlers.onPointerMove(pointerEvent(midX, startY)));
  act(() => handlers.onPointerMove(pointerEvent(endX, endY)));
  act(() => handlers.onPointerUp(pointerEvent(endX, endY)));
}

describe('useSwipe', () => {
  beforeEach(() => {
    // Set window.innerWidth for edge detection
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
  });

  describe('deadzone', () => {
    it('movement below deadzone does not start swiping', () => {
      const { result } = renderHook(() => useSwipe());

      act(() => {
        result.current.handlers.onPointerDown(pointerEvent(100, 100));
      });
      act(() => {
        result.current.handlers.onPointerMove(pointerEvent(100 + DEADZONE - 1, 100));
      });

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.offsetX).toBe(0);
    });

    it('movement beyond deadzone starts swiping', () => {
      const { result } = renderHook(() => useSwipe());

      act(() => {
        result.current.handlers.onPointerDown(pointerEvent(100, 100));
      });
      act(() => {
        result.current.handlers.onPointerMove(pointerEvent(100 + DEADZONE + 1, 100));
      });

      expect(result.current.isSwiping).toBe(true);
      expect(result.current.offsetX).not.toBe(0);
    });
  });

  describe('direction lock', () => {
    it('vertical movement releases capture and stops tracking', () => {
      const { result } = renderHook(() => useSwipe());
      const el = makeMockElement();

      const downEvt = pointerEvent(100, 100, {
        currentTarget: el,
      } as Partial<React.PointerEvent>);

      act(() => result.current.handlers.onPointerDown(downEvt));
      act(() => {
        result.current.handlers.onPointerMove(
          pointerEvent(102, 100 + DEADZONE + 5, {
            currentTarget: el,
          } as Partial<React.PointerEvent>),
        );
      });

      expect(result.current.isSwiping).toBe(false);
      // Pointer capture is deferred to horizontal lock, so vertical never captures
      expect(el.setPointerCapture).not.toHaveBeenCalled();
    });

    it('horizontal movement locks to horizontal', () => {
      const { result } = renderHook(() => useSwipe());

      act(() => result.current.handlers.onPointerDown(pointerEvent(100, 100)));
      act(() =>
        result.current.handlers.onPointerMove(pointerEvent(100 + DEADZONE + 5, 102)),
      );

      expect(result.current.isSwiping).toBe(true);
    });
  });

  describe('edge margin', () => {
    it('ignores swipes starting near left edge', () => {
      const { result } = renderHook(() => useSwipe());

      act(() => result.current.handlers.onPointerDown(pointerEvent(EDGE_MARGIN - 1, 100)));
      act(() =>
        result.current.handlers.onPointerMove(pointerEvent(EDGE_MARGIN - 1 + 50, 100)),
      );

      expect(result.current.isSwiping).toBe(false);
    });

    it('ignores swipes starting near right edge', () => {
      const { result } = renderHook(() => useSwipe());

      act(() =>
        result.current.handlers.onPointerDown(
          pointerEvent(window.innerWidth - EDGE_MARGIN + 1, 100),
        ),
      );

      expect(result.current.isSwiping).toBe(false);
    });
  });

  describe('reveal threshold', () => {
    it('partial swipe left beyond threshold snaps to panel width', () => {
      const { result } = renderHook(() => useSwipe());

      swipeGesture(result.current.handlers, 200, 200 - REVEAL_THRESHOLD - 5);

      expect(result.current.offsetX).toBe(-PANEL_WIDTH);
      expect(result.current.revealedSide).toBe('left');
    });

    it('partial swipe right beyond threshold snaps to panel width', () => {
      const { result } = renderHook(() => useSwipe());

      swipeGesture(result.current.handlers, 100, 100 + REVEAL_THRESHOLD + 5);

      expect(result.current.offsetX).toBe(PANEL_WIDTH);
      expect(result.current.revealedSide).toBe('right');
    });

    it('partial swipe below threshold snaps back to zero', () => {
      const { result } = renderHook(() => useSwipe());

      swipeGesture(result.current.handlers, 200, 200 - REVEAL_THRESHOLD + 5);

      expect(result.current.offsetX).toBe(0);
      expect(result.current.revealedSide).toBeNull();
    });
  });

  describe('commit threshold', () => {
    it('full swipe left triggers onCommitLeft', () => {
      const onCommitLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onCommitLeft }));

      // Swipe more than 50% of card width (375 * 0.5 = 187.5)
      swipeGesture(result.current.handlers, 300, 300 - 200);

      expect(onCommitLeft).toHaveBeenCalledOnce();
      expect(result.current.offsetX).toBe(0);
    });

    it('full swipe right triggers onCommitRight', () => {
      const onCommitRight = vi.fn();
      const { result } = renderHook(() => useSwipe({ onCommitRight }));

      swipeGesture(result.current.handlers, 50, 50 + 200);

      expect(onCommitRight).toHaveBeenCalledOnce();
      expect(result.current.offsetX).toBe(0);
    });

    it('full swipe left without handler snaps back', () => {
      const { result } = renderHook(() => useSwipe());

      swipeGesture(result.current.handlers, 300, 300 - 200);

      expect(result.current.offsetX).toBe(0);
      expect(result.current.revealedSide).toBeNull();
    });
  });

  describe('forceClose', () => {
    it('closes revealed panel when forceClose becomes true', () => {
      const { result, rerender } = renderHook(
        ({ forceClose }) => useSwipe({ forceClose }),
        { initialProps: { forceClose: false } },
      );

      // Reveal a panel first
      swipeGesture(result.current.handlers, 100, 100 + REVEAL_THRESHOLD + 5);
      expect(result.current.revealedSide).toBe('right');

      // Force close
      rerender({ forceClose: true });

      expect(result.current.offsetX).toBe(0);
      expect(result.current.revealedSide).toBeNull();
    });
  });

  describe('close', () => {
    it('close() resets offset and revealed side', () => {
      const { result } = renderHook(() => useSwipe());

      swipeGesture(result.current.handlers, 100, 100 + REVEAL_THRESHOLD + 5);
      expect(result.current.revealedSide).toBe('right');

      act(() => result.current.close());

      expect(result.current.offsetX).toBe(0);
      expect(result.current.revealedSide).toBeNull();
    });
  });

  describe('enabled', () => {
    it('does not respond to pointer events when disabled', () => {
      const { result } = renderHook(() => useSwipe({ enabled: false }));

      act(() => result.current.handlers.onPointerDown(pointerEvent(100, 100)));
      act(() =>
        result.current.handlers.onPointerMove(pointerEvent(200, 100)),
      );

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.offsetX).toBe(0);
    });
  });
});

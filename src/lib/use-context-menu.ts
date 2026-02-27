'use client';

import { useCallback, useEffect, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface ContextMenuState {
  isOpen: boolean;
  position: Position;
  targetId: string | null;
}

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetId: null,
  });

  const open = useCallback((e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Viewport-aware positioning
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 300);

    setState({ isOpen: true, position: { x, y }, targetId });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false, targetId: null }));
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClick = () => close();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, close]);

  return { ...state, open, close };
}

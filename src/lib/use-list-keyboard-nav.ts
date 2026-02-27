'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from '@/lib/use-command-palette';
import { useToast } from '@/lib/use-toast';
import { isInputFocused } from '@/lib/is-input-focused';
import { toggleStar, toggleArchive, deleteSignal, restoreSignal } from '@/lib/signal-actions';
import type { SignalFeedItem } from '@/lib/types';

interface Options {
  signals: SignalFeedItem[];
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectMode: () => void;
}

export function useListKeyboardNav({ signals, selectMode, onToggleSelect, onToggleSelectMode }: Options) {
  const [rawFocusedIndex, setFocusedIndex] = useState(-1);
  const router = useRouter();
  const { isOpen: paletteOpen } = useCommandPalette();
  const { show } = useToast();

  // Clamp focus index without useEffect
  const focusedIndex = useMemo(
    () => rawFocusedIndex >= signals.length ? Math.max(signals.length - 1, -1) : rawFocusedIndex,
    [rawFocusedIndex, signals.length],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isInputFocused() || paletteOpen) return;
    // Don't intercept modifier combos (except our specific ones)
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const signal = focusedIndex >= 0 ? signals[focusedIndex] : null;

    switch (e.key) {
      case 'j': {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, signals.length - 1));
        break;
      }
      case 'k': {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      }
      case 'Enter': {
        if (signal && !selectMode) {
          e.preventDefault();
          router.push(`/signal/${signal.id}`);
        }
        break;
      }
      case 's': {
        if (signal) {
          e.preventDefault();
          toggleStar(signal.id, signal.is_starred).catch(() => {});
          show(signal.is_starred ? 'Unstarred' : 'Starred');
        }
        break;
      }
      case 'e': {
        if (signal) {
          e.preventDefault();
          toggleArchive(signal.id, signal.is_archived).catch(() => {});
          show(signal.is_archived ? 'Unarchived' : 'Archived', () => {
            toggleArchive(signal.id, !signal.is_archived).catch(() => {});
          });
        }
        break;
      }
      case 'd': {
        if (signal) {
          e.preventDefault();
          deleteSignal(signal.id).catch(() => {});
          show('Signal deleted', () => {
            restoreSignal(signal.raw_input, signal.source_url).catch(() => {});
          });
        }
        break;
      }
      case 'x': {
        if (signal) {
          e.preventDefault();
          if (!selectMode) onToggleSelectMode();
          onToggleSelect(signal.id);
        }
        break;
      }
    }
  }, [focusedIndex, signals, selectMode, paletteOpen, router, show, onToggleSelect, onToggleSelectMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0) return;
    const el = document.querySelector(`[data-signal-index="${focusedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  return { focusedIndex, setFocusedIndex };
}

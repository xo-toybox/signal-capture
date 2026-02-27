'use client';

import { type ReactNode } from 'react';
import { CommandPaletteContext, useCommandPaletteState } from '@/lib/use-command-palette';
import CommandPalette from './CommandPalette';

export default function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const state = useCommandPaletteState();

  return (
    <CommandPaletteContext value={state}>
      {children}
      <CommandPalette />
    </CommandPaletteContext>
  );
}

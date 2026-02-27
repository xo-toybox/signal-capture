'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandPalette } from '@/lib/use-command-palette';
import { fuzzyFilter } from '@/lib/fuzzy-match';

interface Command {
  id: string;
  label: string;
  section: 'navigate' | 'action' | 'signal';
  shortcut?: string;
  onSelect: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  navigate: 'Navigate',
  action: 'Actions',
  signal: 'Signals',
};

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [rawActiveIndex, setRawActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<Command[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const staticCommands = useMemo<Command[]>(() => [
    { id: 'nav-signals', label: 'Signals', section: 'navigate', shortcut: 'G S', onSelect: () => { router.push('/'); close(); } },
    { id: 'nav-projects', label: 'Projects', section: 'navigate', shortcut: 'G P', onSelect: () => { router.push('/projects'); close(); } },
    { id: 'nav-blog', label: 'Blog', section: 'navigate', shortcut: 'G B', onSelect: () => { router.push('/blog'); close(); } },
    { id: 'nav-docs', label: 'Docs', section: 'navigate', shortcut: 'G D', onSelect: () => { router.push('/docs'); close(); } },
    { id: 'act-new', label: 'New Signal', section: 'action', shortcut: '/', onSelect: () => { close(); setTimeout(() => { const el = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="URL"]'); el?.focus(); }, 50); } },
    { id: 'act-select', label: 'Toggle Select Mode', section: 'action', shortcut: 'X', onSelect: () => { close(); window.dispatchEvent(new CustomEvent('command:toggle-select')); } },
  ], [router, close]);

  // Search signals on query change
  useEffect(() => {
    if (!isOpen || query.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/signals?search=${encodeURIComponent(query)}&limit=5&filter=all`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const results: Command[] = (data.signals ?? []).map((s: { id: string; source_title?: string; raw_input: string }) => ({
            id: `signal-${s.id}`,
            label: s.source_title || s.raw_input.slice(0, 80),
            section: 'signal' as const,
            onSelect: () => { router.push(`/signal/${s.id}`); close(); },
          }));
          setSearchResults(results);
        }
      } catch {
        // aborted or network error
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen, router, close]);

  const filteredStatic = useMemo(
    () => fuzzyFilter(staticCommands, query, (c) => c.label),
    [staticCommands, query],
  );

  const allCommands = useMemo(
    () => [...filteredStatic, ...searchResults],
    [filteredStatic, searchResults],
  );

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setRawActiveIndex(0);
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Clamp active index without useEffect
  const activeIndex = useMemo(
    () => Math.min(rawActiveIndex, Math.max(allCommands.length - 1, 0)),
    [rawActiveIndex, allCommands.length],
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setRawActiveIndex((i) => Math.min(i + 1, allCommands.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setRawActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && allCommands[activeIndex]) {
      e.preventDefault();
      allCommands[activeIndex].onSelect();
    }
  }, [allCommands, activeIndex, close]);

  if (!isOpen) return null;

  // Group commands by section
  const sections: { key: string; items: Command[] }[] = [];
  const seen = new Set<string>();
  for (const cmd of allCommands) {
    if (!seen.has(cmd.section)) {
      seen.add(cmd.section);
      sections.push({ key: cmd.section, items: [] });
    }
    sections.find((s) => s.key === cmd.section)!.items.push(cmd);
  }

  let itemIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[20vh]"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-lg border border-white/[0.08] bg-[#141414] shadow-2xl shadow-black/60 overflow-hidden modal-enter">
        {/* Input */}
        <div className="flex items-center border-b border-white/[0.06] px-4">
          <span className="text-[#888888] text-sm mr-2">&#9002;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setRawActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-3 text-sm font-mono text-[#e5e5e5] placeholder:text-[#888888] outline-none"
          />
          {searching && (
            <span className="text-[10px] font-mono text-[#888888] animate-pulse">...</span>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
          {allCommands.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs font-mono text-[#888888]">
              {query ? 'No results' : 'Start typing...'}
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.key}>
                <div className="px-4 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-[#888888]">
                  {SECTION_LABELS[section.key] ?? section.key}
                </div>
                {section.items.map((cmd) => {
                  const idx = itemIndex++;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.onSelect}
                      onMouseEnter={() => setRawActiveIndex(idx)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm font-mono transition-colors duration-75 ${
                        isActive ? 'bg-white/[0.06] text-[#e5e5e5]' : 'text-[#a0a0a0]'
                      }`}
                    >
                      <span className="truncate">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="ml-3 flex-shrink-0 text-[10px] text-[#888888] font-mono">
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-4 py-2 flex gap-4 text-[10px] font-mono text-[#888888]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

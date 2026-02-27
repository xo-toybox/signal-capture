'use client';

import { useEffect } from 'react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: '⌘ K', description: 'Command palette' },
      { keys: '/', description: 'Focus capture form' },
      { keys: '?', description: 'Keyboard shortcuts' },
      { keys: 'Esc', description: 'Close modal / exit mode' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: 'G S', description: 'Go to Signals' },
      { keys: 'G P', description: 'Go to Projects' },
      { keys: 'G B', description: 'Go to Blog' },
      { keys: 'G D', description: 'Go to Docs' },
    ],
  },
  {
    title: 'Feed',
    shortcuts: [
      { keys: 'J', description: 'Next signal' },
      { keys: 'K', description: 'Previous signal' },
      { keys: '↵', description: 'Open signal' },
      { keys: 'S', description: 'Star / unstar' },
      { keys: 'E', description: 'Archive / unarchive' },
      { keys: 'D', description: 'Delete (with undo)' },
      { keys: 'X', description: 'Toggle selection' },
    ],
  },
  {
    title: 'Editing',
    shortcuts: [
      { keys: 'Tab', description: 'Next field' },
      { keys: 'Esc', description: 'Cancel edit' },
      { keys: '⌘ ↵', description: 'Submit' },
    ],
  },
];

export default function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 rounded-lg border border-white/[0.08] bg-[#141414] shadow-2xl shadow-black/60 overflow-hidden modal-enter">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-xs font-mono uppercase tracking-widest text-[#888888]">
            Keyboard Shortcuts
          </span>
          <button onClick={onClose} className="text-[#888888] hover:text-[#e5e5e5] transition-colors text-lg leading-none">
            ×
          </button>
        </div>

        <div className="px-4 py-3 max-h-[60vh] overflow-y-auto space-y-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#888888] mb-1.5">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.shortcuts.map((sc) => (
                  <div key={sc.keys} className="flex items-center justify-between py-1">
                    <span className="text-xs text-[#a0a0a0]">{sc.description}</span>
                    <span className="text-[10px] font-mono text-[#888888] bg-white/[0.04] px-1.5 py-0.5 rounded">
                      {sc.keys}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toggleStar, toggleArchive, togglePublish, deleteSignal, restoreSignal } from '@/lib/signal-actions';
import { useToast } from '@/lib/use-toast';
import type { SignalFeedItem } from '@/lib/types';

interface MenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  danger?: boolean;
}

interface Props {
  signal: SignalFeedItem;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function ContextMenu({ signal, position, onClose }: Props) {
  const router = useRouter();
  const { show } = useToast();

  const items: MenuItem[] = [
    {
      label: 'Open',
      shortcut: '↵',
      onClick: () => router.push(`/signal/${signal.id}`),
    },
    {
      label: signal.is_starred ? 'Unstar' : 'Star',
      shortcut: 'S',
      onClick: () => {
        toggleStar(signal.id, signal.is_starred).catch(() => {});
        show(signal.is_starred ? 'Unstarred' : 'Starred');
      },
    },
    {
      label: signal.is_archived ? 'Unarchive' : 'Archive',
      shortcut: 'E',
      onClick: () => {
        toggleArchive(signal.id, signal.is_archived).catch(() => {});
        show(signal.is_archived ? 'Unarchived' : 'Archived', () => {
          toggleArchive(signal.id, !signal.is_archived).catch(() => {});
        });
      },
    },
    {
      label: signal.is_published ? 'Unpublish' : 'Publish',
      onClick: () => {
        togglePublish(signal.id, signal.is_published).catch(() => {});
        show(signal.is_published ? 'Unpublished' : 'Published', () => {
          togglePublish(signal.id, !signal.is_published).catch(() => {});
        });
      },
    },
    {
      label: 'Copy URL',
      onClick: () => {
        const url = `${window.location.origin}/signal/${signal.id}`;
        navigator.clipboard.writeText(url).then(
          () => show('URL copied'),
          () => show('Failed to copy'),
        );
      },
    },
    {
      label: 'Delete',
      shortcut: 'D',
      danger: true,
      onClick: () => {
        deleteSignal(signal.id).catch(() => {});
        show('Signal deleted', () => {
          restoreSignal(signal.raw_input, signal.source_url).catch(() => {});
        });
      },
    },
  ];

  const handleItemClick = useCallback((item: MenuItem) => {
    item.onClick();
    onClose();
  }, [onClose]);

  return (
    <div
      className="fixed z-[80] hidden sm:block pointer-coarse:!hidden"
      style={{ left: position.x, top: position.y }}
    >
      <div className="min-w-[180px] py-1 rounded-lg border border-white/[0.08] bg-[#1a1a1a] shadow-xl shadow-black/50 modal-enter">
        {items.map((item, i) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs font-mono transition-colors duration-75 hover:bg-white/[0.06] ${
              item.danger ? 'text-[#ef4444]' : 'text-[#e5e5e5]'
            } ${i === items.length - 1 ? 'mt-1 border-t border-white/[0.06] pt-1.5' : ''}`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-[10px] text-[#888888]">{item.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

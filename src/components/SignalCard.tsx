'use client';

import Link from 'next/link';
import { safeArray, type SignalFeedItem } from '@/lib/types';
import { STATUS_BG_COLORS } from '@/lib/constants';
import InlineDeleteButton from './InlineDeleteButton';
import StarButton from './StarButton';
import ArchiveButton from './ArchiveButton';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SignalCard({ signal }: { signal: SignalFeedItem }) {
  const isEnriched = signal.processing_status === 'complete' && signal.source_title;
  const displayTitle = signal.source_title ?? signal.fetched_title;
  const tags = safeArray(signal.domain_tags).slice(0, 3);
  const claimCount = safeArray(signal.key_claims).length;

  return (
    <Link
      href={`/signal/${signal.id}`}
      className="group flex border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150"
    >
      <div
        className={`w-0.5 flex-shrink-0 ${STATUS_BG_COLORS[signal.processing_status]}`}
      />

      <div className="flex-1 px-3 py-2.5 min-w-0">
        {isEnriched ? (
          <>
            <div className="text-sm text-[#e5e5e5] truncate">
              {signal.source_title}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#737373]">
              {claimCount > 0 && (
                <span>{claimCount} claim{claimCount !== 1 ? 's' : ''}</span>
              )}
              {tags.length > 0 && (
                <>
                  <span className="text-white/10">|</span>
                  <span className="truncate font-mono">
                    {tags.join(' · ')}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={`text-sm ${displayTitle ? '' : 'font-mono'} text-[#e5e5e5] truncate`}>
              {displayTitle ?? signal.raw_input}
            </div>
            {signal.capture_context && (
              <div className="text-xs text-[#737373] mt-1 truncate">
                {signal.capture_context}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2.5 self-start">
        <StarButton signalId={signal.id} isStarred={signal.is_starred} />
        <ArchiveButton signalId={signal.id} isArchived={signal.is_archived} />
        <span className="text-xs text-[#525252] font-mono">
          {relativeTime(signal.created_at)}
        </span>
        <InlineDeleteButton signalId={signal.id} />
      </div>
    </Link>
  );
}

export const dynamic = 'force-dynamic';

import { createServiceClient, isConfigured } from '@/lib/supabase-server';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import { safeArray, type SignalFeedItem } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function safeUrl(s: string | null): string | null {
  if (!s) return null;
  try {
    const parsed = new URL(s);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let signal: SignalFeedItem | null = null;

  if (isConfigured) {
    if (!UUID_RE.test(id)) notFound();

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('signals_feed')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    signal = data as SignalFeedItem | null;
  } else {
    const found = MOCK_SIGNALS.find(s => s.id === id);
    signal = found?.is_published ? found : null;
  }

  if (!signal) notFound();

  const s = signal;
  const isEnriched = s.processing_status === 'complete' && s.key_claims;
  const publishDate = s.published_at
    ? new Date(s.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const validatedSourceUrl = safeUrl(s.source_url);
  const tags = safeArray(s.domain_tags);

  return (
    <main className="pb-12">
      <Link
        href="/blog"
        className="text-xs font-mono text-[#a0a0a0] hover:text-[#e5e5e5] transition-colors"
      >
        &larr; all posts
      </Link>

      <div className="mt-4">
        <h1 className="text-lg text-[#e5e5e5]">
          {s.source_title ?? s.fetched_title ?? s.raw_input.slice(0, 100)}
        </h1>

        <div className="flex items-center gap-2 mt-2 text-xs text-[#888888] font-mono">
          {publishDate && <span>{publishDate}</span>}
          {s.signal_type && (
            <>
              {publishDate && <span className="text-white/10">|</span>}
              <span>{s.signal_type.replace(/_/g, ' ')}</span>
            </>
          )}
        </div>
      </div>

      {validatedSourceUrl && (
        <>
          <SectionHeader label="Source" />
          <a
            href={validatedSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#3b82f6] hover:underline truncate block max-w-full"
          >
            {s.source_url}
          </a>
        </>
      )}

      <SectionHeader label="Raw Capture" />
      <div className="font-mono text-sm text-[#e5e5e5] whitespace-pre-wrap leading-relaxed">
        {s.raw_input}
      </div>
      {s.capture_context && (
        <div className="mt-2 text-xs text-[#a0a0a0]">
          {s.capture_context}
        </div>
      )}

      {isEnriched && (() => {
        const claims = safeArray(s.key_claims);
        return (
          <>
            {claims.length > 0 && (
              <>
                <SectionHeader label="Key Claims" />
                <ul className="space-y-1.5">
                  {claims.map((claim, i) => (
                    <li key={i} className="flex gap-2 text-sm font-mono">
                      <span className="text-[#888888] flex-shrink-0">-</span>
                      <span className="text-[#e5e5e5]">{claim}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {s.novelty_assessment && (
              <>
                <SectionHeader label="Novelty" />
                <p className="text-sm text-[#e5e5e5] leading-relaxed">
                  {s.novelty_assessment}
                </p>
              </>
            )}

            {tags.length > 0 && (
              <>
                <SectionHeader label="Tags" />
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs font-mono text-[#a0a0a0] border border-white/[0.06] rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}

            {s.cross_signal_notes && (
              <>
                <SectionHeader label="Cross-Signal Notes" />
                <p className="text-sm text-[#e5e5e5] leading-relaxed">
                  {s.cross_signal_notes}
                </p>
              </>
            )}
          </>
        );
      })()}

      {(s.human_note || s.human_rating) && (
        <>
          <SectionHeader label="Notes" />
          {s.human_rating && (
            <div className="text-xs font-mono text-[#a0a0a0] mb-1">
              Rating: {s.human_rating}/5
            </div>
          )}
          {s.human_note && (
            <p className="text-sm text-[#e5e5e5]">{s.human_note}</p>
          )}
        </>
      )}
    </main>
  );
}

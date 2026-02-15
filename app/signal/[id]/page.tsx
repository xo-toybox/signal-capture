import { createServerClient, createServiceClient, isConfigured } from '@/lib/supabase-server';
import { MOCK_SIGNALS } from '@/lib/mock-data';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { SignalFeedItem, ProcessingStatus } from '@/lib/types';
import DeleteButton from '@/components/DeleteButton';

const STATUS_LABELS: Record<ProcessingStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  review: 'In Review',
  complete: 'Complete',
  dismissed: 'Dismissed',
  failed: 'Failed',
};

const STATUS_COLORS: Record<ProcessingStatus, string> = {
  pending: 'text-[#eab308]',
  processing: 'text-[#3b82f6]',
  review: 'text-[#3b82f6]',
  complete: 'text-[#22c55e]',
  dismissed: 'text-[#ef4444]',
  failed: 'text-[#ef4444]',
};

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-2">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#525252]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

export default async function SignalDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let signal;
  if (isConfigured) {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) redirect('/login');

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('signals_feed')
      .select('*')
      .eq('id', id)
      .single();
    signal = data;
  } else {
    signal = MOCK_SIGNALS.find(s => s.id === id) ?? null;
  }

  if (!signal) {
    return (
      <main className="pt-6">
        <Link
          href="/"
          className="text-xs font-mono text-[#737373] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; back
        </Link>
        <div className="py-12 text-center text-xs text-[#525252] font-mono">
          signal not found
        </div>
      </main>
    );
  }

  const s = signal as SignalFeedItem;
  const isEnriched = s.processing_status === 'complete' && s.key_claims;
  const capturedAt = new Date(s.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <main className="pt-6 pb-12">
      <Link
        href="/"
        className="text-xs font-mono text-[#737373] hover:text-[#e5e5e5] transition-colors"
      >
        &larr; back
      </Link>

      <div className="mt-4">
        {isEnriched && s.source_title ? (
          <h1 className="text-lg text-[#e5e5e5] leading-tight">{s.source_title}</h1>
        ) : (
          <h1 className="text-lg font-mono text-[#e5e5e5] leading-tight">
            {s.raw_input.length > 100 ? s.raw_input.slice(0, 100) + '...' : s.raw_input}
          </h1>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className={STATUS_COLORS[s.processing_status]}>
            {STATUS_LABELS[s.processing_status]}
          </span>
          {s.source_tier && (
            <>
              <span className="text-white/10">|</span>
              <span className="text-[#737373] font-mono">{s.source_tier}</span>
            </>
          )}
          {s.frontier_status && s.frontier_status !== 'not_frontier' && (
            <>
              <span className="text-white/10">|</span>
              <span className="text-[#737373] font-mono">{s.frontier_status}</span>
            </>
          )}
        </div>

        <div className="text-xs text-[#525252] mt-1 font-mono">{capturedAt}</div>
      </div>

      <SectionHeader label="Raw Capture" />
      <div className="font-mono text-sm text-[#e5e5e5] whitespace-pre-wrap leading-relaxed">
        {s.raw_input}
      </div>
      {s.capture_context && (
        <div className="mt-2 text-sm text-[#737373] italic">
          {s.capture_context}
        </div>
      )}
      {s.source_url && /^https?:\/\//.test(s.source_url) && (
        <a
          href={s.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-mono text-[#3b82f6] hover:underline truncate max-w-full"
        >
          {s.source_url}
        </a>
      )}

      {isEnriched && (
        <>
          {s.key_claims && s.key_claims.length > 0 && (
            <>
              <SectionHeader label="Key Claims" />
              <ul className="space-y-1.5">
                {s.key_claims.map((claim, i) => (
                  <li key={i} className="flex gap-2 text-sm font-mono">
                    <span className="text-[#525252] flex-shrink-0">-</span>
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

          {s.domain_tags && s.domain_tags.length > 0 && (
            <>
              <SectionHeader label="Tags" />
              <div className="flex flex-wrap gap-1.5">
                {s.domain_tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs font-mono text-[#737373] border border-white/[0.06] rounded"
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

          {s.confidence !== null && (
            <>
              <SectionHeader label="Confidence" />
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3b82f6] rounded-full"
                    style={{ width: `${(s.confidence ?? 0) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-[#737373]">
                  {((s.confidence ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </>
      )}

      {!isEnriched && s.processing_status === 'pending' && (
        <div className="mt-8 py-6 text-center text-xs text-[#525252] font-mono border-t border-white/[0.06]">
          awaiting enrichment
        </div>
      )}

      {(s.human_note || s.human_rating) && (
        <>
          <SectionHeader label="Notes" />
          {s.human_rating && (
            <div className="text-xs font-mono text-[#737373] mb-1">
              Rating: {s.human_rating}/5
            </div>
          )}
          {s.human_note && (
            <p className="text-sm text-[#e5e5e5]">{s.human_note}</p>
          )}
        </>
      )}

      <div className="mt-10 pt-6 border-t border-white/[0.06]">
        <DeleteButton id={s.id} />
      </div>
    </main>
  );
}

import Link from 'next/link';
import { getAllDocs } from '@/lib/docs';
import EscapeBack from '@/components/EscapeBack';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function topicTitle(topic: string): string {
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function DocsPage() {
  const docs = getAllDocs();

  return (
    <main className="pt-6 space-y-6">
      <EscapeBack href="/" />
      <header>
        <Link
          href="/"
          className="text-xs font-mono text-[#737373] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; Signal Capture
        </Link>
      </header>

      <section>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#525252]">
            Docs
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <div>
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/[0.02] -mx-2 px-2 transition-colors"
            >
              <span className="text-sm text-[#e5e5e5]">
                {topicTitle(doc.topic)}
              </span>
              <span className="text-xs font-mono text-[#525252]">
                {formatDate(doc.date)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

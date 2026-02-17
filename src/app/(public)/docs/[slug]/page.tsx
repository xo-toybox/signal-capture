import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDoc, getDocSlugs } from '@/lib/docs';
import Prose from '@/components/Prose';
import EscapeBack from '@/components/EscapeBack';

function topicTitle(topic: string): string {
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateStaticParams() {
  return getDocSlugs().map((slug) => ({ slug }));
}

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  // Strip HTML comments, leading h1 (shown in page header), and image refs (relative paths won't resolve)
  const content = doc.content
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
    .replace(/^#\s+.+\n+/, '')
    .replace(/!\[.*?\]\(.*?\)\n*/g, '');

  return (
    <main className="pt-6 space-y-5">
      <EscapeBack href="/docs" />
      <header className="space-y-3">
        <Link
          href="/docs"
          className="text-xs font-mono text-[#737373] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; Docs
        </Link>

        <div>
          <h1 className="text-lg text-[#e5e5e5]">
            {topicTitle(doc.topic)}
          </h1>
          <p className="text-xs font-mono text-[#525252] mt-1">
            {formatDate(doc.date)}
          </p>
        </div>
      </header>

      <div className="h-px bg-white/[0.06]" />

      <Prose content={content} />
    </main>
  );
}

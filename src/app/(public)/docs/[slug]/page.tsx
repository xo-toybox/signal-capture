import { notFound } from 'next/navigation';
import { getDoc, getDocSlugs, topicTitle } from '@/lib/docs';
import Prose from '@/components/Prose';

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
    <main className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-lg text-[#e5e5e5]">{topicTitle(doc.topic)}</h1>
        <p className="text-xs font-mono text-[#888888]">{formatDate(doc.date)}</p>
      </header>

      <div className="h-px bg-white/[0.06]" />

      <Prose content={content} />
    </main>
  );
}

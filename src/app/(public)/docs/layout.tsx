import Link from 'next/link';
import { getAllDocs } from '@/lib/docs';
import DocsSidebar from '@/components/DocsSidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getAllDocs();
  const sidebarDocs = docs.map(({ slug, topic, date }) => ({
    slug,
    topic,
    date,
  }));

  return (
    <div className="pt-6 space-y-4">
      {/* Top breadcrumb */}
      <header>
        <Link
          href="/"
          className="text-xs font-mono text-[#737373] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; Signal Capture
        </Link>
      </header>

      {/* Two-column layout: content + sidebar */}
      <div className="flex gap-8 items-start">
        <div className="min-w-0 flex-1">{children}</div>
        <DocsSidebar docs={sidebarDocs} />
      </div>
    </div>
  );
}

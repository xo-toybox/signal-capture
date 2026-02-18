import Link from 'next/link';
import { getAllDocsMeta } from '@/lib/docs';
import DocsSidebar from '@/components/DocsSidebar';
import EscapeBack from '@/components/EscapeBack';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarDocs = getAllDocsMeta();

  return (
    <div className="pt-6 space-y-4">
      <EscapeBack href="/" />
      {/* Top breadcrumb + mobile docs toggle */}
      <header className="flex items-center">
        <Link
          href="/"
          className="text-xs font-mono text-[#a0a0a0] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; Signal Capture
        </Link>
        <div className="flex-1" />
        <span id="docs-nav-toggle" className="relative z-50" />
      </header>

      {/* Two-column layout: content + sidebar */}
      <div className="flex gap-8 items-start">
        <div className="min-w-0 flex-1">{children}</div>
        <DocsSidebar docs={sidebarDocs} />
      </div>
    </div>
  );
}

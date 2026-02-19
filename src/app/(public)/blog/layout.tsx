import Link from 'next/link';
import EscapeBack from '@/components/EscapeBack';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-6 space-y-4">
      <EscapeBack href="/" />
      <header>
        <Link
          href="/"
          className="text-xs font-mono text-[#a0a0a0] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; Signal Capture
        </Link>
      </header>
      {children}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DocEntry {
  slug: string;
  topic: string;
  date: string;
}

function topicTitle(topic: string): string {
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function DocsSidebar({ docs }: { docs: DocEntry[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1a1a1a] border border-white/10 text-[#737373] hover:text-[#e5e5e5] hover:border-white/20 transition-colors text-xs font-mono"
        aria-label={open ? 'Close docs menu' : 'Open docs menu'}
      >
        {open ? '✕ close' : '≡ docs'}
      </button>

      {/* Sidebar */}
      <nav
        className={[
          // Base layout
          'flex-shrink-0 w-44',
          // Desktop: always visible, sticky
          'md:block md:sticky md:top-6 md:h-fit',
          // Mobile: fixed overlay, toggled
          open
            ? 'fixed inset-y-0 right-0 z-40 w-56 bg-[#111] border-l border-white/10 pt-12 px-4 pb-6 overflow-y-auto block'
            : 'hidden md:block',
        ].join(' ')}
      >
        <div className="space-y-1">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[#525252] mb-3">
            Docs
          </span>
          {docs.map((doc) => {
            const href = `/docs/${doc.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={doc.slug}
                href={href}
                onClick={() => setOpen(false)}
                className={[
                  'block py-1.5 px-2 rounded text-sm transition-colors',
                  active
                    ? 'text-[#e5e5e5] bg-white/[0.06]'
                    : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-white/[0.03]',
                ].join(' ')}
              >
                {topicTitle(doc.topic)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

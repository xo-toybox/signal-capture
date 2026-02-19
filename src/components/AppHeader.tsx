'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ExternalLinks from '@/components/ExternalLinks';

const NAV_TABS = [
  { href: '/', label: 'Signals', match: (p: string) => p === '/' || p.startsWith('/signal') },
  { href: '/projects', label: 'Projects', match: (p: string) => p.startsWith('/projects') },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
      <h1 className="text-xs font-mono uppercase tracking-widest text-[#a0a0a0]">
        Signal Capture
      </h1>

      <nav className="flex gap-1 ml-4 text-xs font-mono">
        {NAV_TABS.map(tab => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1 rounded transition-colors duration-150 ${
                active
                  ? 'text-[#e5e5e5] bg-white/[0.06]'
                  : 'text-[#888888] hover:text-[#a0a0a0]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />
      <ExternalLinks />
    </header>
  );
}

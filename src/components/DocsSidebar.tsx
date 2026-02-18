'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DocMeta } from '@/lib/docs';

function topicTitle(topic: string): string {
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const MD_BREAKPOINT = 768;

export default function DocsSidebar({ docs }: { docs: DocMeta[] }) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only DOM lookup
    setPortalTarget(document.getElementById('docs-nav-toggle'));
    const mql = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    setIsDesktop(mql.matches);
    if (mql.matches) setOpen(true);
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      setOpen(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Close mobile menu on Escape (capture phase to beat EscapeBack)
  useEffect(() => {
    if (!open || isDesktop) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [open, isDesktop]);

  const toggle = (
    <button
      onClick={() => setOpen((v) => !v)}
      className="min-h-11 min-w-11 flex items-center justify-center text-[#888888] hover:text-[#e5e5e5] transition-colors"
      aria-label={open ? 'Close docs panel' : 'Open docs panel'}
    >
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-[18px] h-[18px]">
        <path d="M2.75 2A1.75 1.75 0 0 0 1 3.75v8.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 12.25v-8.5A1.75 1.75 0 0 0 13.25 2ZM2.5 3.75a.25.25 0 0 1 .25-.25H10v9H2.75a.25.25 0 0 1-.25-.25Zm9 8.75V3.5h1.75a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25Z" />
      </svg>
    </button>
  );

  const navContent = (
    <div className="space-y-1">
      <span className="block text-[10px] font-mono uppercase tracking-widest text-[#888888] mb-3">
        Docs
      </span>
      {docs.map((doc) => {
        const href = `/docs/${doc.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={doc.slug}
            href={href}
            onClick={() => { if (!isDesktop) setOpen(false); }}
            className={[
              'block py-1.5 px-2 rounded text-sm transition-colors border-l-2',
              active
                ? 'text-[#e5e5e5] bg-white/[0.06] border-[#3b82f6]'
                : 'text-[#a0a0a0] hover:text-[#e5e5e5] hover:bg-white/[0.03] border-transparent',
            ].join(' ')}
          >
            {topicTitle(doc.topic)}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Toggle — portaled into the header breadcrumb row */}
      {portalTarget && createPortal(toggle, portalTarget)}

      {/* Sidebar — desktop: inline sticky; mobile: fixed overlay */}
      {open && (
        <nav
          className={
            isDesktop
              ? 'flex-shrink-0 w-44 sticky top-6 h-fit'
              : 'fixed inset-y-0 right-0 z-40 w-56 bg-[#111] border-l border-white/10 pt-12 px-4 pb-6 overflow-y-auto'
          }
        >
          {navContent}
        </nav>
      )}

      {/* Mobile backdrop */}
      {open && !isDesktop && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

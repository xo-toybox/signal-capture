'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EscapeBack({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      router.push(href);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [href, router]);

  return null;
}

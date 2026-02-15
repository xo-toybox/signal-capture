import { Suspense } from 'react';
import CaptureForm from '@/components/CaptureForm';
import SignalFeed from '@/components/SignalFeed';

export default function Home() {
  return (
    <main className="pt-6 space-y-6">
      <header className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
        <h1 className="text-xs font-mono uppercase tracking-widest text-[#737373]">
          Signal Capture
        </h1>
      </header>

      <Suspense fallback={null}>
        <CaptureForm />
      </Suspense>

      <section>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#525252]">
            Recent
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <SignalFeed />
      </section>
    </main>
  );
}

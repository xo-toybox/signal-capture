'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => isConfigured ? createClient() : null, []);

  const accessDenied = searchParams.get('error') === 'access_denied';
  const error = accessDenied ? 'Access denied. This account is not authorized.' : authError;

  useEffect(() => {
    if (accessDenied) {
      supabase?.auth.signOut();
    }
  }, [accessDenied, supabase]);

  const handleSignIn = async () => {
    if (!supabase) return;
    setLoading(true);
    setAuthError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (oauthError) {
      setAuthError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-mono text-[#e5e5e5] tracking-tight">
          Signal Capture
        </h1>
        <p className="text-xs font-mono text-[#525252]">
          authenticate to continue
        </p>
      </div>

      {error && (
        <p className="text-xs font-mono text-[#ef4444]">{error}</p>
      )}

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="px-6 py-2 text-xs font-mono uppercase tracking-wider border border-white/20 rounded text-[#e5e5e5] hover:bg-[#3b82f6] hover:border-[#3b82f6] disabled:opacity-30 transition-all duration-150"
      >
        {loading ? '...' : 'Sign in with Google'}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Suspense>
        <LoginContent />
      </Suspense>
    </main>
  );
}

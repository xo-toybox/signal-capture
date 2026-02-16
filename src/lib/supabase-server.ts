import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isConfigured = !!(url && anonKey && serviceKey);

export async function createServerClient() {
  if (!url || !anonKey) {
    throw new Error('Supabase not configured: missing URL or anon key');
  }
  const cookieStore = await cookies();
  return createSupabaseServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignored: setAll unavailable in Server Components
        }
      },
    },
  });
}

function isLocalUrl(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  } catch {
    return false;
  }
}

export async function getUser() {
  if (process.env.NODE_ENV !== 'production') return { id: 'dev', email: 'dev@localhost' };
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Client for queries — service client in dev (bypasses RLS), server client in production. */
export async function createQueryClient() {
  if (process.env.NODE_ENV !== 'production' && isConfigured) {
    return createServiceClient();
  }
  return createServerClient();
}

export function createServiceClient() {
  if (!isConfigured) {
    throw new Error('Supabase not configured');
  }
  if (process.env.NODE_ENV !== 'production' && url && !isLocalUrl(url)) {
    throw new Error(
      'Refusing to create service client against remote Supabase in development. ' +
      'Use `make dev-docker` for local Supabase or `make db-pull` to seed local data.'
    );
  }
  return createSupabaseClient(url!, serviceKey!);
}

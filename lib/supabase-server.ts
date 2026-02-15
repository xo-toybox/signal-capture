import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isConfigured = !!(url && serviceKey);

export async function createServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(url!, anonKey!, {
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

export function createServiceClient() {
  if (!isConfigured) {
    throw new Error('Supabase not configured');
  }
  return createSupabaseClient(url!, serviceKey!);
}

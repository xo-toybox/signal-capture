import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = !!(url && key);

// Browser client — anon key, read-only via RLS. Used only for realtime subscriptions.
export function createClient() {
  if (!isConfigured) {
    throw new Error('Supabase not configured');
  }
  return createBrowserClient(url!, key!);
}

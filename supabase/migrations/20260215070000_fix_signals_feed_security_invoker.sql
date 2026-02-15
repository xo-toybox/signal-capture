-- Fix: signals_feed view was SECURITY DEFINER (Supabase default), which bypasses
-- RLS on underlying tables. Switch to SECURITY INVOKER so the querying user's
-- RLS policies are enforced.
ALTER VIEW signals_feed SET (security_invoker = on);

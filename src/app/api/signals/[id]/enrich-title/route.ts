import { createServerClient, createServiceClient } from '@/lib/supabase-server';
import { fetchPageTitle } from '@/lib/fetch-title';
import { NextRequest } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 });
  }

  const service = createServiceClient();

  // Fetch the signal to check for source_url and existing title
  const { data: signal } = await service
    .from('signals_raw')
    .select('source_url, fetched_title')
    .eq('id', id)
    .single();

  if (!signal) {
    return Response.json({ error: 'Signal not found' }, { status: 404 });
  }

  if (!signal.source_url) {
    return Response.json({ skipped: 'no_url' });
  }

  if (signal.fetched_title) {
    return Response.json({ skipped: 'already_fetched' });
  }

  const title = await fetchPageTitle(signal.source_url);

  if (title) {
    await service
      .from('signals_raw')
      .update({ fetched_title: title })
      .eq('id', id);
  }

  return Response.json({ title: title ?? null });
}

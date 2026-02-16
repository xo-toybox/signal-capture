import { createServerClient, createServiceClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

const MAX_BATCH = 100;

function safeUrl(s: string): string | null {
  try {
    const parsed = new URL(s);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.captures) || body.captures.length === 0) {
    return Response.json({ error: 'captures array is required' }, { status: 400 });
  }

  if (body.captures.length > MAX_BATCH) {
    return Response.json({ error: `Maximum ${MAX_BATCH} captures per batch` }, { status: 400 });
  }

  const signals = [];
  for (const cap of body.captures) {
    const rawInput = typeof cap.raw_input === 'string' ? cap.raw_input.trim() : '';
    if (!rawInput || rawInput.length > 10000) continue;

    const sourceUrl = cap.source_url ? safeUrl(cap.source_url) : null;
    const captureContext = typeof cap.capture_context === 'string'
      ? cap.capture_context.trim().slice(0, 5000) || null
      : null;

    signals.push({
      source_url: sourceUrl,
      raw_input: rawInput,
      capture_context: captureContext,
      input_method: 'extension',
      processing_status: 'pending',
    });
  }

  if (signals.length === 0) {
    return Response.json({ error: 'No valid captures in batch' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('signals_raw')
    .insert(signals)
    .select('id, source_url');

  if (error) {
    console.error('signals batch POST error:', error);
    return Response.json({ error: 'Failed to capture signals' }, { status: 500 });
  }

  // Fire-and-forget title fetch for signals with URLs
  if (data) {
    const origin = request.nextUrl.origin;
    for (const row of data) {
      if (row.source_url) {
        fetch(`${origin}/api/signals/${row.id}/enrich-title`, {
          method: 'POST',
          headers: { Cookie: request.headers.get('cookie') ?? '' },
        }).catch(() => {});
      }
    }
  }

  return Response.json({ count: data?.length ?? 0 }, { status: 201 });
}

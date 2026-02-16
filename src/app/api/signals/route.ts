import { createServerClient, createServiceClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawInput = typeof body.raw_input === 'string' ? body.raw_input.trim() : '';
  if (!rawInput || rawInput.length > 10000) {
    return Response.json({ error: 'raw_input is required and must be under 10000 chars' }, { status: 400 });
  }

  const validMethods = ['text', 'voice', 'share', 'extension'];
  const inputMethod = validMethods.includes(body.input_method) ? body.input_method : 'text';

  function safeUrl(s: string): string | null {
    try {
      const parsed = new URL(s);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
    } catch { return null; }
  }

  const urlMatch = rawInput.match(/https?:\/\/[^\s]+/);
  const extractedUrl = urlMatch
    ? urlMatch[0].replace(/[.,;:!?)>\]]+$/, '')
    : null;
  const sourceUrl = (body.source_url && safeUrl(body.source_url))
    || (extractedUrl ? safeUrl(extractedUrl) : null);

  const captureContext = typeof body.capture_context === 'string'
    ? body.capture_context.trim().slice(0, 5000) || null
    : null;

  const signal = {
    source_url: sourceUrl,
    raw_input: rawInput,
    capture_context: captureContext,
    input_method: inputMethod,
    processing_status: 'pending',
  };

  const { data, error } = await supabase
    .from('signals_raw')
    .insert(signal)
    .select()
    .single();

  if (error) {
    console.error('signals POST error:', error);
    return Response.json({ error: 'Failed to capture signal' }, { status: 500 });
  }

  return Response.json({ signal: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ error: 'valid id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('signals_raw')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('signals DELETE error:', error);
    return Response.json({ error: 'Failed to delete signal' }, { status: 500 });
  }

  return Response.json({ deleted: id });
}

const PATCHABLE_FIELDS = new Set(['capture_context', 'is_starred', 'is_archived']);

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ error: 'valid id is required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (!PATCHABLE_FIELDS.has(key)) {
      return Response.json({ error: `Field '${key}' is not updatable` }, { status: 400 });
    }
  }

  if ('capture_context' in body) {
    updates.capture_context = typeof body.capture_context === 'string'
      ? body.capture_context.trim().slice(0, 5000) || null
      : null;
  }
  if ('is_starred' in body) {
    updates.is_starred = !!body.is_starred;
  }
  if ('is_archived' in body) {
    updates.is_archived = !!body.is_archived;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('signals_raw')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('signals PATCH error:', error);
    return Response.json({ error: 'Failed to update signal' }, { status: 500 });
  }

  return Response.json({ signal: data });
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { searchParams } = request.nextUrl;
  const parsedLimit = parseInt(searchParams.get('limit') ?? '20');
  const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 100);
  const parsedOffset = parseInt(searchParams.get('offset') ?? '0');
  const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);

  const filter = searchParams.get('filter') ?? 'active';

  let query = supabase
    .from('signals_feed')
    .select('*');

  if (filter === 'active') {
    query = query.eq('is_archived', false);
  } else if (filter === 'starred') {
    query = query.eq('is_starred', true);
  } else if (filter === 'archived') {
    query = query.eq('is_archived', true);
  }
  // 'all' — no filter

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('signals GET error:', error);
    return Response.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }

  return Response.json({ signals: data });
}

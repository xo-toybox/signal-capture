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
  const body = await request.json();

  const rawInput = typeof body.raw_input === 'string' ? body.raw_input.trim() : '';
  if (!rawInput || rawInput.length > 10000) {
    return Response.json({ error: 'raw_input is required and must be under 10000 chars' }, { status: 400 });
  }

  const validMethods = ['text', 'voice', 'share'];
  const inputMethod = validMethods.includes(body.input_method) ? body.input_method : 'text';

  const urlPattern = /^https?:\/\/[^\s]+$/;
  const urlMatch = rawInput.match(/https?:\/\/[^\s]+/);
  const sourceUrl = (body.source_url && urlPattern.test(body.source_url))
    ? body.source_url
    : (urlMatch ? urlMatch[0] : null);

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

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

  const { data, error } = await supabase
    .from('signals_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('signals GET error:', error);
    return Response.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }

  return Response.json({ signals: data });
}

import { createServiceClient, getUser, isConfigured } from '@/lib/supabase-server';
import { MOCK_THOUGHTS } from '@/lib/mock-data';
import { NextRequest } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (!isConfigured) {
    const thoughts = MOCK_THOUGHTS.filter(t => t.project_id === id);
    return Response.json({ thoughts });
  }

  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'valid project id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('project_thoughts')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('thoughts GET error:', error);
    return Response.json({ error: 'Failed to fetch thoughts' }, { status: 500 });
  }

  return Response.json({ thoughts: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 10000) {
    return Response.json({ error: 'content is required and must be under 10000 chars' }, { status: 400 });
  }

  if (!isConfigured) {
    return Response.json({
      thought: {
        id: `mock-thought-${Date.now()}`,
        project_id: id,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }, { status: 201 });
  }

  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'valid project id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Update project's updated_at timestamp
  supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)
    .then(({ error: updateErr }) => {
      if (updateErr) console.error('project updated_at error:', updateErr);
    });

  const { data, error } = await supabase
    .from('project_thoughts')
    .insert({ project_id: id, content })
    .select()
    .single();

  if (error) {
    console.error('thoughts POST error:', error);
    return Response.json({ error: 'Failed to create thought' }, { status: 500 });
  }

  return Response.json({ thought: data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await params; // consume params even if unused for project_id validation

  const thoughtId = request.nextUrl.searchParams.get('thoughtId');
  if (!thoughtId) {
    return Response.json({ error: 'thoughtId is required' }, { status: 400 });
  }

  if (!isConfigured) {
    return Response.json({ deleted: thoughtId });
  }

  if (!UUID_RE.test(thoughtId)) {
    return Response.json({ error: 'valid thoughtId is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('project_thoughts')
    .delete()
    .eq('id', thoughtId);

  if (error) {
    console.error('thoughts DELETE error:', error);
    return Response.json({ error: 'Failed to delete thought' }, { status: 500 });
  }

  return Response.json({ deleted: thoughtId });
}

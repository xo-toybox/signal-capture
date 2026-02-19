import { createServiceClient, getUser, isConfigured } from '@/lib/supabase-server';
import { MOCK_PROJECTS } from '@/lib/mock-data';
import { NextRequest } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_LAYERS = ['tactical', 'strategic', 'hibernating'];

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isConfigured) {
    return Response.json({ projects: MOCK_PROJECTS });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('projects GET error:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }

  return Response.json({ projects: data });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 200) {
    return Response.json({ error: 'name is required and must be under 200 chars' }, { status: 400 });
  }

  const layer = VALID_LAYERS.includes(body.layer) ? body.layer : 'tactical';
  const description = typeof body.description === 'string'
    ? body.description.trim().slice(0, 1000) || null
    : null;

  if (!isConfigured) {
    return Response.json({
      project: {
        id: `mock-proj-${Date.now()}`,
        name,
        description,
        layer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }, { status: 201 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, layer })
    .select()
    .single();

  if (error) {
    console.error('projects POST error:', error);
    return Response.json({ error: 'Failed to create project' }, { status: 500 });
  }

  return Response.json({ project: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'valid id is required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const PATCHABLE = new Set(['name', 'description', 'layer']);
  const updates: Record<string, unknown> = {};

  for (const key of Object.keys(body)) {
    if (!PATCHABLE.has(key)) {
      return Response.json({ error: `Field '${key}' is not updatable` }, { status: 400 });
    }
  }

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 200) {
      return Response.json({ error: 'name must be 1-200 chars' }, { status: 400 });
    }
    updates.name = name;
  }

  if ('description' in body) {
    updates.description = typeof body.description === 'string'
      ? body.description.trim().slice(0, 1000) || null
      : null;
  }

  if ('layer' in body) {
    if (!VALID_LAYERS.includes(body.layer)) {
      return Response.json({ error: 'layer must be tactical, strategic, or hibernating' }, { status: 400 });
    }
    updates.layer = body.layer;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  if (!isConfigured) {
    return Response.json({ project: { id, ...updates } });
  }

  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'valid id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('projects PATCH error:', error);
    return Response.json({ error: 'Failed to update project' }, { status: 500 });
  }

  return Response.json({ project: data });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return Response.json({ error: 'valid id is required' }, { status: 400 });
  }

  if (!isConfigured) {
    return Response.json({ deleted: id });
  }

  if (!UUID_RE.test(id)) {
    return Response.json({ error: 'valid id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('projects DELETE error:', error);
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }

  return Response.json({ deleted: id });
}

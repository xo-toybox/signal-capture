import { createServiceClient, getUser, isConfigured } from '@/lib/supabase-server';
import { MOCK_PROJECTS, MOCK_THOUGHTS, MOCK_SIGNALS } from '@/lib/mock-data';
import { redirect, notFound } from 'next/navigation';
import type { Project, ProjectThought, SignalFeedItem } from '@/lib/types';
import ProjectDetail from '@/components/ProjectDetail';
import EscapeBack from '@/components/EscapeBack';
import Link from 'next/link';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (isConfigured && !UUID_RE.test(id)) notFound();

  let project: Project | null = null;
  let thoughts: ProjectThought[] = [];
  let linkedSignals: SignalFeedItem[] = [];

  if (isConfigured) {
    const user = await getUser();
    if (!user) redirect('/login');

    const supabase = createServiceClient();

    const [projectRes, thoughtsRes, signalsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase
        .from('project_thoughts')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('signals_feed')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false }),
    ]);

    project = projectRes.data;
    thoughts = thoughtsRes.data ?? [];
    linkedSignals = signalsRes.data ?? [];
  } else {
    project = MOCK_PROJECTS.find(p => p.id === id) ?? null;
    thoughts = MOCK_THOUGHTS
      .filter(t => t.project_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    linkedSignals = MOCK_SIGNALS.filter(s => s.project_id === id);
  }

  if (!project) {
    return (
      <main className="pt-6">
        <Link
          href="/projects"
          className="text-xs font-mono text-[#a0a0a0] hover:text-[#e5e5e5] transition-colors"
        >
          &larr; projects
        </Link>
        <div className="py-12 text-center text-xs text-[#888888] font-mono">
          project not found
        </div>
      </main>
    );
  }

  return (
    <main className="pt-6 pb-12">
      <EscapeBack href="/projects" />
      <Link
        href="/projects"
        className="text-xs font-mono text-[#a0a0a0] hover:text-[#e5e5e5] transition-colors"
      >
        &larr; projects
      </Link>

      <ProjectDetail
        project={project}
        initialThoughts={thoughts}
        initialLinkedSignals={linkedSignals}
      />
    </main>
  );
}

import { createServiceClient, getUser, isConfigured } from '@/lib/supabase-server';
import { MOCK_PROJECTS, MOCK_THOUGHTS, MOCK_SIGNALS } from '@/lib/mock-data';
import { redirect } from 'next/navigation';
import type { Project } from '@/lib/types';
import ProjectsList from '@/components/ProjectsList';
import AppHeader from '@/components/AppHeader';
import EscapeBack from '@/components/EscapeBack';

export default async function ProjectsPage() {
  let projects: Project[] = [];
  const thoughtCounts: Record<string, number> = {};
  const signalCounts: Record<string, number> = {};

  if (isConfigured) {
    const user = await getUser();
    if (!user) redirect('/login');

    const supabase = createServiceClient();

    const [projectsRes, thoughtsRes, signalsRes] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('project_thoughts').select('project_id'),
      supabase.from('signals_raw').select('project_id').not('project_id', 'is', null),
    ]);

    projects = projectsRes.data ?? [];

    // Count thoughts per project
    for (const t of thoughtsRes.data ?? []) {
      thoughtCounts[t.project_id] = (thoughtCounts[t.project_id] ?? 0) + 1;
    }

    // Count signals per project
    for (const s of signalsRes.data ?? []) {
      if (s.project_id) {
        signalCounts[s.project_id] = (signalCounts[s.project_id] ?? 0) + 1;
      }
    }
  } else {
    projects = MOCK_PROJECTS;
    for (const t of MOCK_THOUGHTS) {
      thoughtCounts[t.project_id] = (thoughtCounts[t.project_id] ?? 0) + 1;
    }
    for (const s of MOCK_SIGNALS) {
      if (s.project_id) {
        signalCounts[s.project_id] = (signalCounts[s.project_id] ?? 0) + 1;
      }
    }
  }

  return (
    <main className="pt-6 space-y-6">
      <AppHeader />
      <EscapeBack href="/" />

      <ProjectsList
        initialProjects={projects}
        thoughtCounts={thoughtCounts}
        signalCounts={signalCounts}
      />
    </main>
  );
}

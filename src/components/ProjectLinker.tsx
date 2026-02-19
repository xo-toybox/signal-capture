'use client';

import { useState, useCallback } from 'react';
import type { Project } from '@/lib/types';

interface Props {
  signalId: string;
  currentProjectId: string | null;
  currentProjectName: string | null;
}

export default function ProjectLinker({ signalId, currentProjectId, currentProjectName }: Props) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkedId, setLinkedId] = useState(currentProjectId);
  const [linkedName, setLinkedName] = useState(currentProjectName);

  const fetchAndOpen = useCallback(async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (projects.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch {
      // ignored
    } finally {
      setLoading(false);
    }
  }, [open, projects.length]);

  const linkToProject = async (projectId: string | null, projectName: string | null) => {
    const prevId = linkedId;
    const prevName = linkedName;
    setLinkedId(projectId);
    setLinkedName(projectName);
    setOpen(false);

    try {
      const res = await fetch(`/api/signals?id=${signalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (!res.ok) {
        setLinkedId(prevId);
        setLinkedName(prevName);
      }
    } catch {
      setLinkedId(prevId);
      setLinkedName(prevName);
    }
  };

  return (
    <div className="relative">
      {linkedId ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#888888] font-mono">Linked to:</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#3b82f6]/10 text-[#3b82f6]">
            {linkedName}
          </span>
          <button
            type="button"
            onClick={fetchAndOpen}
            className="text-[#888888] hover:text-[#a0a0a0] font-mono transition-colors"
          >
            change
          </button>
          <button
            type="button"
            onClick={() => linkToProject(null, null)}
            className="text-[#888888] hover:text-[#ef4444] font-mono transition-colors"
          >
            unlink
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={fetchAndOpen}
          className="text-xs font-mono text-[#888888] hover:text-[#a0a0a0] transition-colors"
        >
          + Link to project
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[#1a1a1a] border border-white/[0.06] rounded py-1 min-w-[200px] max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-xs text-[#888888] font-mono">loading...</div>
            ) : projects.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#888888] font-mono">no projects</div>
            ) : (
              <>
                {linkedId && (
                  <button
                    type="button"
                    onClick={() => linkToProject(null, null)}
                    className="w-full text-left px-3 py-1.5 text-xs font-mono text-[#ef4444] hover:bg-white/[0.03] transition-colors"
                  >
                    Unlink
                  </button>
                )}
                {projects.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => linkToProject(p.id, p.name)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.03] transition-colors ${
                      p.id === linkedId ? 'text-[#3b82f6]' : 'text-[#a0a0a0]'
                    }`}
                  >
                    <span className="font-mono">{p.name}</span>
                    <span className="ml-2 text-[#888888]">{p.layer}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

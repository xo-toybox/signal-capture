'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Project, ProjectLayer } from '@/lib/types';

const LAYER_ORDER: ProjectLayer[] = ['tactical', 'strategic', 'hibernating'];

const LAYER_LABELS: Record<ProjectLayer, string> = {
  tactical: 'Tactical',
  strategic: 'Strategic',
  hibernating: 'Hibernating',
};

const LAYER_COLORS: Record<ProjectLayer, string> = {
  tactical: 'text-[#22c55e]',
  strategic: 'text-[#3b82f6]',
  hibernating: 'text-[#888888]',
};

interface Props {
  initialProjects: Project[];
  thoughtCounts: Record<string, number>;
  signalCounts: Record<string, number>;
}

export default function ProjectsList({ initialProjects, thoughtCounts, signalCounts }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({
    tactical: true,
    strategic: true,
    hibernating: false,
  });

  const grouped = LAYER_ORDER.map(layer => ({
    layer,
    projects: projects.filter(p => p.layer === layer),
  }));

  const toggleLayer = (layer: string) => {
    setExpandedLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, layer: 'tactical' }),
      });
      const data = await res.json();
      if (data.project) {
        setProjects(prev => [data.project, ...prev]);
        setNewName('');
        setCreating(false);
      }
    } catch {
      // ignored
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {grouped.map(({ layer, projects: layerProjects }) => {
        const expanded = expandedLayers[layer] ?? true;
        const count = layerProjects.length;

        return (
          <section key={layer}>
            <button
              type="button"
              onClick={() => toggleLayer(layer)}
              className="flex items-center gap-3 w-full group"
            >
              <span className={`text-[10px] font-mono uppercase tracking-widest ${LAYER_COLORS[layer]}`}>
                {LAYER_LABELS[layer]}
              </span>
              {!expanded && count > 0 && (
                <span className="text-[10px] font-mono text-[#888888]">
                  {count} project{count !== 1 ? 's' : ''}
                </span>
              )}
              <div className="flex-1 h-px bg-white/[0.06]" />
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className={`w-3 h-3 text-[#888888] transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
              >
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>

            {expanded && (
              <div className="mt-2 space-y-1">
                {layerProjects.length === 0 ? (
                  <div className="py-3 text-xs text-[#888888] font-mono pl-1">
                    no {layer} projects
                  </div>
                ) : (
                  layerProjects.map(project => {
                    const tc = thoughtCounts[project.id] ?? 0;
                    const sc = signalCounts[project.id] ?? 0;
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/[0.03] transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-[#e5e5e5] truncate">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-[#888888] truncate mt-0.5">
                              {project.description}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-xs text-[#888888] font-mono">
                          {tc > 0 && <span>{tc} thought{tc !== 1 ? 's' : ''}</span>}
                          {tc > 0 && sc > 0 && <span className="text-white/10"> · </span>}
                          {sc > 0 && <span>{sc} signal{sc !== 1 ? 's' : ''}</span>}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* Create new project */}
      <div className="pt-2">
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setCreating(false); setNewName(''); }
              }}
              placeholder="Project name..."
              autoFocus
              maxLength={200}
              className="flex-1 bg-transparent border border-white/[0.06] rounded px-3 py-1.5 text-sm text-[#e5e5e5] placeholder:text-[#888888] font-mono focus:outline-none focus:border-[#3b82f6]/30"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || submitting}
              className="px-3 py-1.5 text-xs font-mono text-[#3b82f6] hover:text-[#e5e5e5] disabled:opacity-30 transition-colors"
            >
              {submitting ? '...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setNewName(''); }}
              className="px-2 py-1.5 text-xs font-mono text-[#888888] hover:text-[#a0a0a0] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-xs font-mono text-[#888888] hover:text-[#a0a0a0] transition-colors"
          >
            + New Project
          </button>
        )}
      </div>
    </div>
  );
}

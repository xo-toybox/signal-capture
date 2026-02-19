'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import type { Project, ProjectThought, ProjectLayer, SignalFeedItem } from '@/lib/types';
import SignalCard from './SignalCard';

const LAYER_OPTIONS: { value: ProjectLayer; label: string }[] = [
  { value: 'tactical', label: 'Tactical' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'hibernating', label: 'Hibernating' },
];

const LAYER_COLORS: Record<ProjectLayer, string> = {
  tactical: 'text-[#22c55e]',
  strategic: 'text-[#3b82f6]',
  hibernating: 'text-[#888888]',
};

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  project: Project;
  initialThoughts: ProjectThought[];
  initialLinkedSignals: SignalFeedItem[];
}

export default function ProjectDetail({ project: initialProject, initialThoughts, initialLinkedSignals }: Props) {
  const [project, setProject] = useState(initialProject);
  const [thoughts, setThoughts] = useState(initialThoughts);
  const [linkedSignals, setLinkedSignals] = useState(initialLinkedSignals);
  const [newThought, setNewThought] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [layerOpen, setLayerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateLayer = async (layer: ProjectLayer) => {
    setLayerOpen(false);
    if (layer === project.layer) return;

    const prev = project.layer;
    setProject(p => ({ ...p, layer }));

    try {
      const res = await fetch(`/api/projects?id=${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layer }),
      });
      if (!res.ok) setProject(p => ({ ...p, layer: prev }));
    } catch {
      setProject(p => ({ ...p, layer: prev }));
    }
  };

  const addThought = async () => {
    const content = newThought.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/thoughts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.thought) {
        setThoughts(prev => [data.thought, ...prev]);
        setNewThought('');
      }
    } catch {
      // ignored
    } finally {
      setSubmitting(false);
    }
  };

  const deleteThought = async (thoughtId: string) => {
    const prev = thoughts;
    setThoughts(t => t.filter(th => th.id !== thoughtId));

    try {
      const res = await fetch(`/api/projects/${project.id}/thoughts?thoughtId=${thoughtId}`, {
        method: 'DELETE',
      });
      if (!res.ok) setThoughts(prev);
    } catch {
      setThoughts(prev);
    }
  };

  const unlinkSignal = async (signalId: string) => {
    const prev = linkedSignals;
    setLinkedSignals(s => s.filter(sig => sig.id !== signalId));

    try {
      const res = await fetch(`/api/signals?id=${signalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: null }),
      });
      if (!res.ok) setLinkedSignals(prev);
    } catch {
      setLinkedSignals(prev);
    }
  };

  return (
    <div className="mt-4">
      {/* Project header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg text-[#e5e5e5] leading-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm text-[#a0a0a0] mt-1">
              {project.description}
            </p>
          )}
        </div>

        {/* Layer dropdown */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setLayerOpen(!layerOpen)}
            className={`px-2.5 py-1 text-xs font-mono rounded border border-white/[0.06] transition-colors hover:border-white/10 ${LAYER_COLORS[project.layer]}`}
          >
            {project.layer}
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 inline ml-1 opacity-50">
              <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
            </svg>
          </button>

          {layerOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLayerOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-[#1a1a1a] border border-white/[0.06] rounded py-1 min-w-[140px]">
                {LAYER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateLayer(opt.value)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-white/[0.03] transition-colors ${
                      opt.value === project.layer ? 'text-[#e5e5e5]' : 'text-[#a0a0a0]'
                    }`}
                  >
                    {opt.label}
                    {opt.value === project.layer && (
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 inline ml-2 opacity-50">
                        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.751.751 0 01.018-1.042.751.751 0 011.042-.018L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thoughts section */}
      <div className="flex items-center gap-3 mt-6 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
          Thoughts
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Add thought */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          value={newThought}
          onChange={e => setNewThought(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              addThought();
            }
          }}
          placeholder="Add a thought..."
          rows={2}
          maxLength={10000}
          className="w-full bg-transparent border-l-2 border-white/[0.06] pl-3 py-2 text-sm text-[#e5e5e5] placeholder:text-[#888888] focus:outline-none resize-none"
        />
        {newThought.trim() && (
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setNewThought('')}
              className="px-2 py-1 text-xs font-mono text-[#888888] hover:text-[#a0a0a0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addThought}
              disabled={submitting}
              className="px-3 py-1 text-xs font-mono text-[#3b82f6] hover:text-[#e5e5e5] disabled:opacity-30 transition-colors"
            >
              {submitting ? '...' : 'Add'}
            </button>
          </div>
        )}
      </div>

      {/* Thoughts list */}
      <div className="space-y-3">
        {thoughts.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#888888] font-mono">
            no thoughts yet
          </div>
        ) : (
          thoughts.map(thought => (
            <div key={thought.id} className="group border-l-2 border-white/[0.06] pl-3 py-1">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#888888] font-mono">
                    {relativeDate(thought.created_at)}
                  </span>
                  <span className="text-xs text-white/10 mx-2">—</span>
                  <span className="text-sm text-[#e5e5e5] leading-relaxed">
                    {thought.content}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteThought(thought.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-[#888888] hover:text-[#ef4444] transition-all"
                  aria-label="Delete thought"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.749.749 0 011.275.326.749.749 0 01-.215.734L9.06 8l3.22 3.22a.749.749 0 01-.326 1.275.749.749 0 01-.734-.215L8 9.06l-3.22 3.22a.751.751 0 01-1.042-.018.751.751 0 01-.018-1.042L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Linked signals section */}
      <div className="flex items-center gap-3 mt-8 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">
          Linked Signals ({linkedSignals.length})
        </span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {linkedSignals.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#888888] font-mono">
          no linked signals
        </div>
      ) : (
        <div className="border-t border-white/[0.06]">
          {linkedSignals.map(signal => (
            <div key={signal.id} className="flex items-center group">
              <Link href={`/signal/${signal.id}`} className="flex-1 min-w-0">
                <SignalCard signal={signal} />
              </Link>
              <button
                type="button"
                onClick={() => unlinkSignal(signal.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 text-[#888888] hover:text-[#ef4444] transition-all"
                aria-label="Unlink signal"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.749.749 0 011.275.326.749.749 0 01-.215.734L9.06 8l3.22 3.22a.749.749 0 01-.326 1.275.749.749 0 01-.734-.215L8 9.06l-3.22 3.22a.751.751 0 01-1.042-.018.751.751 0 01-.018-1.042L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

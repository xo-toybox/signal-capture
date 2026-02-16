-- Local dev seed data (matches src/lib/mock-data.ts)
-- Applied automatically by: supabase db reset --local
-- NEVER run against production — Makefile _ensure-unlinked guard prevents this

INSERT INTO signals_raw (id, created_at, source_url, raw_input, capture_context, input_method, processing_status, processed_at, fetched_title, is_starred, is_archived)
VALUES
  ('00000000-0000-4000-a000-000000000001', now() - interval '2 minutes',
   'https://cursor.com/blog/browser-agents',
   'Cursor browser-building multi-agent experiment — flat swarm failed at scale, hierarchical orchestration resolved lock contention',
   'relates to backpressure pattern from Yegge podcast',
   'text', 'pending', NULL, NULL, false, false),

  ('00000000-0000-4000-a000-000000000002', now() - interval '1 hour',
   NULL,
   'Ralph Loop session memory architecture — persistent context across agent restarts via workspace files',
   NULL,
   'voice', 'complete', now() - interval '30 minutes', NULL, false, false),

  ('00000000-0000-4000-a000-000000000003', now() - interval '3 hours',
   'https://arxiv.org/abs/2503.13657',
   'MAST taxonomy for multi-agent failure modes — systematic classification of coordination failures',
   'need to cross-reference with Cursor experiment results',
   'text', 'processing', NULL, NULL, false, false),

  ('00000000-0000-4000-a000-000000000004', now() - interval '1 day',
   NULL,
   'bash outperforms MCP for agent tool use but can''t clear enterprise procurement — interesting tension between technical superiority and adoption pathway',
   NULL,
   'text', 'dismissed', now() - interval '20 hours', NULL, false, false),

  ('00000000-0000-4000-a000-000000000005', now() - interval '2 days',
   'https://latent.space/p/world-models-word-models',
   'Experts have world models, LLMs have word models — framing the architecture gap',
   'convergence with Logan Graham Anthropic tweet about agent economy',
   'share', 'complete', now() - interval '36 hours', NULL, false, false),

  ('00000000-0000-4000-a000-000000000006', now() - interval '3 days',
   NULL,
   'Monty sandbox — Pydantic creator building Python interpreter in Rust for microsecond LLM code execution sandboxing',
   'could obsolete E2B and Modal for simple execution',
   'text', 'complete', now() - interval '60 hours', NULL, false, false);

INSERT INTO signals_enriched (signal_id, enrichment_version, enriched_at, source_title, key_claims, novelty_assessment, domain_tags, signal_type, source_tier, frontier_status, confidence, cross_signal_notes)
VALUES
  ('00000000-0000-4000-a000-000000000002', 'v1', now() - interval '30 minutes',
   'Ralph Loop: Session Memory Architecture',
   '["Workspace files provide persistent context across agent session restarts", "Memory files split into daily logs vs curated long-term knowledge", "Heartbeat-based maintenance enables background memory consolidation", "Git-backed memory tracking enables auditable memory evolution"]'::jsonb,
   'First documented architecture for agent memory that separates raw logs from curated knowledge with automated consolidation.',
   '["memory-architecture", "agent-persistence", "workspace-design"]'::jsonb,
   'architectural_pattern', 'practitioner', 'achievable_now', 0.75,
   'Connects to OpenClaw memory system design. Similar pattern to human note-taking workflows (daily journal > periodic review > long-term memory).'),

  ('00000000-0000-4000-a000-000000000005', 'v1', now() - interval '36 hours',
   'World Models vs Word Models: The Architecture Gap',
   '["LLMs generate probable next tokens (word models) but lack strategic reasoning about other agents and hidden state (world models)", "Expert work requires dynamic decision-making considering multi-agent environments", "Current architecture defaults to single-shot artifact generation"]'::jsonb,
   'Frames the fundamental agent limitation as architectural, not scaling — need new architectures (Context Graphs, RLMs) rather than bigger models.',
   '["world-models", "architecture-gap", "agent-limitations", "strategic-reasoning"]'::jsonb,
   'conceptual_framework', 'field_leader', 'still_challenging', 0.85,
   'Cross-signal convergence: Twitter (Logan Graham, Anthropic) + Email (Latent.Space/swyx) arriving at same limitation from different angles.'),

  ('00000000-0000-4000-a000-000000000006', 'v1', now() - interval '60 hours',
   'Monty: Rust-Based Python Sandbox for LLM Code Execution',
   '["Microsecond startup vs seconds for traditional Python interpreters", "Built by Pydantic creator Samuel Colvin", "Targets LLM code execution sandboxing specifically"]'::jsonb,
   'Potential paradigm shift in sandbox economics — if execution is microseconds, the business model changes fundamentally.',
   '["sandboxing", "rust-python", "llm-execution"]'::jsonb,
   'tooling_evolution', 'trend_setter', 'upcoming_2026', 0.65,
   NULL);

INSERT INTO signals_human (signal_id, human_rating)
VALUES
  ('00000000-0000-4000-a000-000000000005', 4);

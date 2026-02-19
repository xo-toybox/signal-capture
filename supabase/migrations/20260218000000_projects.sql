-- Projects space: projects, thoughts, signal linking

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  layer TEXT NOT NULL DEFAULT 'tactical'
    CHECK (layer IN ('tactical', 'strategic', 'hibernating')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON projects
  FOR ALL USING (auth.role() = 'authenticated');

-- Project thoughts (freeform notes)
CREATE TABLE project_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE project_thoughts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON project_thoughts
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for fetching thoughts by project
CREATE INDEX idx_project_thoughts_project_id ON project_thoughts(project_id);

-- Link signals to projects (many-to-one)
ALTER TABLE signals_raw ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX idx_signals_raw_project_id ON signals_raw(project_id) WHERE project_id IS NOT NULL;

-- Recreate signals_feed view with project info
DROP VIEW IF EXISTS signals_feed;
CREATE VIEW signals_feed WITH (security_invoker = on) AS
SELECT
  r.id, r.created_at, r.source_url, r.raw_input, r.capture_context,
  r.input_method, r.processing_status, r.processed_at,
  r.fetched_title, r.is_starred, r.is_archived,
  r.project_id,
  p.name AS project_name,
  e.source_title, e.key_claims, e.novelty_assessment, e.domain_tags,
  e.signal_type, e.source_tier, e.frontier_status, e.confidence,
  e.cross_signal_notes,
  h.human_note, h.human_rating, h.tier_override
FROM signals_raw r
LEFT JOIN projects p ON p.id = r.project_id
LEFT JOIN signals_enriched e ON e.signal_id = r.id
LEFT JOIN signals_human h ON h.signal_id = r.id
ORDER BY r.created_at DESC;

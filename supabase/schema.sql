-- Signal Capture M1 Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- TABLE 1: Raw signals (immutable, owned by System A capture)
-- ============================================================
CREATE TABLE signals_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  source_url TEXT,
  raw_input TEXT NOT NULL,
  capture_context TEXT,
  input_method TEXT DEFAULT 'text'
    CHECK(input_method IN ('text', 'voice', 'share')),

  processing_status TEXT DEFAULT 'pending'
    CHECK(processing_status IN (
      'pending', 'processing', 'review',
      'complete', 'dismissed', 'failed'
    )),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_signals_raw_status ON signals_raw(processing_status)
  WHERE processing_status = 'pending';
CREATE INDEX idx_signals_raw_created ON signals_raw(created_at DESC);


-- ============================================================
-- TABLE 2: Enriched signals (derived, owned by System B)
-- ============================================================
CREATE TABLE signals_enriched (
  signal_id UUID PRIMARY KEY REFERENCES signals_raw(id) ON DELETE CASCADE,

  enrichment_version TEXT NOT NULL,
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_used TEXT,

  source_content TEXT,
  source_title TEXT,
  source_author TEXT,
  source_date TIMESTAMPTZ,
  source_type TEXT
    CHECK(source_type IN (
      'blog_post', 'paper', 'podcast', 'tweet_thread',
      'conversation', 'tool_release', 'announcement',
      'raw_observation', 'other'
    )),

  key_claims JSONB NOT NULL,
  novelty_assessment TEXT NOT NULL,
  domain_tags JSONB NOT NULL,
  signal_type TEXT
    CHECK(signal_type IN (
      'capability_advance', 'architectural_pattern',
      'market_signal', 'tooling_evolution',
      'conceptual_framework', 'empirical_finding',
      'practice_report', 'contrarian_claim', 'other'
    )),

  source_tier TEXT
    CHECK(source_tier IN (
      'field_leader', 'frontier_lab', 'practitioner',
      'trend_setter', 'frontier_iterator', 'unknown', 'other'
    )),

  -- Bridge to OpenClaw frontier-tracking taxonomy
  frontier_status TEXT
    CHECK(frontier_status IN (
      'achievable_now', 'upcoming_2026', 'still_challenging', 'not_frontier'
    )),

  confidence REAL DEFAULT 0.5,

  cross_signal_notes TEXT,
  related_signal_ids JSONB,

  embedding VECTOR(1536)
);

CREATE INDEX idx_signals_embedding ON signals_enriched
  USING hnsw (embedding vector_cosine_ops);

ALTER TABLE signals_enriched ADD COLUMN fts TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(source_title, '') || ' ' ||
      COALESCE(novelty_assessment, '') || ' ' ||
      COALESCE(cross_signal_notes, '')
    )
  ) STORED;
CREATE INDEX idx_signals_fts ON signals_enriched USING gin(fts);


-- ============================================================
-- TABLE 3: Human annotations (accumulated, never recomputed)
-- ============================================================
CREATE TABLE signals_human (
  signal_id UUID PRIMARY KEY REFERENCES signals_raw(id) ON DELETE CASCADE,

  human_note TEXT,
  human_rating INTEGER CHECK(human_rating BETWEEN 1 AND 5),
  trust_note TEXT,
  tag_overrides JSONB,
  tier_override TEXT
    CHECK(tier_override IN (
      'field_leader', 'frontier_lab', 'practitioner',
      'trend_setter', 'frontier_iterator', 'unknown', 'other'
    )),

  updated_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ
);


-- ============================================================
-- TABLE 4: Enrichment refinements (correction history)
-- ============================================================
CREATE TABLE signals_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals_raw(id) ON DELETE CASCADE,

  correction_input TEXT NOT NULL,
  previous_enrichment JSONB NOT NULL,
  revised_enrichment JSONB NOT NULL,
  applied BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_refinements_signal ON signals_refinements(signal_id);


-- ============================================================
-- VIEW: Unified signal view for feed display
-- ============================================================
CREATE VIEW signals_feed WITH (security_invoker = on) AS
SELECT
  r.id,
  r.created_at,
  r.source_url,
  r.raw_input,
  r.capture_context,
  r.input_method,
  r.processing_status,
  r.processed_at,
  e.source_title,
  e.key_claims,
  e.novelty_assessment,
  e.domain_tags,
  e.signal_type,
  e.source_tier,
  e.frontier_status,
  e.confidence,
  e.cross_signal_notes,
  h.human_note,
  h.human_rating,
  h.tier_override
FROM signals_raw r
LEFT JOIN signals_enriched e ON e.signal_id = r.id
LEFT JOIN signals_human h ON h.signal_id = r.id
ORDER BY r.created_at DESC;


-- ============================================================
-- RLS: Only authenticated users can read (needed for realtime subscriptions).
-- All writes go through API routes (service role, bypasses RLS).
-- ============================================================
ALTER TABLE signals_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals_enriched ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals_human ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals_refinements ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users (SELECT only — no INSERT, UPDATE, DELETE)
CREATE POLICY "Auth read" ON signals_raw FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read" ON signals_enriched FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read" ON signals_human FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth read" ON signals_refinements FOR SELECT USING (auth.role() = 'authenticated');


-- ============================================================
-- EVENT: Notify Discord on new signal capture
-- Replace {{DISCORD_WEBHOOK_URL}} with actual webhook URL
-- ============================================================
CREATE OR REPLACE FUNCTION notify_discord_new_signal()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := '{{DISCORD_WEBHOOK_URL}}',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'embeds', jsonb_build_array(
        jsonb_build_object(
          'title', LEFT(NEW.raw_input, 100),
          'description', COALESCE(NEW.capture_context, ''),
          'fields', jsonb_build_array(
            jsonb_build_object('name', 'URL', 'value', COALESCE(NEW.source_url, '_none_'), 'inline', true),
            jsonb_build_object('name', 'Method', 'value', NEW.input_method, 'inline', true),
            jsonb_build_object('name', 'ID', 'value', NEW.id::text, 'inline', false)
          ),
          'color', 5814783,
          'timestamp', NEW.created_at::text
        )
      )
    )::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_signal_capture
  AFTER INSERT ON signals_raw
  FOR EACH ROW EXECUTE FUNCTION notify_discord_new_signal();

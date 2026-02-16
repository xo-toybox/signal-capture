-- Feature batch: title fetch (F1), triage (F5), extension (F6)

-- Add fetched_title for link scraping (F1)
ALTER TABLE signals_raw ADD COLUMN IF NOT EXISTS fetched_title TEXT;

-- Add triage flags (F5)
ALTER TABLE signals_raw ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE signals_raw ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Indexes for triage filtering
CREATE INDEX IF NOT EXISTS idx_signals_raw_starred ON signals_raw(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_signals_raw_archived ON signals_raw(is_archived) WHERE is_archived = true;

-- Expand input_method for extension (F6)
ALTER TABLE signals_raw DROP CONSTRAINT IF EXISTS signals_raw_input_method_check;
ALTER TABLE signals_raw ADD CONSTRAINT signals_raw_input_method_check
  CHECK(input_method IN ('text', 'voice', 'share', 'extension'));

-- Recreate view with new columns
DROP VIEW IF EXISTS signals_feed;
CREATE VIEW signals_feed WITH (security_invoker = on) AS
SELECT
  r.id, r.created_at, r.source_url, r.raw_input, r.capture_context,
  r.input_method, r.processing_status, r.processed_at,
  r.fetched_title, r.is_starred, r.is_archived,
  e.source_title, e.key_claims, e.novelty_assessment, e.domain_tags,
  e.signal_type, e.source_tier, e.frontier_status, e.confidence,
  e.cross_signal_notes,
  h.human_note, h.human_rating, h.tier_override
FROM signals_raw r
LEFT JOIN signals_enriched e ON e.signal_id = r.id
LEFT JOIN signals_human h ON h.signal_id = r.id
ORDER BY r.created_at DESC;

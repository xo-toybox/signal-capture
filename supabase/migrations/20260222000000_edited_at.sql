-- Add edited_at timestamp to signals_raw
ALTER TABLE signals_raw ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Recreate signals_feed view with edited_at + project join (fixes missing project columns from blog_publish migration)
DROP VIEW IF EXISTS signals_feed;

CREATE VIEW signals_feed WITH (security_invoker = on) AS
SELECT
  r.id, r.created_at, r.source_url, r.raw_input, r.capture_context,
  r.input_method, r.processing_status, r.processed_at,
  r.fetched_title, r.is_starred, r.is_archived, r.is_published, r.published_at,
  r.edited_at,
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

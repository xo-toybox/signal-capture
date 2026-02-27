export type ProjectLayer = 'tactical' | 'strategic' | 'hibernating';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  layer: ProjectLayer;
  created_at: string;
  updated_at: string;
}

export interface ProjectThought {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'review'
  | 'complete'
  | 'dismissed'
  | 'failed';

export type InputMethod = 'text' | 'voice' | 'share' | 'extension';

export interface SignalRaw {
  id: string;
  created_at: string;
  source_url: string | null;
  raw_input: string;
  capture_context: string | null;
  input_method: InputMethod;
  processing_status: ProcessingStatus;
  processed_at: string | null;
  fetched_title: string | null;
  is_starred: boolean;
  is_archived: boolean;
  is_published: boolean;
  published_at: string | null;
  edited_at: string | null;
}

export interface SignalFeedItem {
  id: string;
  created_at: string;
  source_url: string | null;
  raw_input: string;
  capture_context: string | null;
  input_method: InputMethod;
  processing_status: ProcessingStatus;
  processed_at: string | null;
  fetched_title: string | null;
  is_starred: boolean;
  is_archived: boolean;
  is_published: boolean;
  published_at: string | null;
  edited_at: string | null;
  // Project link (null if unlinked)
  project_id: string | null;
  project_name: string | null;
  // Enrichment (null if not enriched)
  source_title: string | null;
  key_claims: string[] | null;
  novelty_assessment: string | null;
  domain_tags: string[] | null;
  signal_type: string | null;
  source_tier: string | null;
  frontier_status: string | null;
  confidence: number | null;
  cross_signal_notes: string | null;
  // Human annotations (null if none)
  human_note: string | null;
  human_rating: number | null;
  tier_override: string | null;
}

/** Safely coerce a JSONB value to string[]. Returns [] if not an array. */
export function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value : [];
}
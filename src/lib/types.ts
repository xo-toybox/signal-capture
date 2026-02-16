export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'review'
  | 'complete'
  | 'dismissed'
  | 'failed';

export type InputMethod = 'text' | 'voice' | 'share';

export interface SignalRaw {
  id: string;
  created_at: string;
  source_url: string | null;
  raw_input: string;
  capture_context: string | null;
  input_method: InputMethod;
  processing_status: ProcessingStatus;
  processed_at: string | null;
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
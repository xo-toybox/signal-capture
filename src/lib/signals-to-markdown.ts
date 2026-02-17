import { safeArray, type SignalFeedItem } from './types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function stars(rating: number): string {
  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  return '\u2605'.repeat(filled) + '\u2606'.repeat(5 - filled);
}

function signalTitle(signal: SignalFeedItem): string {
  if (signal.source_title) return signal.source_title;
  if (signal.fetched_title) return signal.fetched_title;
  const truncated = signal.raw_input.slice(0, 80);
  return truncated.length < signal.raw_input.length ? truncated + '...' : truncated;
}

function renderSignal(signal: SignalFeedItem, index: number): string {
  const parts: string[] = [];

  parts.push(`## ${index + 1}. ${signalTitle(signal)}`);
  parts.push('');

  // Meta line
  const meta = [
    `**Captured:** ${formatDate(signal.created_at)}`,
    signal.input_method,
    signal.processing_status,
  ];
  parts.push(meta.join(' \u00b7 '));

  // Enrichment meta
  const enrichMeta: string[] = [];
  if (signal.source_tier) enrichMeta.push(`**Source Tier:** ${signal.source_tier}`);
  if (signal.frontier_status) enrichMeta.push(`**Frontier:** ${signal.frontier_status}`);
  if (signal.signal_type) enrichMeta.push(`**Type:** ${signal.signal_type}`);
  if (enrichMeta.length > 0) parts.push(enrichMeta.join(' \u00b7 '));

  if (signal.confidence != null) parts.push(`**Confidence:** ${Math.round(signal.confidence * 100)}%`);

  // Raw input
  parts.push('');
  parts.push('### Raw Input');
  parts.push(`> ${signal.raw_input}`);

  // Source URL
  if (signal.source_url) {
    parts.push('');
    parts.push(`**Source:** ${signal.source_url}`);
  }

  // Capture context
  if (signal.capture_context) {
    parts.push('');
    parts.push('### Capture Context');
    parts.push(signal.capture_context);
  }

  // Key claims
  const claims = safeArray(signal.key_claims);
  if (claims.length > 0) {
    parts.push('');
    parts.push('### Key Claims');
    for (const claim of claims) {
      parts.push(`- ${claim}`);
    }
  }

  // Novelty
  if (signal.novelty_assessment) {
    parts.push('');
    parts.push('### Novelty Assessment');
    parts.push(signal.novelty_assessment);
  }

  // Tags
  const tags = safeArray(signal.domain_tags);
  if (tags.length > 0) {
    parts.push('');
    parts.push('### Tags');
    parts.push(tags.map(t => `\`${t}\``).join(' '));
  }

  // Cross-signal notes
  if (signal.cross_signal_notes) {
    parts.push('');
    parts.push('### Cross-Signal Notes');
    parts.push(signal.cross_signal_notes);
  }

  // Human notes
  if (signal.human_rating != null || signal.human_note) {
    parts.push('');
    parts.push('### Human Notes');
    if (signal.human_rating != null) parts.push(stars(signal.human_rating));
    if (signal.human_note) {
      if (signal.human_rating != null) parts.push('');
      parts.push(signal.human_note);
    }
  }

  return parts.join('\n');
}

export function signalsToMarkdown(signals: SignalFeedItem[]): string {
  const now = formatDate(new Date().toISOString());

  const parts: string[] = [];
  parts.push('# Signal Export');
  parts.push('');
  parts.push(`> ${signals.length} signal${signals.length !== 1 ? 's' : ''} \u00b7 ${now}`);

  for (let i = 0; i < signals.length; i++) {
    parts.push('');
    parts.push('---');
    parts.push('');
    parts.push(renderSignal(signals[i], i));
  }

  parts.push('');

  return parts.join('\n');
}

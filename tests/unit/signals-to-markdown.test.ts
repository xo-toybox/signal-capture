import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signalsToMarkdown } from '../../src/lib/signals-to-markdown';
import type { SignalFeedItem } from '../../src/lib/types';

function makeSignal(overrides: Partial<SignalFeedItem> = {}): SignalFeedItem {
  return {
    id: 'test-id',
    created_at: '2026-02-15T12:00:00Z',
    source_url: null,
    raw_input: 'Test raw input',
    capture_context: null,
    input_method: 'text',
    processing_status: 'complete',
    processed_at: '2026-02-15T12:01:00Z',
    fetched_title: null,
    is_starred: false,
    is_archived: false,
    is_published: false,
    published_at: null,
    project_id: null,
    project_name: null,
    source_title: null,
    key_claims: null,
    novelty_assessment: null,
    domain_tags: null,
    signal_type: null,
    source_tier: null,
    frontier_status: null,
    confidence: null,
    cross_signal_notes: null,
    human_note: null,
    human_rating: null,
    tier_override: null,
    ...overrides,
  };
}

describe('signalsToMarkdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-17T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a single enriched signal with all fields', () => {
    const signal = makeSignal({
      source_title: 'Memory Architecture for Agents',
      raw_input: 'new paper on agent memory',
      source_url: 'https://example.com/paper',
      capture_context: 'relates to backpressure pattern',
      input_method: 'voice',
      source_tier: 'practitioner',
      frontier_status: 'achievable_now',
      signal_type: 'architectural_pattern',
      confidence: 0.75,
      key_claims: ['Claim one', 'Claim two'],
      novelty_assessment: 'First documented architecture for agent memory',
      domain_tags: ['memory-architecture', 'agent-persistence'],
      cross_signal_notes: 'Connects to OpenClaw memory system',
      human_rating: 4,
      human_note: 'Very relevant',
    });

    const md = signalsToMarkdown([signal]);

    expect(md).toContain('# Signal Export');
    expect(md).toContain('> 1 signal · Feb 17, 2026');
    expect(md).toContain('## 1. Memory Architecture for Agents');
    expect(md).toContain('**Captured:** Feb 15, 2026 · voice · complete');
    expect(md).toContain('**Source Tier:** practitioner');
    expect(md).toContain('**Frontier:** achievable_now');
    expect(md).toContain('**Type:** architectural_pattern');
    expect(md).toContain('**Confidence:** 75%');
    expect(md).toContain('> new paper on agent memory');
    expect(md).toContain('**Source:** https://example.com/paper');
    expect(md).toContain('### Capture Context');
    expect(md).toContain('relates to backpressure pattern');
    expect(md).toContain('- Claim one');
    expect(md).toContain('- Claim two');
    expect(md).toContain('First documented architecture for agent memory');
    expect(md).toContain('`memory-architecture` `agent-persistence`');
    expect(md).toContain('Connects to OpenClaw memory system');
    expect(md).toContain('★★★★☆');
    expect(md).toContain('Very relevant');
  });

  it('renders an unenriched signal with minimal fields', () => {
    const signal = makeSignal({
      processing_status: 'pending',
      raw_input: 'just a quick thought about caching',
    });

    const md = signalsToMarkdown([signal]);

    expect(md).toContain('## 1. just a quick thought about caching');
    expect(md).toContain('> just a quick thought about caching');
    expect(md).not.toContain('### Key Claims');
    expect(md).not.toContain('### Novelty Assessment');
    expect(md).not.toContain('### Tags');
    expect(md).not.toContain('### Cross-Signal Notes');
    expect(md).not.toContain('### Human Notes');
    expect(md).not.toContain('**Source:**');
    expect(md).not.toContain('**Confidence:**');
  });

  it('preserves tap-selection order across multiple signals', () => {
    const s1 = makeSignal({ id: '1', source_title: 'First Signal' });
    const s2 = makeSignal({ id: '2', source_title: 'Second Signal' });
    const s3 = makeSignal({ id: '3', source_title: 'Third Signal' });

    const md = signalsToMarkdown([s1, s2, s3]);

    expect(md).toContain('> 3 signals · Feb 17, 2026');
    const i1 = md.indexOf('## 1. First Signal');
    const i2 = md.indexOf('## 2. Second Signal');
    const i3 = md.indexOf('## 3. Third Signal');
    expect(i1).toBeLessThan(i2);
    expect(i2).toBeLessThan(i3);
  });

  it('falls back to fetched_title then truncated raw_input for title', () => {
    const withFetched = makeSignal({ fetched_title: 'Fetched Title' });
    const md1 = signalsToMarkdown([withFetched]);
    expect(md1).toContain('## 1. Fetched Title');

    const longInput = 'A'.repeat(100);
    const withLong = makeSignal({ raw_input: longInput });
    const md2 = signalsToMarkdown([withLong]);
    expect(md2).toContain('## 1. ' + 'A'.repeat(80) + '...');
  });

  it('formats dates correctly', () => {
    const signal = makeSignal({ created_at: '2026-01-03T08:30:00Z' });
    const md = signalsToMarkdown([signal]);
    expect(md).toContain('Jan 3, 2026');
  });

  it('renders human rating as stars', () => {
    const signal = makeSignal({ human_rating: 3 });
    const md = signalsToMarkdown([signal]);
    expect(md).toContain('★★★☆☆');
  });

  it('renders human note without rating', () => {
    const signal = makeSignal({ human_note: 'Important finding' });
    const md = signalsToMarkdown([signal]);
    expect(md).toContain('### Human Notes');
    expect(md).toContain('Important finding');
    expect(md).not.toContain('★');
  });

  it('omits enrichment meta line when all null', () => {
    const signal = makeSignal({
      source_tier: null,
      frontier_status: null,
      signal_type: null,
    });
    const md = signalsToMarkdown([signal]);
    expect(md).not.toContain('**Source Tier:**');
    expect(md).not.toContain('**Frontier:**');
    expect(md).not.toContain('**Type:**');
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceInsert } from '@/lib/use-voice-insert';
import type { RefObject } from 'react';

function makeTextarea(
  value: string,
  selectionStart: number,
  selectionEnd?: number,
): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  el.value = value;
  // jsdom doesn't auto-set selection from value, so set explicitly
  el.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
  return el;
}

function setup(
  el: HTMLTextAreaElement | null,
  initialValue: string,
  afterUpdate?: (el: HTMLTextAreaElement) => void,
) {
  let value = initialValue;
  const ref = { current: el } as RefObject<HTMLTextAreaElement | null>;
  const getValue = () => value;
  const setValue = (v: string) => {
    value = v;
  };

  const { result } = renderHook(() =>
    useVoiceInsert(ref, getValue, setValue, afterUpdate),
  );

  return { result, getLatestValue: () => value };
}

// ── onStart: snapshot capture ──────────────────────────────────

describe('onStart – snapshot capture', () => {
  it('cursor at end → before = full text, after = ""', () => {
    const el = makeTextarea('hello', 5);
    const { result, getLatestValue } = setup(el, 'hello');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript(' world'));

    expect(getLatestValue()).toBe('hello world');
  });

  it('cursor at start → before = "", after = full text', () => {
    const el = makeTextarea('hello', 0);
    const { result, getLatestValue } = setup(el, 'hello');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript('hey '));

    expect(getLatestValue()).toBe('hey hello');
  });

  it('cursor in middle → splits at position', () => {
    const el = makeTextarea('helloworld', 5);
    const { result, getLatestValue } = setup(el, 'helloworld');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript(' beautiful '));

    expect(getLatestValue()).toBe('hello beautiful world');
  });

  it('selection range → before = pre-selection, after = post-selection', () => {
    // "hello world" with "lo wo" selected (positions 3..8)
    const el = makeTextarea('hello world', 3, 8);
    const { result, getLatestValue } = setup(el, 'hello world');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript('p'));

    expect(getLatestValue()).toBe('helprld');
  });

  it('null ref → falls back to end of value', () => {
    const { result, getLatestValue } = setup(null, 'hello');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript(' world'));

    expect(getLatestValue()).toBe('hello world');
  });
});

// ── onTranscript: insertion ────────────────────────────────────

describe('onTranscript – insertion', () => {
  it('inserts at cursor position', () => {
    const el = makeTextarea('ab', 1);
    const { result, getLatestValue } = setup(el, 'ab');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript('X'));

    expect(getLatestValue()).toBe('aXb');
  });

  it('cumulative transcripts rebuild from same snapshot', () => {
    const el = makeTextarea('start end', 6); // cursor after "start "
    const { result, getLatestValue } = setup(el, 'start end');

    act(() => result.current.onStart());

    // SpeechRecognition sends growing cumulative text
    act(() => result.current.onTranscript('one'));
    expect(getLatestValue()).toBe('start oneend');

    act(() => result.current.onTranscript('one two'));
    expect(getLatestValue()).toBe('start one twoend');

    act(() => result.current.onTranscript('one two three'));
    expect(getLatestValue()).toBe('start one two threeend');
  });

  it('empty input + transcript → just the transcript', () => {
    const el = makeTextarea('', 0);
    const { result, getLatestValue } = setup(el, '');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript('hello'));

    expect(getLatestValue()).toBe('hello');
  });

  it('existing text + transcript at end → appends', () => {
    const el = makeTextarea('existing', 8);
    const { result, getLatestValue } = setup(el, 'existing');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript(' more'));

    expect(getLatestValue()).toBe('existing more');
  });
});

// ── Cursor repositioning ───────────────────────────────────────

describe('cursor repositioning', () => {
  it('setSelectionRange called with correct position after insert', async () => {
    const el = makeTextarea('ab', 1);
    vi.spyOn(el, 'setSelectionRange');
    const { result } = setup(el, 'ab');

    act(() => result.current.onStart());
    act(() => result.current.onTranscript('XY'));

    // flush setTimeout
    await vi.waitFor(() => {
      expect(el.setSelectionRange).toHaveBeenCalledWith(3, 3); // "a".length + "XY".length
    });
  });
});

// ── afterUpdate callback ───────────────────────────────────────

describe('afterUpdate callback', () => {
  it('called with textarea element after insert', async () => {
    const el = makeTextarea('test', 4);
    const afterUpdate = vi.fn();
    const { result } = setup(el, 'test', afterUpdate);

    act(() => result.current.onStart());
    act(() => result.current.onTranscript(' done'));

    await vi.waitFor(() => {
      expect(afterUpdate).toHaveBeenCalledWith(el);
    });
  });

  it('not called when textarea ref is null', async () => {
    const afterUpdate = vi.fn();
    const { result } = setup(null, 'test', afterUpdate);

    act(() => result.current.onStart());
    act(() => result.current.onTranscript(' done'));

    // Give setTimeout a chance to fire (it shouldn't)
    await new Promise((r) => setTimeout(r, 50));
    expect(afterUpdate).not.toHaveBeenCalled();
  });
});

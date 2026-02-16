import { useRef, type RefObject } from 'react';

/**
 * Hook for inserting voice transcripts at cursor position.
 *
 * VoiceInput fires onTranscript with cumulative text (interim results),
 * so we snapshot the surrounding text when recording starts and rebuild
 * on each transcript: `before + transcript + after`.
 */
export function useVoiceInsert(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  getValue: () => string,
  setValue: (v: string) => void,
  afterUpdate?: (el: HTMLTextAreaElement) => void,
) {
  const snapshot = useRef({ before: '', after: '' });

  const onStart = () => {
    const el = textareaRef.current;
    const currentValue = getValue();
    const pos = el?.selectionStart ?? currentValue.length;
    snapshot.current = {
      before: currentValue.substring(0, pos),
      after: currentValue.substring(el?.selectionEnd ?? pos),
    };
  };

  const onTranscript = (text: string) => {
    const { before, after } = snapshot.current;
    setValue(before + text + after);
    const el = textareaRef.current;
    if (el) {
      setTimeout(() => {
        const newPos = before.length + text.length;
        el.setSelectionRange(newPos, newPos);
        afterUpdate?.(el);
      }, 0);
    }
  };

  return { onStart, onTranscript };
}

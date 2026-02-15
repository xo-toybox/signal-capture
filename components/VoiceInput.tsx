'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className = '' }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const toggle = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, onTranscript]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 ${
        isRecording
          ? 'text-red-500 recording-pulse'
          : 'text-[#737373] hover:text-[#e5e5e5]'
      } ${className}`}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 1C6.895 1 6 1.895 6 3v5c0 1.105.895 2 2 2s2-.895 2-2V3c0-1.105-.895-2-2-2z"
          fill="currentColor"
        />
        <path
          d="M4 7a1 1 0 0 0-2 0 6 6 0 0 0 5 5.917V14H5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H9v-1.083A6 6 0 0 0 14 7a1 1 0 1 0-2 0 4 4 0 0 1-8 0z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}

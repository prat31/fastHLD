import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'listening';

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  silenceMs?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'A']);

export function useVoiceInput({ onTranscript, silenceMs = 1500 }: UseVoiceInputOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [supported] = useState(() => !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  const recognitionRef  = useRef<AnyRecognition>(null);
  const isRecordingRef  = useRef(false); // sync guard against double-start
  const isHeldRef       = useRef(false); // true while space/button is physically held
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef   = useRef('');

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearSilenceTimer();
    isHeldRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const start = useCallback((held = false) => {
    if (isRecordingRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    isRecordingRef.current = true;
    isHeldRef.current = held;
    transcriptRef.current = '';

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setVoiceState('listening');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) {
        transcriptRef.current += final;
        // Only arm the silence timer when NOT in push-to-talk held mode.
        // While holding space or the button, the user releases to stop —
        // the silence timer would cut them off mid-sentence.
        if (!isHeldRef.current) {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => stop(), silenceMs);
        }
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();
      isRecordingRef.current = false;
      isHeldRef.current = false;
      const text = transcriptRef.current.trim();
      setVoiceState('idle');
      if (text) onTranscript(text);
    };

    recognition.onerror = () => {
      clearSilenceTimer();
      isRecordingRef.current = false;
      isHeldRef.current = false;
      setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [silenceMs, stop, onTranscript]);

  // Spacebar push-to-talk:
  //   keydown (first press only) → start in held mode
  //   keyup                      → stop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // ignore held-key repeats — we only care about the first press
      const tag = (e.target as Element)?.tagName ?? '';
      if (e.code === 'Space' && !INTERACTIVE_TAGS.has(tag)) {
        e.preventDefault();
        if (!isRecordingRef.current) {
          start(true); // held = true → no silence timer
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecordingRef.current) {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [start, stop]);

  useEffect(() => () => { clearSilenceTimer(); recognitionRef.current?.stop(); }, []);

  return { voiceState, supported, start, stop };
}

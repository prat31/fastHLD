import { useCallback, useEffect, useRef, useState } from 'react';
import { postTranscribe } from '../services/api';

export type VoiceState = 'idle' | 'listening';
export type VoiceMode = 'browser' | 'whisper';

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  silenceMs?: number;
  whisperAvailable?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'A']);

export function useVoiceInput({
  onTranscript,
  silenceMs = 1500,
  whisperAvailable = false,
}: UseVoiceInputOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browserSupported = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  const mediaDevicesSupported = !!(navigator.mediaDevices?.getUserMedia);

  // Prefer Whisper when available and the browser supports MediaRecorder
  const mode: VoiceMode = (whisperAvailable && mediaDevicesSupported) ? 'whisper' : 'browser';
  const supported = mode === 'whisper' ? mediaDevicesSupported : browserSupported;

  // Shared refs
  const isRecordingRef = useRef(false);
  const isHeldRef = useRef(false);

  // Browser STT refs
  const recognitionRef = useRef<AnyRecognition>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef('');

  // Whisper refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // ---- Browser STT ----

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopBrowser = useCallback(() => {
    clearSilenceTimer();
    isHeldRef.current = false;
    recognitionRef.current?.stop();
  }, []);

  const startBrowser = useCallback((held = false) => {
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
        if (!isHeldRef.current) {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => stopBrowser(), silenceMs);
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
  }, [silenceMs, stopBrowser, onTranscript]);

  // ---- Whisper (MediaRecorder) ----

  const stopWhisper = useCallback(() => {
    isHeldRef.current = false;
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startWhisper = useCallback(async (held = false) => {
    if (isRecordingRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isRecordingRef.current = true;
      isHeldRef.current = held;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        isRecordingRef.current = false;
        isHeldRef.current = false;
        setVoiceState('idle');
        try {
          const { transcript } = await postTranscribe(blob);
          if (transcript.trim()) onTranscript(transcript.trim());
        } catch (err) {
          console.error('Whisper transcription error:', err);
        }
      };

      mediaRecorder.start();
      setVoiceState('listening');
    } catch (err) {
      console.error('Microphone access error:', err);
      isRecordingRef.current = false;
      isHeldRef.current = false;
    }
  }, [onTranscript]);

  // ---- Unified interface ----

  const start = useCallback((held = false) => {
    if (mode === 'whisper') {
      startWhisper(held);
    } else {
      startBrowser(held);
    }
  }, [mode, startWhisper, startBrowser]);

  const stop = useCallback(() => {
    if (mode === 'whisper') {
      stopWhisper();
    } else {
      stopBrowser();
    }
  }, [mode, stopWhisper, stopBrowser]);

  // ---- Spacebar push-to-talk ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as Element)?.tagName ?? '';
      if (e.code === 'Space' && !INTERACTIVE_TAGS.has(tag)) {
        e.preventDefault();
        if (!isRecordingRef.current) start(true);
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

  useEffect(() => () => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { voiceState, supported, mode, start, stop };
}

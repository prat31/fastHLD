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

  const mode: VoiceMode = (whisperAvailable && mediaDevicesSupported) ? 'whisper' : 'browser';
  const supported = mode === 'whisper' ? mediaDevicesSupported : browserSupported;

  // Keep onTranscript in a ref so callbacks don't need it as a dep and stay stable.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // Shared refs
  const isRecordingRef = useRef(false);
  const isHeldRef = useRef(false);       // true while space/button is physically held

  // Browser STT refs
  const recognitionRef = useRef<AnyRecognition>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef('');

  // Whisper refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // ---- Browser STT ----

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopBrowser = useCallback(() => {
    clearSilenceTimer();
    // Set isHeldRef BEFORE calling .stop() so onend knows this was our intentional stop.
    isHeldRef.current = false;
    recognitionRef.current?.stop();
  }, [clearSilenceTimer]);

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
        // Only arm silence timer when NOT in push-to-talk held mode.
        if (!isHeldRef.current) {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => stopBrowser(), silenceMs);
        }
      }
    };

    recognition.onend = () => {
      // Chrome terminates continuous recognition on its own (on silence, on result, etc.).
      // If the user is still physically holding space/button, restart immediately.
      if (isHeldRef.current) {
        try {
          recognition.start();
        } catch {
          // start() can throw if called too quickly after stop; ignore and let PTT end naturally
          isRecordingRef.current = false;
          setVoiceState('idle');
        }
        return;
      }
      clearSilenceTimer();
      isRecordingRef.current = false;
      const text = transcriptRef.current.trim();
      setVoiceState('idle');
      if (text) onTranscriptRef.current(text);
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' is common mid-session; don't abort if still held
      if (isHeldRef.current && event?.error === 'no-speech') return;
      clearSilenceTimer();
      isRecordingRef.current = false;
      isHeldRef.current = false;
      setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [silenceMs, stopBrowser, clearSilenceTimer]);  // onTranscript intentionally excluded (via ref)

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
          if (transcript.trim()) onTranscriptRef.current(transcript.trim());
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
  }, []); // onTranscript intentionally excluded (via ref)

  // ---- Unified interface ----
  // mode is a string computed at render time; keep it in a ref so the effect below
  // doesn't have to re-register listeners whenever mode hasn't actually changed.
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const start = useCallback((held = false) => {
    if (modeRef.current === 'whisper') startWhisper(held);
    else startBrowser(held);
  }, [startWhisper, startBrowser]);

  const stop = useCallback(() => {
    if (modeRef.current === 'whisper') stopWhisper();
    else stopBrowser();
  }, [stopWhisper, stopBrowser]);

  // ---- Spacebar push-to-talk ----
  // start/stop are now stable (no onTranscript dep) so this effect mounts once.
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

  // Cleanup on unmount
  useEffect(() => () => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [clearSilenceTimer]);

  return { voiceState, supported, mode, start, stop };
}

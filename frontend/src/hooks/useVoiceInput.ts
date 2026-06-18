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

function humanVoiceError(err: string): string {
  switch (err) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission denied. Allow mic access for this site and try again.';
    case 'audio-capture':
      return 'No microphone was found. Plug one in and try again.';
    case 'network':
      return 'Speech recognition network error. Browser STT needs an internet connection.';
    default:
      return `Voice error: ${err}`;
  }
}

export function useVoiceInput({
  onTranscript,
  silenceMs = 1500,
  whisperAvailable = false,
}: UseVoiceInputOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browserSupported = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  const mediaDevicesSupported = !!(navigator.mediaDevices?.getUserMedia);

  const mode: VoiceMode = (whisperAvailable && mediaDevicesSupported) ? 'whisper' : 'browser';
  const supported = mode === 'whisper' ? mediaDevicesSupported : browserSupported;

  // Keep onTranscript in a ref so callbacks don't need it as a dep and stay stable.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // Shared refs
  const isRecordingRef = useRef(false);  // true for the whole hold session (survives restarts)
  const isHeldRef = useRef(false);       // true while space/button is physically held
  const runningRef = useRef(false);      // true while a recognition instance is actively listening

  // Browser STT refs
  const recognitionRef = useRef<AnyRecognition>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  // End the whole session and submit whatever we accumulated. Idempotent.
  const finalizeBrowser = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    runningRef.current = false;
    clearRestartTimer();
    clearSilenceTimer();
    setVoiceState('idle');
    const text = transcriptRef.current.trim();
    transcriptRef.current = '';
    if (text) onTranscriptRef.current(text);
  }, [clearRestartTimer, clearSilenceTimer]);

  const stopBrowser = useCallback(() => {
    isHeldRef.current = false;
    clearRestartTimer();
    clearSilenceTimer();
    const rec = recognitionRef.current;
    if (rec && runningRef.current) {
      // Still listening: stop() lets it process the final audio, then onend
      // (now not-held) finalizes and submits the full transcript.
      try { rec.stop(); } catch { finalizeBrowser(); }
    } else {
      // Released during the brief restart gap (no live instance): finalize now.
      finalizeBrowser();
    }
  }, [clearRestartTimer, clearSilenceTimer, finalizeBrowser]);

  // Create and start a FRESH recognition instance. Chrome auto-ends continuous
  // recognition on its own; reusing the dead instance throws InvalidStateError,
  // so each (re)start must build a new one.
  const launchRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { finalizeBrowser(); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      runningRef.current = true;
      setVoiceState('listening');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) {
        transcriptRef.current += final;
        // Auto-send on silence only when NOT in push-to-talk held mode.
        if (!isHeldRef.current) {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => stopBrowser(), silenceMs);
        }
      }
    };

    recognition.onend = () => {
      runningRef.current = false;
      if (isHeldRef.current) {
        // Still held → relaunch a fresh instance after a tick (dodges the
        // "already started" throw) so recording continues for the whole hold.
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          if (isHeldRef.current) launchRecognition();
        }, 120);
        return;
      }
      finalizeBrowser();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const err = event?.error;
      // Benign mid-session errors while held: let onend relaunch.
      if (isHeldRef.current && (err === 'no-speech' || err === 'aborted')) return;
      if (err && err !== 'aborted' && err !== 'no-speech') setError(humanVoiceError(err));
      isHeldRef.current = false;
      finalizeBrowser();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Instance still settling — retry shortly while held, else give up.
      if (isHeldRef.current) {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          if (isHeldRef.current) launchRecognition();
        }, 120);
      } else {
        finalizeBrowser();
      }
    }
  }, [silenceMs, finalizeBrowser, clearSilenceTimer, clearRestartTimer, stopBrowser]);

  const startBrowser = useCallback((held = false) => {
    if (isRecordingRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!(w.SpeechRecognition ?? w.webkitSpeechRecognition)) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setError(null);
    isRecordingRef.current = true;
    isHeldRef.current = held;
    transcriptRef.current = '';
    launchRecognition();
  }, [launchRecognition]);

  // ---- Whisper (MediaRecorder) ----

  const stopWhisper = useCallback(() => {
    isHeldRef.current = false;
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startWhisper = useCallback(async (held = false) => {
    if (isRecordingRef.current) return;
    setError(null);
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
          setError(err instanceof Error ? err.message : 'Whisper transcription failed');
        }
      };

      mediaRecorder.start();
      setVoiceState('listening');
    } catch {
      isRecordingRef.current = false;
      isHeldRef.current = false;
      setVoiceState('idle');
      setError('Microphone permission denied or unavailable.');
    }
  }, []); // onTranscript intentionally excluded (via ref)

  // ---- Unified interface ----
  // mode is computed at render time; keep it in a ref so the effect below
  // doesn't re-register listeners whenever mode hasn't actually changed.
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
  // start/stop are stable (no onTranscript dep) so this effect mounts once.
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
    clearRestartTimer();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [clearSilenceTimer, clearRestartTimer]);

  return { voiceState, supported, mode, error, start, stop };
}

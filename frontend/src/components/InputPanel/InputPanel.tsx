import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2 } from 'lucide-react';
import TextInput from './TextInput';
import VoiceInput from './VoiceInput';
import { useDiagramMutation } from '../../hooks/useDiagramMutation';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useImageImport } from '../../hooks/useImageImport';
import { getConfig } from '../../services/api';
import type { PromptSource } from '../../store/historyStore';

export default function InputPanel() {
  const { loading, error, send } = useDiagramMutation();
  const { loading: imgLoading, error: imgError, importImage } = useImageImport();
  const [whisperAvailable, setWhisperAvailable] = useState(false);
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getConfig().then(({ whisper_available }) => setWhisperAvailable(whisper_available));
  }, []);

  const submit = useCallback(
    (value: string, source: PromptSource) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setText('');
      send(trimmed, source);
    },
    [send],
  );

  // Speech-to-text: drop the transcript into the box so the user sees it, then
  // auto-submit after a short beat.
  const onTranscript = useCallback(
    (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) return;
      setText(trimmed);
      window.setTimeout(() => submit(trimmed, 'voice'), 350);
    },
    [submit],
  );

  const { voiceState, supported, mode, error: voiceError, start, stop } = useVoiceInput({
    onTranscript,
    whisperAvailable,
  });

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importImage(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      {(error || imgError || voiceError) && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error || imgError || voiceError}</span>
        </div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextInput
            value={text}
            onChange={setText}
            onSubmit={() => submit(text, 'text')}
            loading={loading}
          />
        </div>

        {/* Upload an HLD image for the LLM to parse into nodes/edges */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onPickImage}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={imgLoading}
          title="Upload an HLD diagram image to import"
          aria-label="Upload diagram image"
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-colors',
            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
            'hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {imgLoading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        </button>

        <VoiceInput
          voiceState={voiceState}
          supported={supported}
          mode={mode}
          onStart={() => start(true)}
          onStop={stop}
        />
      </div>
    </div>
  );
}

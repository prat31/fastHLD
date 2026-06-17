import TextInput from './TextInput';
import VoiceInput from './VoiceInput';
import { useDiagramMutation } from '../../hooks/useDiagramMutation';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { AlertCircle } from 'lucide-react';

export default function InputPanel() {
  const { loading, error, send } = useDiagramMutation();

  const { voiceState, supported, start, stop } = useVoiceInput({
    onTranscript: (text) => send(text),
  });

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextInput onSend={send} loading={loading} />
        </div>
        <VoiceInput
          voiceState={voiceState}
          supported={supported}
          onStart={() => start(true)}
          onStop={stop}
        />
      </div>
    </div>
  );
}

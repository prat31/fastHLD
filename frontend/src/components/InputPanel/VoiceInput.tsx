import { Mic, MicOff } from 'lucide-react';
import type { VoiceMode, VoiceState } from '../../hooks/useVoiceInput';

interface VoiceInputProps {
  voiceState: VoiceState;
  supported: boolean;
  mode: VoiceMode;
  onStart: () => void;
  onStop: () => void;
}

export default function VoiceInput({ voiceState, supported, mode, onStart, onStop }: VoiceInputProps) {
  if (!supported) {
    return (
      <div
        className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500"
        title="Speech recognition not supported in this browser"
      >
        <MicOff size={14} />
        <span>Voice N/A</span>
      </div>
    );
  }

  const isListening = voiceState === 'listening';

  return (
    <div className="flex items-center gap-2">
      <button
        onMouseDown={onStart}
        onMouseUp={onStop}
        onTouchStart={onStart}
        onTouchEnd={onStop}
        tabIndex={-1}
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors shadow-sm select-none',
          isListening
            ? 'bg-red-500 text-white ring-2 ring-red-300 dark:ring-red-700'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600',
        ].join(' ')}
        aria-label={isListening ? 'Stop recording' : 'Hold to speak (or hold Space)'}
        title={isListening ? 'Release to send' : 'Hold to speak (or hold Space)'}
        aria-pressed={isListening}
      >
        <Mic size={18} />
      </button>
      <div className="flex flex-col gap-0.5">
        {isListening ? (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium select-none">
            Listening…
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 select-none">
            Hold{' '}
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px]">
              Space
            </kbd>{' '}
            or button
          </span>
        )}
        <span className={[
          'text-[10px] font-medium select-none',
          mode === 'whisper'
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-slate-400 dark:text-slate-500',
        ].join(' ')}>
          {mode === 'whisper' ? '✦ Whisper' : '⬡ Browser'}
        </span>
      </div>
    </div>
  );
}

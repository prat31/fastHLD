import { useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TextInputProps {
  onSend: (text: string) => void;
  loading: boolean;
  placeholder?: string;
}

export default function TextInput({ onSend, loading, placeholder }: TextInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setValue('');
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        placeholder={placeholder ?? 'Describe your architecture… (Enter to send, Shift+Enter for newline)'}
        disabled={loading}
        className={[
          'flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100',
          'border-slate-200 dark:border-slate-600',
          'bg-white dark:bg-slate-900',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
          'disabled:opacity-50 shadow-sm',
        ].join(' ')}
      />
      <button
        onClick={submit}
        disabled={loading || !value.trim()}
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm',
          'bg-blue-600 text-white transition-colors',
          'hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        aria-label="Send"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </div>
  );
}

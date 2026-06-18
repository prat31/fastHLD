import { useState } from 'react';
import { History, X, RotateCcw, Mic, Type, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useHistoryStore, type PromptSource } from '../../store/historyStore';

const SOURCE_ICON: Record<PromptSource, typeof Mic> = {
  text: Type,
  voice: Mic,
  image: ImageIcon,
};

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function HistoryPanel() {
  const [open, setOpen] = useState(false);
  const { entries, revertTo, clear } = useHistoryStore();

  // Newest first.
  const ordered = [...entries].reverse();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Show prompt history"
        className="fixed right-4 top-20 z-30 flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-lg px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <History size={16} />
        {entries.length > 0 && (
          <span className="text-xs font-semibold">{entries.length}</span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-20 bottom-28 z-30 w-72 flex flex-col rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
          <History size={15} />
          <span className="text-sm font-semibold">History</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">({entries.length})</span>
        </div>
        <div className="flex items-center gap-0.5">
          {entries.length > 0 && (
            <button
              onClick={clear}
              title="Clear history"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            title="Collapse"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
        {ordered.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-3 py-6">
            No prompts yet. Type, speak, or upload a diagram and your prompts will appear here.
          </p>
        ) : (
          ordered.map((entry) => {
            const Icon = SOURCE_ICON[entry.source];
            return (
              <div
                key={entry.id}
                className="group flex items-start gap-2 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 px-2.5 py-2 transition-colors"
              >
                <Icon size={13} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 dark:text-slate-200 break-words leading-snug">
                    {entry.text}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {relativeTime(entry.ts)}
                  </p>
                </div>
                <button
                  onClick={() => revertTo(entry.id)}
                  title="Undo this prompt (and any after it)"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

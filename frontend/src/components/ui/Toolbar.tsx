import { Undo2, Redo2, Trash2, Download, Sun, Moon, Monitor } from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { useTheme, type ThemePreference } from '../../hooks/useTheme';
import type { ReactNode } from 'react';

export default function Toolbar() {
  const { undo, redo, past, future, applyOps, nodes, edges } = useDiagramStore();
  const { preference, setTheme } = useTheme();

  const clearAll = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (window.confirm('Clear all nodes and edges?')) {
      applyOps([{ op: 'clear' }]);
    }
  };

  const exportJson = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mr-3">⚡ fastHLD</span>

      {/* Left: diagram actions */}
      <div className="flex items-center gap-1">
        <IconBtn onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </IconBtn>
        <IconBtn onClick={redo} disabled={future.length === 0} title="Redo">
          <Redo2 size={16} />
        </IconBtn>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
        <IconBtn onClick={clearAll} title="Clear diagram" className="hover:!text-red-500">
          <Trash2 size={16} />
        </IconBtn>
        <IconBtn onClick={exportJson} title="Export JSON">
          <Download size={16} />
        </IconBtn>
      </div>

      {/* Centre: node/edge count */}
      <div className="flex-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
        {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} edge{edges.length !== 1 ? 's' : ''}
      </div>

      {/* Right: theme toggle */}
      <ThemeToggle preference={preference} onChange={setTheme} />
    </div>
  );
}

// ---- Theme toggle ----

const THEME_OPTIONS: { value: ThemePreference; icon: ReactNode; label: string }[] = [
  { value: 'light',  icon: <Sun size={14} />,     label: 'Light' },
  { value: 'system', icon: <Monitor size={14} />, label: 'System' },
  { value: 'dark',   icon: <Moon size={14} />,    label: 'Dark' },
];

function ThemeToggle({
  preference,
  onChange,
}: {
  preference: ThemePreference;
  onChange: (p: ThemePreference) => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-0.5 gap-0.5"
      role="group"
      aria-label="Color theme"
    >
      {THEME_OPTIONS.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={label}
          aria-label={label}
          aria-pressed={preference === value}
          className={[
            'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
            preference === value
              ? 'bg-white dark:bg-slate-500 text-slate-800 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          ].join(' ')}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Generic icon button ----

function IconBtn({
  children,
  onClick,
  disabled,
  title,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-lg',
        'text-slate-600 dark:text-slate-400',
        'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

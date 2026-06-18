import { useEffect, useRef, useState } from 'react';
import { Copy, Link2Off, Pencil, Trash2 } from 'lucide-react';
import type { Node } from '@xyflow/react';

interface Props {
  nodeId: string;
  x: number;
  y: number;
  nodes: Node[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDisconnect: (id: string) => void;
  onRename: (id: string, newLabel: string) => void;
}

export default function NodeContextMenu({
  nodeId, x, y, nodes, onClose, onDelete, onDuplicate, onDisconnect, onRename,
}: Props) {
  const node = nodes.find((n) => n.id === nodeId);
  const currentLabel = (node?.data as Record<string, unknown>)?.label as string ?? '';

  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(currentLabel);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clamp to viewport so menu never clips off-screen
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 220);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Element)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const submitRename = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== currentLabel) onRename(nodeId, trimmed);
    else onClose();
  };

  const itemCls =
    'flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left rounded-md ' +
    'hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 ' +
    'transition-colors cursor-pointer';

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: adjustedX, top: adjustedY, zIndex: 1000 }}
      className="min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-xl py-1.5 px-1"
      onContextMenu={(e) => e.preventDefault()}
    >
      {renaming ? (
        <div className="px-2 py-1">
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') onClose();
              e.stopPropagation();
            }}
            className={[
              'w-full text-sm px-2 py-1 rounded-lg border',
              'bg-white dark:bg-slate-800',
              'border-blue-400 dark:border-blue-500',
              'text-slate-800 dark:text-slate-100',
              'focus:outline-none focus:ring-2 focus:ring-blue-400',
            ].join(' ')}
          />
          <div className="flex gap-1 mt-1.5">
            <button
              onClick={submitRename}
              className="flex-1 text-xs py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors"
            >
              Rename
            </button>
            <button
              onClick={onClose}
              className="flex-1 text-xs py-1 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <button className={itemCls} onClick={() => setRenaming(true)}>
            <Pencil size={14} className="text-slate-400 shrink-0" />
            Rename
          </button>
          <button className={itemCls} onClick={() => onDuplicate(nodeId)}>
            <Copy size={14} className="text-slate-400 shrink-0" />
            Duplicate
          </button>
          <button className={itemCls} onClick={() => onDisconnect(nodeId)}>
            <Link2Off size={14} className="text-slate-400 shrink-0" />
            Disconnect all
          </button>
          <div className="my-1 mx-2 h-px bg-slate-100 dark:bg-slate-600" />
          <button
            className={
              'flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left rounded-md ' +
              'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 ' +
              'transition-colors cursor-pointer'
            }
            onClick={() => onDelete(nodeId)}
          >
            <Trash2 size={14} className="shrink-0" />
            Delete
          </button>
        </>
      )}
    </div>
  );
}

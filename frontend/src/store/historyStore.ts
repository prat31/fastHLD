import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import { useDiagramStore } from './diagramStore';

export type PromptSource = 'text' | 'voice' | 'image';

export interface PromptEntry {
  id: string;
  text: string;
  source: PromptSource;
  ts: number;
  /** Canvas snapshot captured *before* this prompt was applied. */
  before: { nodes: Node[]; edges: Edge[] };
}

interface HistoryStore {
  entries: PromptEntry[];
  add: (entry: Omit<PromptEntry, 'id' | 'ts'>) => void;
  /** Restore the canvas to just before `id`, dropping that prompt and all newer ones. */
  revertTo: (id: string) => void;
  clear: () => void;
}

let _seq = 0;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],

  add: (entry) =>
    set((s) => ({
      entries: [...s.entries, { ...entry, id: `p-${Date.now()}-${_seq++}`, ts: Date.now() }],
    })),

  revertTo: (id) => {
    const { entries } = get();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return;
    useDiagramStore.getState().restore(entries[idx].before);
    // Drop this prompt and everything that came after it.
    set({ entries: entries.slice(0, idx) });
  },

  clear: () => set({ entries: [] }),
}));

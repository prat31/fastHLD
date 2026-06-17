import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramOp, DiagramState } from '../types/diagram';

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramStore {
  nodes: Node[];
  edges: Edge[];
  past: HistoryEntry[];
  future: HistoryEntry[];

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  applyOps: (ops: DiagramOp[]) => void;
  undo: () => void;
  redo: () => void;
  snapshot: () => DiagramState;
}

function pushHistory(past: HistoryEntry[], nodes: Node[], edges: Edge[]): HistoryEntry[] {
  return [...past.slice(-49), { nodes, edges }];
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  applyOps: (ops) => {
    const { nodes, edges, past } = get();
    const newPast = pushHistory(past, nodes, edges);
    let nextNodes = [...nodes];
    let nextEdges = [...edges];

    for (const op of ops) {
      if (op.op === 'clear') {
        nextNodes = [];
        nextEdges = [];
      } else if (op.op === 'add_node') {
        const exists = nextNodes.some((n) => n.id === op.id);
        if (!exists) {
          nextNodes = [
            ...nextNodes,
            {
              id: op.id,
              type: 'serviceNode',
              position: { x: op.x, y: op.y },
              data: { label: op.label, serviceType: op.type, ...op.data },
            },
          ];
        }
      } else if (op.op === 'update_node') {
        nextNodes = nextNodes.map((n) => {
          if (n.id !== op.id) return n;
          return {
            ...n,
            position: {
              x: op.x ?? n.position.x,
              y: op.y ?? n.position.y,
            },
            data: {
              ...n.data,
              ...(op.label !== undefined ? { label: op.label } : {}),
              ...(op.data ?? {}),
            },
          };
        });
      } else if (op.op === 'remove_node') {
        nextNodes = nextNodes.filter((n) => n.id !== op.id);
        nextEdges = nextEdges.filter((e) => e.source !== op.id && e.target !== op.id);
      } else if (op.op === 'add_edge') {
        const exists = nextEdges.some((e) => e.id === op.id);
        if (!exists) {
          nextEdges = [
            ...nextEdges,
            {
              id: op.id,
              source: op.source,
              target: op.target,
              label: op.label ?? '',
              animated: op.animated ?? false,
              type: 'smoothstep',
            },
          ];
        }
      } else if (op.op === 'remove_edge') {
        nextEdges = nextEdges.filter((e) => e.id !== op.id);
      }
    }

    set({ nodes: nextNodes, edges: nextEdges, past: newPast, future: [] });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
    });
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      past: pushHistory(past, nodes, edges),
      future: future.slice(1),
    });
  },

  snapshot: () => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as Record<string, unknown>).serviceType as string ?? n.type ?? 'generic_server',
        label: (n.data as Record<string, unknown>).label as string ?? n.id,
        position: n.position,
        data: n.data as Record<string, unknown>,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : '',
        animated: e.animated ?? false,
      })),
    };
  },
}));

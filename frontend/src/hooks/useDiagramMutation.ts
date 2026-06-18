import { useState } from 'react';
import { postInstruct } from '../services/api';
import { useDiagramStore } from '../store/diagramStore';
import { useHistoryStore, type PromptSource } from '../store/historyStore';

export interface MutationState {
  loading: boolean;
  error: string | null;
}

export function useDiagramMutation() {
  const [state, setState] = useState<MutationState>({ loading: false, error: null });
  const { snapshot, applyOps, capture } = useDiagramStore();
  const addHistory = useHistoryStore((s) => s.add);

  async function send(instruction: string, source: PromptSource = 'text') {
    if (!instruction.trim()) return;
    setState({ loading: true, error: null });
    // Capture the canvas *before* applying ops so this prompt can be reverted.
    const before = capture();
    try {
      const diagram_state = snapshot();
      const response = await postInstruct({ instruction, diagram_state });
      applyOps(response.ops);
      addHistory({ text: instruction.trim(), source, before });
      setState({ loading: false, error: null });
    } catch (err) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { ...state, send };
}

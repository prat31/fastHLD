import { useState } from 'react';
import { postInstruct } from '../services/api';
import { useDiagramStore } from '../store/diagramStore';

export interface MutationState {
  loading: boolean;
  error: string | null;
}

export function useDiagramMutation() {
  const [state, setState] = useState<MutationState>({ loading: false, error: null });
  const { snapshot, applyOps } = useDiagramStore();

  async function send(instruction: string) {
    if (!instruction.trim()) return;
    setState({ loading: true, error: null });
    try {
      const diagram_state = snapshot();
      const response = await postInstruct({ instruction, diagram_state });
      applyOps(response.ops);
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

import { useState } from 'react';
import { postParseImage } from '../services/api';
import { useDiagramStore } from '../store/diagramStore';
import { useHistoryStore } from '../store/historyStore';

export interface ImageImportState {
  loading: boolean;
  error: string | null;
}

export function useImageImport() {
  const [state, setState] = useState<ImageImportState>({ loading: false, error: null });
  const { applyOps, capture } = useDiagramStore();
  const addHistory = useHistoryStore((s) => s.add);

  async function importImage(file: File) {
    setState({ loading: true, error: null });
    const before = capture();
    try {
      const { ops } = await postParseImage(file);
      applyOps(ops);
      addHistory({ text: `Imported "${file.name}"`, source: 'image', before });
      setState({ loading: false, error: null });
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Image import failed';
      // The backend returns 503 when no vision-capable model is configured.
      const friendly = raw.includes('503')
        ? 'Image import needs a vision model. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in the backend, then restart it.'
        : raw;
      setState({ loading: false, error: friendly });
    }
  }

  return { ...state, importImage };
}

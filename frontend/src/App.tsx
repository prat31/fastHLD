import { useEffect } from 'react';
import DiagramCanvas from './components/Canvas/DiagramCanvas';
import InputPanel from './components/InputPanel/InputPanel';
import NodePalette from './components/Sidebar/NodePalette';
import HistoryPanel from './components/History/HistoryPanel';
import Toolbar from './components/ui/Toolbar';
import { useDiagramStore } from './store/diagramStore';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { undo } = useDiagramStore();
  useTheme(); // initialises dark class on <html> from stored/system preference

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <main className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <DiagramCanvas />
          </div>
          <InputPanel />
        </main>
        <HistoryPanel />
      </div>
    </div>
  );
}

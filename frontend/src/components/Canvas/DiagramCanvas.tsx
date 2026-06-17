import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { useDiagramStore } from '../../store/diagramStore';

function nodeColor(n: Node): string {
  const t = (n.data as Record<string, unknown>).serviceType as string ?? '';
  if (t.startsWith('aws_'))     return '#FF9900';
  if (t.startsWith('gcp_'))     return '#4285F4';
  if (t.startsWith('azure_'))   return '#0078D4';
  if (t.startsWith('oss_'))     return '#10b981';
  return '#94a3b8';
}

export default function DiagramCanvas() {
  const { nodes, edges, setNodes, setEdges } = useDiagramStore();
  const isDark = document.documentElement.classList.contains('dark');

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges],
  );

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        colorMode={isDark ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={isDark ? '#334155' : '#e2e8f0'}
        />
        <Controls className="!shadow-md" />
        <MiniMap
          className="!shadow-md !rounded-lg"
          nodeColor={nodeColor}
          maskColor={isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.6)'}
        />
      </ReactFlow>
    </div>
  );
}

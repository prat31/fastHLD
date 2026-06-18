import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
  type Node,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes/nodeTypes';
import { useDiagramStore } from '../../store/diagramStore';
import NodeContextMenu from './NodeContextMenu';

interface CtxMenu { nodeId: string; x: number; y: number }

function nodeColor(n: Node): string {
  const t = (n.data as Record<string, unknown>).serviceType as string ?? '';
  if (t.startsWith('aws_'))     return '#FF9900';
  if (t.startsWith('gcp_'))     return '#4285F4';
  if (t.startsWith('azure_'))   return '#0078D4';
  if (t.startsWith('oss_'))     return '#10b981';
  return '#94a3b8';
}

export default function DiagramCanvas() {
  const { nodes, edges, setNodes, setEdges, applyOps } = useDiagramStore();
  const isDark = document.documentElement.classList.contains('dark');
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges],
  );

  // Manual edge creation via drag: push through applyOps so undo/redo tracks it.
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      applyOps([{
        op: 'add_edge',
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        // Keep the exact handles the user connected, so the edge originates
        // from the dot they grabbed and ends at the dot they dropped on.
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        label: '',
      }]);
    },
    [applyOps],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setCtxMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    },
    [],
  );

  const closeMenu = useCallback(() => setCtxMenu(null), []);

  const handleDelete = useCallback(
    (nodeId: string) => { applyOps([{ op: 'remove_node', id: nodeId }]); closeMenu(); },
    [applyOps, closeMenu],
  );

  const handleDuplicate = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const d = node.data as Record<string, unknown>;
      applyOps([{
        op: 'add_node',
        id: `${nodeId}-copy-${Date.now()}`,
        type: d.serviceType as string,
        label: `${d.label as string} (copy)`,
        x: node.position.x + 80,
        y: node.position.y + 80,
      }]);
      closeMenu();
    },
    [nodes, applyOps, closeMenu],
  );

  const handleDisconnect = useCallback(
    (nodeId: string) => {
      const ops = edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => ({ op: 'remove_edge' as const, id: e.id }));
      if (ops.length) applyOps(ops);
      closeMenu();
    },
    [edges, applyOps, closeMenu],
  );

  const handleRename = useCallback(
    (nodeId: string, newLabel: string) => {
      applyOps([{ op: 'update_node', id: nodeId, label: newLabel }]);
      closeMenu();
    },
    [applyOps, closeMenu],
  );

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={closeMenu}
        onMove={closeMenu}
        nodeTypes={nodeTypes}
        // Loose mode: source handles can also receive connections,
        // so all four dots on a node work as both source and target.
        connectionMode={ConnectionMode.Loose}
        // Space is used for push-to-talk; disable React Flow's default Space=pan-mode.
        panActivationKeyCode={null}
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
      {ctxMenu && (
        <NodeContextMenu
          nodeId={ctxMenu.nodeId}
          x={ctxMenu.x}
          y={ctxMenu.y}
          nodes={nodes}
          onClose={closeMenu}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onDisconnect={handleDisconnect}
          onRename={handleRename}
        />
      )}
    </div>
  );
}

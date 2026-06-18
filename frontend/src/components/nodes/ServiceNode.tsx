import { memo } from 'react';
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';
import { getIcon } from './icons/iconRegistry';

interface ServiceNodeData {
  label: string;
  serviceType: string;
  [key: string]: unknown;
}

// Inline styles avoid !important Tailwind overrides interfering with
// React Flow's own handle positioning CSS (top/left/transform).
const H: React.CSSProperties = {
  width: 10,
  height: 10,
  background: '#94a3b8',
  border: '2px solid white',
  borderRadius: '50%',
};

function ServiceNode({ data, selected }: NodeProps) {
  const d = data as ServiceNodeData;
  const Icon = getIcon(d.serviceType);

  // Single relatively-positioned box that fills the node's measured size.
  // Nodes are created with definite width/height (see diagramStore), so the
  // four handles resolve to four distinct edge positions — this is what makes
  // a dragged connection start from the handle the user actually grabbed.
  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl border-2 shadow-md',
        'bg-white dark:bg-slate-800',
        'w-full h-full min-w-[80px] min-h-[60px] cursor-pointer transition-colors duration-150',
        selected
          ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900 shadow-lg'
          : 'border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400',
      ].join(' ')}
    >
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        lineStyle={{ borderColor: '#3b82f6' }}
      />

      <Handle type="source" position={Position.Top}    id="top"    style={H} />
      <Handle type="source" position={Position.Right}  id="right"  style={H} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={H} />
      <Handle type="source" position={Position.Left}   id="left"   style={H} />

      <Icon size={32} />
      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight break-words max-w-full">
        {d.label}
      </span>
    </div>
  );
}

export default memo(ServiceNode);

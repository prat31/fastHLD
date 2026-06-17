import { memo } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from '@xyflow/react';

interface GroupNodeData {
  label: string;
  [key: string]: unknown;
}

function GroupNode({ data, selected }: NodeProps) {
  const d = data as GroupNodeData;
  return (
    <>
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-blue-400"
        handleClassName="w-2 h-2 bg-blue-400 rounded-sm"
      />
      <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 relative">
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        <span className="absolute top-2 left-3 text-xs font-semibold text-slate-500 select-none">
          {d.label}
        </span>
      </div>
    </>
  );
}

export default memo(GroupNode);

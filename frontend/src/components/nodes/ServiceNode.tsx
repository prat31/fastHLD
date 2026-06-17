import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getIcon } from './icons/iconRegistry';

interface ServiceNodeData {
  label: string;
  serviceType: string;
  [key: string]: unknown;
}

function ServiceNode({ data, selected }: NodeProps) {
  const d = data as ServiceNodeData;
  const Icon = getIcon(d.serviceType);

  return (
    <div
      className={[
        'flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 shadow-md',
        'bg-white dark:bg-slate-800',
        'min-w-[80px] max-w-[120px] cursor-pointer transition-all duration-150',
        selected
          ? 'border-blue-500 shadow-blue-200 dark:shadow-blue-900 shadow-lg'
          : 'border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500" />
      <Icon size={32} />
      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight break-words max-w-full">
        {d.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400 dark:!bg-slate-500" />
    </div>
  );
}

export default memo(ServiceNode);

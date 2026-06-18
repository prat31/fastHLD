import { useCallback, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { getIcon } from '../nodes/icons/iconRegistry';
import { useDiagramStore } from '../../store/diagramStore';
import type { DiagramOp } from '../../types/diagram';

interface PaletteItem {
  type: string;
  label: string;
}

const PALETTE: { category: string; items: PaletteItem[] }[] = [
  {
    category: 'Generic',
    items: [
      { type: 'generic_database',     label: 'Database' },
      { type: 'generic_server',       label: 'Server' },
      { type: 'generic_client_web',   label: 'Web Client' },
      { type: 'generic_client_mobile',label: 'Mobile' },
      { type: 'generic_api_gateway',  label: 'API Gateway' },
      { type: 'generic_cache',        label: 'Cache' },
      { type: 'generic_queue',        label: 'Queue' },
      { type: 'generic_load_balancer',label: 'Load Balancer' },
      { type: 'generic_cdn',          label: 'CDN' },
      { type: 'generic_firewall',     label: 'Firewall' },
    ],
  },
  {
    category: 'Open Source',
    items: [
      { type: 'oss_postgres',      label: 'PostgreSQL' },
      { type: 'oss_mysql',         label: 'MySQL' },
      { type: 'oss_mongodb',       label: 'MongoDB' },
      { type: 'oss_redis',         label: 'Redis' },
      { type: 'oss_kafka',         label: 'Kafka' },
      { type: 'oss_rabbitmq',      label: 'RabbitMQ' },
      { type: 'oss_nginx',         label: 'Nginx' },
      { type: 'oss_docker',        label: 'Docker' },
      { type: 'oss_kubernetes',    label: 'Kubernetes' },
      { type: 'oss_elasticsearch', label: 'Elasticsearch' },
      { type: 'oss_prometheus',    label: 'Prometheus' },
      { type: 'oss_grafana',       label: 'Grafana' },
    ],
  },
  {
    category: 'AWS',
    items: [
      { type: 'aws_ec2',         label: 'EC2' },
      { type: 'aws_s3',          label: 'S3' },
      { type: 'aws_rds',         label: 'RDS' },
      { type: 'aws_lambda',      label: 'Lambda' },
      { type: 'aws_cloudfront',  label: 'CloudFront' },
      { type: 'aws_alb',         label: 'ALB' },
      { type: 'aws_api_gateway', label: 'API GW' },
      { type: 'aws_sqs',         label: 'SQS' },
      { type: 'aws_sns',         label: 'SNS' },
      { type: 'aws_dynamodb',    label: 'DynamoDB' },
      { type: 'aws_elasticache', label: 'ElastiCache' },
      { type: 'aws_ecs',         label: 'ECS' },
      { type: 'aws_eks',         label: 'EKS' },
      { type: 'aws_route53',     label: 'Route 53' },
      { type: 'aws_vpc',         label: 'VPC' },
    ],
  },
  {
    category: 'GCP',
    items: [
      { type: 'gcp_compute',   label: 'Compute' },
      { type: 'gcp_gcs',       label: 'GCS' },
      { type: 'gcp_bigquery',  label: 'BigQuery' },
      { type: 'gcp_functions', label: 'Functions' },
      { type: 'gcp_run',       label: 'Cloud Run' },
      { type: 'gcp_pubsub',    label: 'Pub/Sub' },
      { type: 'gcp_sql',       label: 'Cloud SQL' },
      { type: 'gcp_gke',       label: 'GKE' },
      { type: 'gcp_cdn',       label: 'CDN' },
    ],
  },
  {
    category: 'Azure',
    items: [
      { type: 'azure_vm',         label: 'VM' },
      { type: 'azure_blob',       label: 'Blob' },
      { type: 'azure_cosmos',     label: 'Cosmos DB' },
      { type: 'azure_functions',  label: 'Functions' },
      { type: 'azure_aks',        label: 'AKS' },
      { type: 'azure_servicebus', label: 'Service Bus' },
      { type: 'azure_sql',        label: 'SQL DB' },
    ],
  },
];

const MIN_WIDTH = 48;
const MAX_WIDTH = 320;
const ICON_ONLY_THRESHOLD = 100;
const DEFAULT_WIDTH = 192;

let _idCounter = 1;
function genId(type: string) {
  return `${type.replace(/_/g, '-')}-${_idCounter++}`;
}

export default function NodePalette() {
  const { applyOps } = useDiagramStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [customLabel, setCustomLabel] = useState('');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const widthRef = useRef(width);
  widthRef.current = width;

  const isIconOnly = width < ICON_ONLY_THRESHOLD;

  const toggle = (cat: string) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const addNode = (type: string, label: string) => {
    const op: DiagramOp = {
      op: 'add_node',
      id: genId(type),
      type,
      label,
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 200,
    };
    applyOps([op]);
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    addNode('generic_custom', label);
    setCustomLabel('');
  };

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widthRef.current;

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX));
      setWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div
      className="relative h-full overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 shrink-0 flex flex-col"
      style={{ width }}
    >
      {/* Drag-resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute top-0 right-0 h-full w-1.5 cursor-ew-resize z-10 hover:bg-blue-400/40 active:bg-blue-400/60 transition-colors"
        title="Drag to resize"
      />

      {isIconOnly ? (
        /* ── Icon-only mode ── */
        <div className="flex flex-col items-center gap-0.5 py-3 px-1">
          {PALETTE.map(({ category, items }) => (
            <div key={category} className="w-full flex flex-col items-center gap-0.5">
              <div className="w-6 h-px bg-slate-200 dark:bg-slate-600 my-1" title={category} />
              {items.map((item) => {
                const Icon = getIcon(item.type);
                return (
                  <button
                    key={item.type}
                    onClick={() => addNode(item.type, item.label)}
                    title={item.label}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        /* ── Full mode ── */
        <div className="flex flex-col gap-3 py-3 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
            Components
          </p>

          {/* Custom node adder */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 mb-1.5">
              Custom
            </p>
            <div className="flex items-center gap-1 px-2">
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
                placeholder="e.g. Payment Service"
                className={[
                  'flex-1 min-w-0 text-xs px-2 py-1 rounded-lg border',
                  'bg-slate-50 dark:bg-slate-700',
                  'border-slate-200 dark:border-slate-600',
                  'text-slate-700 dark:text-slate-200',
                  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                  'focus:outline-none focus:ring-1 focus:ring-blue-400',
                ].join(' ')}
              />
              <button
                onClick={addCustom}
                disabled={!customLabel.trim()}
                title="Add custom node"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-700" />

          {/* Collapsible category sections */}
          {PALETTE.map(({ category, items }) => {
            const isOpen = !collapsed[category];
            return (
              <div key={category}>
                <button
                  onClick={() => toggle(category)}
                  className="flex w-full items-center gap-1 px-2 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  {isOpen
                    ? <ChevronDown size={11} className="text-slate-400 shrink-0" />
                    : <ChevronRight size={11} className="text-slate-400 shrink-0" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
                    {category}
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {items.map((item) => {
                      const Icon = getIcon(item.type);
                      return (
                        <button
                          key={item.type}
                          onClick={() => addNode(item.type, item.label)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors group"
                          title={`Add ${item.label}`}
                        >
                          <Icon size={18} />
                          <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { getIcon } from '../nodes/icons/iconRegistry';
import { useDiagramStore } from '../../store/diagramStore';
import type { DiagramOp } from '../../types/diagram';

interface PaletteItem {
  type: string;
  label: string;
}

const PALETTE: { category: string; items: PaletteItem[] }[] = [
  {
    category: 'AWS',
    items: [
      { type: 'aws_ec2', label: 'EC2' },
      { type: 'aws_s3', label: 'S3' },
      { type: 'aws_rds', label: 'RDS' },
      { type: 'aws_lambda', label: 'Lambda' },
      { type: 'aws_cloudfront', label: 'CloudFront' },
      { type: 'aws_alb', label: 'ALB' },
      { type: 'aws_api_gateway', label: 'API GW' },
      { type: 'aws_sqs', label: 'SQS' },
      { type: 'aws_sns', label: 'SNS' },
      { type: 'aws_dynamodb', label: 'DynamoDB' },
      { type: 'aws_elasticache', label: 'ElastiCache' },
      { type: 'aws_ecs', label: 'ECS' },
      { type: 'aws_eks', label: 'EKS' },
      { type: 'aws_route53', label: 'Route 53' },
      { type: 'aws_vpc', label: 'VPC' },
    ],
  },
  {
    category: 'GCP',
    items: [
      { type: 'gcp_compute', label: 'Compute' },
      { type: 'gcp_gcs', label: 'GCS' },
      { type: 'gcp_bigquery', label: 'BigQuery' },
      { type: 'gcp_functions', label: 'Functions' },
      { type: 'gcp_run', label: 'Cloud Run' },
      { type: 'gcp_pubsub', label: 'Pub/Sub' },
      { type: 'gcp_sql', label: 'Cloud SQL' },
      { type: 'gcp_gke', label: 'GKE' },
      { type: 'gcp_cdn', label: 'CDN' },
    ],
  },
  {
    category: 'Azure',
    items: [
      { type: 'azure_vm', label: 'VM' },
      { type: 'azure_blob', label: 'Blob' },
      { type: 'azure_cosmos', label: 'Cosmos DB' },
      { type: 'azure_functions', label: 'Functions' },
      { type: 'azure_aks', label: 'AKS' },
      { type: 'azure_servicebus', label: 'Service Bus' },
      { type: 'azure_sql', label: 'SQL DB' },
    ],
  },
  {
    category: 'Open Source',
    items: [
      { type: 'oss_postgres', label: 'PostgreSQL' },
      { type: 'oss_mysql', label: 'MySQL' },
      { type: 'oss_mongodb', label: 'MongoDB' },
      { type: 'oss_redis', label: 'Redis' },
      { type: 'oss_kafka', label: 'Kafka' },
      { type: 'oss_rabbitmq', label: 'RabbitMQ' },
      { type: 'oss_nginx', label: 'Nginx' },
      { type: 'oss_docker', label: 'Docker' },
      { type: 'oss_kubernetes', label: 'Kubernetes' },
      { type: 'oss_elasticsearch', label: 'Elasticsearch' },
      { type: 'oss_prometheus', label: 'Prometheus' },
      { type: 'oss_grafana', label: 'Grafana' },
    ],
  },
  {
    category: 'Generic',
    items: [
      { type: 'generic_database', label: 'Database' },
      { type: 'generic_server', label: 'Server' },
      { type: 'generic_client_web', label: 'Web Client' },
      { type: 'generic_client_mobile', label: 'Mobile' },
      { type: 'generic_api_gateway', label: 'API Gateway' },
      { type: 'generic_cache', label: 'Cache' },
      { type: 'generic_queue', label: 'Queue' },
      { type: 'generic_load_balancer', label: 'Load Balancer' },
      { type: 'generic_cdn', label: 'CDN' },
      { type: 'generic_firewall', label: 'Firewall' },
    ],
  },
];

let _idCounter = 1;
function genId(type: string) {
  return `${type.replace('_', '-')}-${_idCounter++}`;
}

export default function NodePalette() {
  const { applyOps } = useDiagramStore();

  const addNode = (item: PaletteItem) => {
    const op: DiagramOp = {
      op: 'add_node',
      id: genId(item.type),
      type: item.type,
      label: item.label,
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 200,
    };
    applyOps([op]);
  };

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 px-2 py-3 flex flex-col gap-4 w-48 shrink-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">Components</p>
      {PALETTE.map(({ category, items }) => (
        <div key={category}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 mb-1">{category}</p>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <button
                  key={item.type}
                  onClick={() => addNode(item)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors group"
                  title={`Add ${item.label}`}
                >
                  <Icon size={18} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

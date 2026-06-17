/**
 * Maps node type strings to React icon components.
 * AWS/GCP/Azure: custom SVGs with brand colors.
 * OSS: simple-icons.
 * Generic: lucide-react.
 */
import { type ElementType, type JSX } from 'react';
import {
  Database, Server, Globe, Smartphone, ShieldCheck,
  Layers, HardDrive, Share2, Cpu, Filter, Boxes,
} from 'lucide-react';
import * as si from 'simple-icons';

export interface IconProps {
  size?: number;
  className?: string;
}

export type IconComponent = (props: IconProps) => JSX.Element;

interface SiIconDef { path: string; hex: string }

// ---- AWS color-coded SVG icons ----
function AwsIcon({ label, color = '#FF9900', size = 32, className = '' }: IconProps & { label: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
      <rect x="2" y="2" width="36" height="36" rx="6" fill={color} />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">
        {label}
      </text>
    </svg>
  );
}

function GcpIcon({ label, color = '#4285F4', size = 32, className = '' }: IconProps & { label: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
      <rect x="2" y="2" width="36" height="36" rx="18" fill={color} />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">
        {label}
      </text>
    </svg>
  );
}

function AzureIcon({ label, color = '#0078D4', size = 32, className = '' }: IconProps & { label: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
      <polygon points="20,3 37,37 3,37" fill={color} />
      <text x="20" y="33" textAnchor="middle" fill="white" fontSize="7" fontFamily="monospace" fontWeight="bold">
        {label}
      </text>
    </svg>
  );
}

function SiIcon({ icon, size = 32, className = '' }: { icon: SiIconDef } & IconProps) {
  return (
    <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill={`#${icon.hex}`} className={className}>
      <path d={icon.path} />
    </svg>
  );
}

function L({ Icon, color, size = 32, className = '' }: { Icon: ElementType; color: string } & IconProps) {
  return <Icon size={size} color={color} className={className} strokeWidth={1.5} />;
}

function siIcon(name: string): SiIconDef | undefined {
  const key = `si${name}` as keyof typeof si;
  return si[key] as unknown as SiIconDef | undefined;
}

function OssIcon({ name, fallbackColor, size, className }: { name: string; fallbackColor: string } & IconProps): JSX.Element {
  const icon = siIcon(name);
  if (icon) return <SiIcon icon={icon} size={size} className={className} />;
  return <L Icon={Database} color={fallbackColor} size={size} className={className} />;
}

const iconMap: Record<string, IconComponent> = {
  aws_ec2:         (p) => <AwsIcon label="EC2" color="#FF9900" {...p} />,
  aws_s3:          (p) => <AwsIcon label="S3" color="#FF9900" {...p} />,
  aws_rds:         (p) => <AwsIcon label="RDS" color="#527FFF" {...p} />,
  aws_lambda:      (p) => <AwsIcon label="λ" color="#FF9900" {...p} />,
  aws_cloudfront:  (p) => <AwsIcon label="CF" color="#8C4FFF" {...p} />,
  aws_alb:         (p) => <AwsIcon label="ALB" color="#FF9900" {...p} />,
  aws_api_gateway: (p) => <AwsIcon label="APIG" color="#FF4F8B" {...p} />,
  aws_sqs:         (p) => <AwsIcon label="SQS" color="#FF4F8B" {...p} />,
  aws_sns:         (p) => <AwsIcon label="SNS" color="#FF4F8B" {...p} />,
  aws_dynamodb:    (p) => <AwsIcon label="DDB" color="#527FFF" {...p} />,
  aws_elasticache: (p) => <AwsIcon label="EC$" color="#C7131F" {...p} />,
  aws_ecs:         (p) => <AwsIcon label="ECS" color="#FF9900" {...p} />,
  aws_eks:         (p) => <AwsIcon label="EKS" color="#FF9900" {...p} />,
  aws_route53:     (p) => <AwsIcon label="R53" color="#8C4FFF" {...p} />,
  aws_vpc:         (p) => <AwsIcon label="VPC" color="#8C4FFF" {...p} />,

  gcp_compute:  (p) => <GcpIcon label="GCE" color="#4285F4" {...p} />,
  gcp_gcs:      (p) => <GcpIcon label="GCS" color="#34A853" {...p} />,
  gcp_bigquery: (p) => <OssIcon name="Googlebigquery" fallbackColor="#4285F4" {...p} />,
  gcp_functions:(p) => <GcpIcon label="GCF" color="#FBBC04" {...p} />,
  gcp_run:      (p) => <GcpIcon label="CR" color="#4285F4" {...p} />,
  gcp_pubsub:   (p) => <GcpIcon label="PS" color="#EA4335" {...p} />,
  gcp_sql:      (p) => <GcpIcon label="SQL" color="#4285F4" {...p} />,
  gcp_gke:      (p) => <GcpIcon label="GKE" color="#4285F4" {...p} />,
  gcp_cdn:      (p) => <GcpIcon label="CDN" color="#34A853" {...p} />,

  azure_vm:         (p) => <AzureIcon label="VM" color="#0078D4" {...p} />,
  azure_blob:       (p) => <AzureIcon label="BLOB" color="#0078D4" {...p} />,
  azure_cosmos:     (p) => <AzureIcon label="CDB" color="#0078D4" {...p} />,
  azure_functions:  (p) => <AzureIcon label="FN" color="#0078D4" {...p} />,
  azure_aks:        (p) => <AzureIcon label="AKS" color="#0078D4" {...p} />,
  azure_servicebus: (p) => <AzureIcon label="SB" color="#0078D4" {...p} />,
  azure_sql:        (p) => <AzureIcon label="SQL" color="#0078D4" {...p} />,

  oss_postgres:      (p) => <OssIcon name="Postgresql" fallbackColor="#336791" {...p} />,
  oss_mysql:         (p) => <OssIcon name="Mysql" fallbackColor="#4479A1" {...p} />,
  oss_mongodb:       (p) => <OssIcon name="Mongodb" fallbackColor="#47A248" {...p} />,
  oss_redis:         (p) => <OssIcon name="Redis" fallbackColor="#DC382D" {...p} />,
  oss_kafka:         (p) => <OssIcon name="Apachekafka" fallbackColor="#231F20" {...p} />,
  oss_rabbitmq:      (p) => <OssIcon name="Rabbitmq" fallbackColor="#FF6600" {...p} />,
  oss_nginx:         (p) => <OssIcon name="Nginx" fallbackColor="#009639" {...p} />,
  oss_docker:        (p) => <OssIcon name="Docker" fallbackColor="#2496ED" {...p} />,
  oss_kubernetes:    (p) => <OssIcon name="Kubernetes" fallbackColor="#326CE5" {...p} />,
  oss_elasticsearch: (p) => <OssIcon name="Elasticsearch" fallbackColor="#005571" {...p} />,
  oss_prometheus:    (p) => <OssIcon name="Prometheus" fallbackColor="#E6522C" {...p} />,
  oss_grafana:       (p) => <OssIcon name="Grafana" fallbackColor="#F46800" {...p} />,

  generic_database:       (p) => <L Icon={Database}    color="#6366f1" {...p} />,
  generic_server:         (p) => <L Icon={Server}      color="#0ea5e9" {...p} />,
  generic_client_web:     (p) => <L Icon={Globe}       color="#10b981" {...p} />,
  generic_client_mobile:  (p) => <L Icon={Smartphone}  color="#10b981" {...p} />,
  generic_api_gateway:    (p) => <L Icon={Filter}      color="#f59e0b" {...p} />,
  generic_cache:          (p) => <L Icon={Cpu}         color="#ef4444" {...p} />,
  generic_queue:          (p) => <L Icon={Layers}      color="#8b5cf6" {...p} />,
  generic_load_balancer:  (p) => <L Icon={Share2}      color="#06b6d4" {...p} />,
  generic_cdn:            (p) => <L Icon={HardDrive}   color="#f97316" {...p} />,
  generic_firewall:       (p) => <L Icon={ShieldCheck} color="#dc2626" {...p} />,
};

export const FALLBACK_ICON: IconComponent = (p) => <L Icon={Boxes} color="#94a3b8" {...p} />;

export function getIcon(type: string): IconComponent {
  return iconMap[type] ?? FALLBACK_ICON;
}

export { iconMap };

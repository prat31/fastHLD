export interface NodePosition {
  x: number;
  y: number;
}

export interface DiagramNode {
  id: string;
  type: string;
  label: string;
  position: NodePosition;
  data: Record<string, unknown>;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated: boolean;
}

export interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// --- Operations ---

export interface AddNodeOp {
  op: 'add_node';
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data?: Record<string, unknown>;
}

export interface UpdateNodeOp {
  op: 'update_node';
  id: string;
  label?: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
}

export interface RemoveNodeOp {
  op: 'remove_node';
  id: string;
}

export interface AddEdgeOp {
  op: 'add_edge';
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface RemoveEdgeOp {
  op: 'remove_edge';
  id: string;
}

export interface ClearOp {
  op: 'clear';
}

export type DiagramOp =
  | AddNodeOp
  | UpdateNodeOp
  | RemoveNodeOp
  | AddEdgeOp
  | RemoveEdgeOp
  | ClearOp;

// --- API ---

export interface InstructRequest {
  instruction: string;
  diagram_state: DiagramState;
}

export interface InstructResponse {
  ops: DiagramOp[];
  raw: string;
}

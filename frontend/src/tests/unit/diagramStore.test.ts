import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagramStore } from '../../store/diagramStore';

// Reset store between tests
beforeEach(() => {
  useDiagramStore.setState({ nodes: [], edges: [], past: [], future: [] });
});

describe('diagramStore — applyOps', () => {
  it('add_node creates a new node', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'aws_ec2', label: 'Server', x: 100, y: 200 },
    ]);
    const { nodes } = useDiagramStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
    expect(nodes[0].data.serviceType).toBe('aws_ec2');
    expect(nodes[0].data.label).toBe('Server');
    expect(nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  it('add_node does not duplicate an existing id', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'aws_ec2', label: 'A', x: 0, y: 0 },
      { op: 'add_node', id: 'n1', type: 'aws_ec2', label: 'B', x: 0, y: 0 },
    ]);
    expect(useDiagramStore.getState().nodes).toHaveLength(1);
  });

  it('remove_node deletes node and its edges', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'A', x: 0, y: 0 },
      { op: 'add_node', id: 'n2', type: 'generic_server', label: 'B', x: 0, y: 0 },
      { op: 'add_edge', id: 'e1', source: 'n1', target: 'n2' },
    ]);
    useDiagramStore.getState().applyOps([{ op: 'remove_node', id: 'n1' }]);
    const { nodes, edges } = useDiagramStore.getState();
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });

  it('update_node changes label and position', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'Old', x: 10, y: 20 },
    ]);
    useDiagramStore.getState().applyOps([
      { op: 'update_node', id: 'n1', label: 'New', x: 99, y: 88 },
    ]);
    const n = useDiagramStore.getState().nodes[0];
    expect(n.data.label).toBe('New');
    expect(n.position).toEqual({ x: 99, y: 88 });
  });

  it('add_edge creates an edge', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'A', x: 0, y: 0 },
      { op: 'add_node', id: 'n2', type: 'generic_server', label: 'B', x: 0, y: 0 },
      { op: 'add_edge', id: 'e1', source: 'n1', target: 'n2', label: 'HTTP' },
    ]);
    const { edges } = useDiagramStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('e1');
    expect(edges[0].label).toBe('HTTP');
  });

  it('remove_edge deletes an edge', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'A', x: 0, y: 0 },
      { op: 'add_node', id: 'n2', type: 'generic_server', label: 'B', x: 0, y: 0 },
      { op: 'add_edge', id: 'e1', source: 'n1', target: 'n2' },
    ]);
    useDiagramStore.getState().applyOps([{ op: 'remove_edge', id: 'e1' }]);
    expect(useDiagramStore.getState().edges).toHaveLength(0);
  });

  it('clear removes all nodes and edges', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'A', x: 0, y: 0 },
      { op: 'add_edge', id: 'e1', source: 'n1', target: 'n1' },
    ]);
    useDiagramStore.getState().applyOps([{ op: 'clear' }]);
    const { nodes, edges } = useDiagramStore.getState();
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });
});

describe('diagramStore — undo/redo', () => {
  it('undo reverts the last applyOps', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'A', x: 0, y: 0 },
    ]);
    useDiagramStore.getState().undo();
    expect(useDiagramStore.getState().nodes).toHaveLength(0);
  });

  it('redo re-applies after undo', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'generic_server', label: 'A', x: 0, y: 0 },
    ]);
    useDiagramStore.getState().undo();
    useDiagramStore.getState().redo();
    expect(useDiagramStore.getState().nodes).toHaveLength(1);
  });

  it('undo on empty history is a no-op', () => {
    expect(() => useDiagramStore.getState().undo()).not.toThrow();
  });

  it('redo on empty future is a no-op', () => {
    expect(() => useDiagramStore.getState().redo()).not.toThrow();
  });
});

describe('diagramStore — snapshot', () => {
  it('snapshot returns current state in API format', () => {
    useDiagramStore.getState().applyOps([
      { op: 'add_node', id: 'n1', type: 'aws_ec2', label: 'EC2', x: 100, y: 200 },
    ]);
    const snap = useDiagramStore.getState().snapshot();
    expect(snap.nodes).toHaveLength(1);
    expect(snap.nodes[0].id).toBe('n1');
    expect(snap.nodes[0].type).toBe('aws_ec2');
  });
});

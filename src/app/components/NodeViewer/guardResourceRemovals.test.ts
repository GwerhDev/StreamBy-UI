import { describe, expect, it } from 'vitest';
import type { Edge, Node } from 'reactflow';
import { guardResourceRemovals } from './NodeViewer';

// Deleting, on the workflow, a resource's node (bound to it by its id in its data) asks first:
// the node and its edges stay until it's confirmed.
const node = (id: string, label = id, selected = false, type?: string, data: Record<string, unknown> = {}): Node =>
  ({ id, type, position: { x: 0, y: 0 }, data: { label, ...data }, selected });
const edge = (id: string, source: string, target: string): Edge => ({ id, source, target });

describe('guardResourceRemovals', () => {
  const nodes = [
    node('db-c1', 'PostgreSQL', true, 'dataSourceNode', { connectionId: 'c1' }), node('streamby', 'StreamBy'),
    node('shot-1', 'Shot', true, 'shotNode'), node('export-e1', 'Site', false, 'exportNode', { exportId: 'e1' }),
  ];
  const edges = [edge('e-db', 'db-c1', 'streamby'), edge('e-shot', 'shot-1', 'streamby'), edge('e-exp', 'streamby', 'export-e1')];

  it("asks for the resource of a drawn node removed, keeping it and its edges; the rest goes", () => {
    const split = guardResourceRemovals(nodes, edges,
      [{ type: 'remove', id: 'db-c1' }, { type: 'remove', id: 'shot-1' }],
      [{ type: 'remove', id: 'e-db' }, { type: 'remove', id: 'e-shot' }]);
    expect(split.resources).toEqual([{ nodeId: 'db-c1', kind: 'db', id: 'c1', name: 'PostgreSQL' }]);
    expect(split.nodeChanges).toEqual([{ type: 'remove', id: 'shot-1' }]);
    expect(split.edgeChanges).toEqual([{ type: 'remove', id: 'e-shot' }]);
    expect(split.orchestrator).toBe(false);
  });

  it("knows each kind by its node's type and the id in its data, not by the node's id", () => {
    const bound: [string, string][] = [['dataSourceNode', 'connectionId'], ['connectionNode', 'connectionId'], ['ingestNode', 'storageConnectionId'],
      ['integrationConnectionNode', 'integrationConnectionId'], ['exportNode', 'exportId'], ['pipelineRefNode', 'pipelineId']];
    const kinds = bound.map(([type, field], i) =>
      guardResourceRemovals([node(`n${i}`, 'x', false, type, { [field]: `r${i}` })], [], [{ type: 'remove', id: `n${i}` }]).resources[0]);
    expect(kinds.map(r => [r.kind, r.id])).toEqual([['db', 'r0'], ['api', 'r1'], ['storage', 'r2'], ['service', 'r3'], ['export', 'r4'], ['pipeline', 'r5']]);
  });

  it("lets a draft go (set to connect on save), and a data source reading one table", () => {
    const drafts = [
      node('d1', 'PostgreSQL', true, 'dataSourceNode', { connectionId: '__connect__:postgres' }),
      node('d2', 'Spells', true, 'dataSourceNode', { connectionId: 'c1', tableName: 'spells' }),
      node('d3', 'Data Source', true, 'dataSourceNode'),
    ];
    const split = guardResourceRemovals(drafts, [], drafts.map(d => ({ type: 'remove' as const, id: d.id })));
    expect(split.resources).toEqual([]);
    expect(split.nodeChanges).toHaveLength(3);
  });

  it("refuses the orchestrator; an edge alone (its nodes not being deleted) can go", () => {
    const split = guardResourceRemovals(nodes, edges, [{ type: 'remove', id: 'streamby' }], [{ type: 'remove', id: 'e-exp' }]);
    expect(split.orchestrator).toBe(true);
    expect(split.nodeChanges).toEqual([]);
    expect(split.edgeChanges).toEqual([{ type: 'remove', id: 'e-exp' }]);
  });

  it('lets other changes through untouched', () => {
    const moved = [{ type: 'position' as const, id: 'db-c1', position: { x: 4, y: 2 } }];
    expect(guardResourceRemovals(nodes, edges, moved).nodeChanges).toEqual(moved);
  });
});

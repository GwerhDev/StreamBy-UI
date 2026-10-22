import type { Edge, Node } from 'reactflow';
import { buildSchemaFromProject, rebuildSchemaFromProject } from './WorkflowCanvas';
import { Project } from '../../../interfaces';

const baseProject: Project = {
  id: 'proj1',
  name: 'Test Project',
  public: false,
};

describe('buildSchemaFromProject', () => {
  it('draws a pipelineRefNode per project.pipelines[] with pipelineId in data (TCORE-64 bug fix)', () => {
    const project: Project = {
      ...baseProject,
      pipelines: [{ id: 'p1', name: 'test', order: 0 }, { id: 'p2', name: 'second', order: 1 }],
    };
    const { nodes } = buildSchemaFromProject(project);
    const pipelineNodes = nodes.filter(n => n.type === 'pipelineRefNode');

    expect(pipelineNodes).toHaveLength(2);
    expect(pipelineNodes.map(n => n.data.pipelineId)).toEqual(['p1', 'p2']);
    expect(pipelineNodes.map(n => n.data.label)).toEqual(['test', 'second']);
  });

  it('connects each pipelineRefNode to the orchestrator via out-pipeline/in-orchestrator', () => {
    const project: Project = { ...baseProject, pipelines: [{ id: 'p1', name: 'test', order: 0 }] };
    const { edges } = buildSchemaFromProject(project);
    const edge = edges.find(e => e.target === 'pipeline-p1');

    expect(edge).toBeDefined();
    expect(edge?.source).toBe('streamby');
    expect(edge?.sourceHandle).toBe('out-pipeline');
    expect(edge?.targetHandle).toBe('in-orchestrator');
  });

  it('exportNode carries data.exportId and connects via out-bottom/in-orchestrator-bottom', () => {
    const project: Project = {
      ...baseProject,
      exports: [{ id: 'e1', name: 'my-export', method: 'GET' } as any],
    };
    const { nodes, edges } = buildSchemaFromProject(project);
    const exportNode = nodes.find(n => n.type === 'exportNode');
    const edge = edges.find(e => e.target === 'export-e1');

    expect(exportNode?.data.exportId).toBe('e1');
    expect(edge?.source).toBe('streamby');
    expect(edge?.sourceHandle).toBe('out-bottom');
    expect(edge?.targetHandle).toBe('in-orchestrator-bottom');
  });

  it('input nodes (dataSourceNode) connect to the orchestrator via in-top, not the legacy in-left', () => {
    const project: Project = {
      ...baseProject,
      dbConnections: [{ id: 'db1', name: 'mydb', dbType: 'postgresql' } as any],
    };
    const { edges } = buildSchemaFromProject(project);
    const edge = edges.find(e => e.source === 'db-db1');

    expect(edge?.targetHandle).toBe('in-top');
    expect(edge?.target).toBe('streamby');
  });

  it('produces no pipeline/export nodes when the project has neither', () => {
    const { nodes } = buildSchemaFromProject(baseProject);
    expect(nodes.some(n => n.type === 'pipelineRefNode')).toBe(false);
    expect(nodes.some(n => n.type === 'exportNode')).toBe(false);
  });

  it('dataSourceNode is born with connectionId already set — builtin/BYOC connections are plug-and-play', () => {
    const project: Project = {
      ...baseProject,
      dbConnections: [{ id: 'db1', name: 'mydb', dbType: 'postgresql' } as any],
    };
    const { nodes } = buildSchemaFromProject(project);
    const node = nodes.find(n => n.type === 'dataSourceNode');
    expect(node?.data.connectionId).toBe('db1');
  });

  it('ingestNode is born with storageConnectionId already set — builtin/BYOC connections are plug-and-play', () => {
    const project: Project = {
      ...baseProject,
      storageConnections: [{ id: 'st1', name: 'mystorage', type: 's3' } as any],
    };
    const { nodes } = buildSchemaFromProject(project);
    const node = nodes.find(n => n.type === 'ingestNode');
    expect(node?.data.storageConnectionId).toBe('st1');
  });

  it('draws an integrationConnectionNode per project.integrationConnections[], born with integrationConnectionId already set', () => {
    const project: Project = {
      ...baseProject,
      integrationConnections: [{ id: 'ic1', name: 'My Claude', provider: 'claude', projectId: 'proj1', integrationId: 'int1', source: 'integration' } as any],
    };
    const { nodes } = buildSchemaFromProject(project);
    const node = nodes.find(n => n.type === 'integrationConnectionNode');
    expect(node).toBeDefined();
    expect(node?.data.integrationConnectionId).toBe('ic1');
    expect(node?.data.label).toBe('My Claude');
    expect(node?.data.subtitle).toBe('claude');
  });

  it('integrationConnectionNode connects to the orchestrator via in-top, matching the other input node types', () => {
    const project: Project = {
      ...baseProject,
      integrationConnections: [{ id: 'ic1', name: 'My Claude', provider: 'claude', projectId: 'proj1', integrationId: 'int1', source: 'integration' } as any],
    };
    const { edges } = buildSchemaFromProject(project);
    const edge = edges.find(e => e.source === 'svc-ic1');
    expect(edge?.targetHandle).toBe('in-top');
    expect(edge?.target).toBe('streamby');
  });
});

describe('rebuildSchemaFromProject', () => {
  const saved: { nodes: Node[]; edges: Edge[] } = {
    nodes: [
      { id: 'streamby', type: 'orchestratorNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'pipeline-gone', type: 'pipelineRefNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'shotNode-1', type: 'shotNode', position: { x: 240, y: 300 }, data: { label: 'Shot' } },
      { id: 'reviewGateNode-1', type: 'reviewGateNode', position: { x: 400, y: 300 }, data: { label: 'Review Gate' } },
    ],
    edges: [
      { id: 'e-user', source: 'shotNode-1', target: 'reviewGateNode-1' },
      { id: 'e-to-gone', source: 'pipeline-gone', target: 'shotNode-1' },
    ],
  };

  it('keeps the nodes placed on the canvas, and their edges, while redrawing the resources', () => {
    const project: Project = { ...baseProject, pipelines: [{ id: 'p1', name: 'new', order: 0 }] };
    const { nodes, edges } = rebuildSchemaFromProject(project, saved);
    expect(nodes.map(n => n.id)).toEqual(expect.arrayContaining(['streamby', 'pipeline-p1', 'shotNode-1', 'reviewGateNode-1']));
    expect(nodes.map(n => n.id)).not.toContain('pipeline-gone');
    expect(nodes.find(n => n.id === 'shotNode-1')).toEqual(saved.nodes[2]);
    expect(edges.map(e => e.id)).toContain('e-user');
    expect(edges.map(e => e.id)).not.toContain('e-to-gone');
    expect(nodes.filter(n => n.id === 'streamby')).toHaveLength(1);
  });

  it('with nothing saved, is the drawn schema', () => {
    expect(rebuildSchemaFromProject(baseProject, null)).toEqual(buildSchemaFromProject(baseProject));
  });
});

import { buildSchemaFromProject } from './WorkflowCanvas';
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
    const { nodes } = buildSchemaFromProject(project, [], []);
    const pipelineNodes = nodes.filter(n => n.type === 'pipelineRefNode');

    expect(pipelineNodes).toHaveLength(2);
    expect(pipelineNodes.map(n => n.data.pipelineId)).toEqual(['p1', 'p2']);
    expect(pipelineNodes.map(n => n.data.label)).toEqual(['test', 'second']);
  });

  it('connects each pipelineRefNode to the orchestrator via out-pipeline/in-orchestrator', () => {
    const project: Project = { ...baseProject, pipelines: [{ id: 'p1', name: 'test', order: 0 }] };
    const { edges } = buildSchemaFromProject(project, [], []);
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
    const { nodes, edges } = buildSchemaFromProject(project, [], []);
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
    const { edges } = buildSchemaFromProject(project, [], []);
    const edge = edges.find(e => e.source === 'db-db1');

    expect(edge?.targetHandle).toBe('in-top');
    expect(edge?.target).toBe('streamby');
  });

  it('produces no pipeline/export nodes when the project has neither', () => {
    const { nodes } = buildSchemaFromProject(baseProject, [], []);
    expect(nodes.some(n => n.type === 'pipelineRefNode')).toBe(false);
    expect(nodes.some(n => n.type === 'exportNode')).toBe(false);
  });
});

import { projectFingerprint, schemaFingerprint } from './WorkflowPage';
import { Project } from '../../interfaces';

const baseProject: Project = { id: 'proj1', name: 'Test', public: false };

describe('projectFingerprint / schemaFingerprint (TCORE-64 staleness detection)', () => {
  it('includes pipeline ids in the project fingerprint', () => {
    const project: Project = { ...baseProject, pipelines: [{ id: 'p1', name: 'test', order: 0 }] };
    expect(projectFingerprint(project, [], [])).toContain('pipeline-p1');
  });

  it('schemaFingerprint recognizes pipeline- prefixed node ids', () => {
    const nodes = [{ id: 'pipeline-p1' }, { id: 'streamby' }, { id: 'export-e1' }];
    expect(schemaFingerprint(nodes)).toBe('export-e1,pipeline-p1');
  });

  it('detects staleness when a pipeline exists in the project but not in the saved schema (the TCORE-64 bug)', () => {
    const project: Project = { ...baseProject, pipelines: [{ id: 'p1', name: 'test', order: 0 }] };
    const schemaNodes = [{ id: 'streamby' }]; // no pipeline- node saved yet
    expect(schemaFingerprint(schemaNodes)).not.toBe(projectFingerprint(project, [], []));
  });

  it('fingerprints match once the pipeline node is present in the schema', () => {
    const project: Project = { ...baseProject, pipelines: [{ id: 'p1', name: 'test', order: 0 }] };
    const schemaNodes = [{ id: 'streamby' }, { id: 'pipeline-p1' }];
    expect(schemaFingerprint(schemaNodes)).toBe(projectFingerprint(project, [], []));
  });
});

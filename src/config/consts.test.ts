import { dashboardDirectoryList, WORKFLOW_SECTION_BY_GROUP } from './consts';
import { WORKFLOW_GROUP_BY_TYPE, WorkflowGroup } from '../app/components/NodeViewer/nodePalette';

describe('WORKFLOW_SECTION_BY_GROUP', () => {
  it('maps exactly the sidebar-relevant groups (process/review/delivery)', () => {
    expect(Object.keys(WORKFLOW_SECTION_BY_GROUP).sort()).toEqual(['delivery', 'process', 'review']);
  });

  it('every mapped group has at least one node type assigned in nodePalette (no phantom sections)', () => {
    const groupsWithNodes = new Set(Object.values(WORKFLOW_GROUP_BY_TYPE));
    for (const group of Object.keys(WORKFLOW_SECTION_BY_GROUP) as WorkflowGroup[]) {
      expect(groupsWithNodes.has(group)).toBe(true);
    }
  });

  it('does not carry a "render" entry (Render Farm was removed, not node-derived)', () => {
    expect('render' in WORKFLOW_SECTION_BY_GROUP).toBe(false);
  });

  it('each section has a stable path used by the existing workflow sub-routes', () => {
    const paths = Object.values(WORKFLOW_SECTION_BY_GROUP).map(s => s!.path).sort();
    expect(paths).toEqual(['deliverables', 'jobs', 'reviews']);
  });
});

describe('deriving active sections from instantiated node types', () => {
  const deriveGroups = (types: string[]) => {
    const groups = new Set<WorkflowGroup>();
    for (const type of types) {
      const group = WORKFLOW_GROUP_BY_TYPE[type];
      if (group) groups.add(group);
    }
    return groups;
  };

  it('an empty canvas derives no sections', () => {
    expect(deriveGroups([])).toEqual(new Set());
  });

  it('a Shot, Assembly or Master node saved on the canvas surfaces no section', () => {
    const groups = deriveGroups(['shotNode', 'assemblyNode', 'masterNode']);
    const sections = (Object.keys(WORKFLOW_SECTION_BY_GROUP) as WorkflowGroup[]).filter(g => groups.has(g));
    expect(sections).toEqual([]);
  });

  it('mixed node types surface exactly their matching sections', () => {
    const groups = deriveGroups(['shotNode', 'reviewGateNode', 'deliverableNode', 'jsonInputNode']);
    const sections = (Object.keys(WORKFLOW_SECTION_BY_GROUP) as WorkflowGroup[]).filter(g => groups.has(g));
    expect(sections.sort()).toEqual(['delivery', 'review']);
  });
});

describe('dashboardDirectoryList', () => {
  it('has Production after Documents', () => {
    expect(dashboardDirectoryList.map(d => d.path)).toEqual([
      'dashboard/overview', 'dashboard/members', 'dashboard/documents', 'dashboard/production',
    ]);
  });
});

import { WORKFLOW_GROUP_BY_TYPE, WorkflowGroup } from '../NodeViewer/nodePalette';

/**
 * The workflow sections a project shows: one per group with a node on its canvas. A Pipeline
 * node doesn't count: drawn for every pipeline, it has its own sub-section, and it would show
 * Jobs just because a pipeline exists.
 */
export function activeWorkflowGroupsOf(nodes: { type?: string }[] | undefined): Set<WorkflowGroup> {
  const groups = new Set<WorkflowGroup>();
  for (const node of nodes ?? []) {
    if (!node.type || node.type === 'pipelineRefNode') continue;
    const group = WORKFLOW_GROUP_BY_TYPE[node.type];
    if (group) groups.add(group);
  }
  return groups;
}

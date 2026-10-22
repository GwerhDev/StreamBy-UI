import { WORKFLOW_GROUP_BY_TYPE, WorkflowGroup } from '../NodeViewer/nodePalette';

// pipelineRefNode/exportNode are reference/link nodes auto-drawn for every
// Pipeline/Export — they already have their own dedicated sidebar sub-section, so they
// must NOT count toward a workflow group (otherwise e.g. "Production" would appear just
// because a Pipeline node exists on the canvas, with no real production node present).
const WORKFLOW_SECTION_EXCLUDED_TYPES = new Set(['pipelineRefNode', 'exportNode']);

/**
 * The workflow sections a project shows: one per group with a node on its canvas, and
 * Production whenever it has production data (made through the API or by an agent, node or
 * not), so that data is never hidden.
 */
export function activeWorkflowGroupsOf(nodes: { type?: string }[] | undefined, hasProductionData: boolean): Set<WorkflowGroup> {
  const groups = new Set<WorkflowGroup>();
  for (const node of nodes ?? []) {
    if (!node.type || WORKFLOW_SECTION_EXCLUDED_TYPES.has(node.type)) continue;
    const group = WORKFLOW_GROUP_BY_TYPE[node.type];
    if (group) groups.add(group);
  }
  if (hasProductionData) groups.add('production');
  return groups;
}

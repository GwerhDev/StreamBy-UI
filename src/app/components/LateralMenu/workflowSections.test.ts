import { describe, expect, it } from 'vitest';
import { activeWorkflowGroupsOf } from './workflowSections';

describe('activeWorkflowGroupsOf', () => {
  it('shows a section per group with a node on the canvas', () => {
    expect([...activeWorkflowGroupsOf([{ type: 'shotNode' }, { type: 'reviewGateNode' }], false)].sort()).toEqual(['production', 'review']);
  });

  it("doesn't count the nodes drawn for pipelines and exports", () => {
    expect(activeWorkflowGroupsOf([{ type: 'pipelineRefNode' }, { type: 'exportNode' }], false).size).toBe(0);
  });

  it('shows Production whenever the project has production data, node or not', () => {
    expect([...activeWorkflowGroupsOf(undefined, true)]).toEqual(['production']);
    expect([...activeWorkflowGroupsOf([], false)]).toEqual([]);
  });
});

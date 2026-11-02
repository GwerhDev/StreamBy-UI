import { describe, expect, it } from 'vitest';
import { activeWorkflowGroupsOf } from './workflowSections';

describe('activeWorkflowGroupsOf', () => {
  it('shows a section per group with a node on the canvas', () => {
    expect([...activeWorkflowGroupsOf([{ type: 'colorGradeNode' }, { type: 'reviewGateNode' }])].sort()).toEqual(['process', 'review']);
  });

  it("doesn't count the nodes drawn for pipelines and exports", () => {
    expect(activeWorkflowGroupsOf([{ type: 'pipelineRefNode' }, { type: 'exportNode' }]).size).toBe(0);
  });

  it('shows nothing for an empty or missing canvas', () => {
    expect(activeWorkflowGroupsOf(undefined).size).toBe(0);
    expect(activeWorkflowGroupsOf([]).size).toBe(0);
  });
});

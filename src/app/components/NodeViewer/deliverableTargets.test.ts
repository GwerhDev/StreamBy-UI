import { describe, expect, it } from 'vitest';
import { fromTarget, targetLabel, targetOf, targetOptions } from './deliverableTargets';

const EXPORTS = [{ id: 'e1', name: 'Site' }];

describe("a Deliverable node's target", () => {
  it('is all of them by default, or its shots, its exports or one export', () => {
    expect(targetOf({})).toBe('all');
    expect(targetOf({ appliesTo: 'everything' })).toBe('all');
    expect(targetOf({ appliesTo: 'shots', exportId: 'e1' })).toBe('shots');
    expect(targetOf({ appliesTo: 'exports' })).toBe('exports');
    expect(targetOf({ appliesTo: 'exports', exportId: 'e1' })).toBe('export:e1');
  });

  it('goes back to what the node keeps', () => {
    for (const target of ['all', 'shots', 'exports', 'export:e1']) expect(targetOf(fromTarget(target))).toBe(target);
    expect(fromTarget('export:e1')).toEqual({ appliesTo: 'exports', exportId: 'e1' });
    expect(fromTarget('shots')).toEqual({ appliesTo: 'shots', exportId: '' });
  });

  it("offers each of the project's exports, and names one gone", () => {
    expect(targetOptions(EXPORTS).map(o => o.label)).toEqual(['Every deliverable', "Shots' deliverables", "Exports' deliverables", "Site's deliverables"]);
    expect(targetLabel('export:e1', EXPORTS)).toBe("Site's deliverables");
    expect(targetLabel('export:gone', EXPORTS)).toBe("An export's deliverables");
  });
});

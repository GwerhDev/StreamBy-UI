import { describe, expect, it } from 'vitest';
import { completedByText, stepPanelKind, workerValue } from './pipelineSteps';

const MEMBERS = [{ userId: 'u1', username: 'ada', role: 'admin', status: 'active' as const }];
const TEAMS = [{ id: 'tm1', name: 'Artists', members: [], createdAt: '', updatedAt: '' }];

describe("a pipeline's steps", () => {
  it('take settings as steps done by people, by a worker, or a deliverable; the rest pass', () => {
    expect(['meetingNode', 'tasksNode', 'reviewGateNode'].map(stepPanelKind)).toEqual(['people', 'people', 'people']);
    expect(stepPanelKind('lodNode')).toBe('worker');
    expect(stepPanelKind('deliverableNode')).toBe('deliverable');
    expect(stepPanelKind('shotNode')).toBeNull();
    expect(stepPanelKind(undefined)).toBeNull();
  });

  it('say who completes them: their people and teams by name, or their worker', () => {
    expect(completedByText({ userIds: ['u1', 'gone'], teamIds: ['tm1'] }, MEMBERS, TEAMS)).toBe('ada, Someone, Artists');
    expect(completedByText({ userIds: [], teamIds: [] }, MEMBERS, TEAMS)).toBe('Nobody assigned');
    expect(completedByText({ worker: 'Blender LOD', kind: 'lod' }, MEMBERS, TEAMS)).toBe('Blender LOD (lod)');
    expect(completedByText(null, MEMBERS, TEAMS)).toBeNull();
  });

  it('read a worker as a select value', () => {
    expect(workerValue({ source: 'builtin', id: 'blender' })).toBe('builtin:blender');
    expect(workerValue(null)).toBe('');
  });
});

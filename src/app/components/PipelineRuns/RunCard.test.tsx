import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RunCard } from './RunCard';
import { PipelineRun } from '../../../interfaces';

const RUN: PipelineRun = {
  id: 'r1', projectId: 'p1', pipelineId: 'pl1', shotId: 's1', trigger: 'card_linked', status: 'running', startedBy: 'u1',
  card: { id: 's1', name: 'Rock', key: 'WOG-3' }, current: ['model'], createdAt: '', updatedAt: '',
  steps: [
    { nodeId: 'plan', type: 'meetingNode', label: 'Planning', kind: 'meeting', status: 'done', reason: null, jobId: null, deliverableId: null, completedBy: { userIds: ['u1'], teamIds: [] } },
    { nodeId: 'model', type: 'tasksNode', label: 'Modeling', kind: 'tasks', status: 'active', reason: '1 of 2 tasks open', jobId: null, deliverableId: null, completedBy: { userIds: [], teamIds: ['tm1'] } },
    { nodeId: 'lod', type: 'lodNode', label: 'LODs', kind: 'worker', status: 'waiting', reason: 'Waiting for: Modeling', jobId: null, deliverableId: null, completedBy: { worker: 'Blender LOD', kind: 'lod' } },
  ],
};
const MEMBERS = [{ userId: 'u1', username: 'ada', role: 'admin', status: 'active' as const }];
const TEAMS = [{ id: 'tm1', name: 'Artists', members: [], createdAt: '', updatedAt: '' }];

describe('RunCard', () => {
  it('says what it is of, how it started, where it is now, and each step: who completes it and what it waits on', () => {
    render(<RunCard run={RUN} members={MEMBERS} teams={TEAMS} title="WOG-3 · Rock" />);
    expect(screen.getByText('WOG-3 · Rock')).toBeInTheDocument();
    expect(screen.getByText(/Started when linked/)).toBeInTheDocument();
    expect(screen.getByText('Modeling', { selector: 'strong' })).toBeInTheDocument();

    const plan = within(screen.getByTestId('step-plan'));
    expect(plan.getByText('Done')).toBeInTheDocument();
    expect(plan.getByTitle('Who completes it')).toHaveTextContent('ada');
    const model = within(screen.getByTestId('step-model'));
    expect(model.getByText('In progress')).toBeInTheDocument();
    expect(model.getByText('1 of 2 tasks open')).toBeInTheDocument();
    expect(model.getByTitle('Who completes it')).toHaveTextContent('Artists');
    const lod = within(screen.getByTestId('step-lod'));
    expect(lod.getByTitle('Who completes it')).toHaveTextContent('Blender LOD (lod)');
    expect(lod.getByText('Waiting for: Modeling')).toBeInTheDocument();
  });

  it("doesn't repeat what a done step waited on", () => {
    const done = { ...RUN, status: 'completed' as const, current: [], steps: [{ ...RUN.steps[1], status: 'done' as const, reason: 'stale' }] };
    render(<RunCard run={done} members={MEMBERS} teams={TEAMS} title="Rock" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('stale')).not.toBeInTheDocument();
    expect(screen.queryByText(/Now:/)).not.toBeInTheDocument();
  });
});

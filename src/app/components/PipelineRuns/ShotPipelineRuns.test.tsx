import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShotPipelineRuns } from './ShotPipelineRuns';
import pipelineRunsReducer from '../../../store/pipelineRunsSlice';
import * as pipelines from '../../../services/pipelines';
import * as teams from '../../../services/teams';
import { PipelineRun } from '../../../interfaces';

const RUN: PipelineRun = {
  id: 'r1', projectId: 'p1', pipelineId: 'pl1', shotId: 's1', trigger: 'manual', status: 'running', startedBy: 'u1',
  card: { id: 's1', name: 'Rock', key: 'WOG-1' }, current: [], steps: [], createdAt: '', updatedAt: '',
};
const PIPELINES = [{ id: 'pl1', name: 'Props', order: 0 }];

const renderRuns = (props: { pipelineId?: string | null; canRun?: boolean } = {}) => {
  const store = configureStore({
    reducer: {
      pipelineRuns: pipelineRunsReducer,
      currentProject: () => ({ data: { members: [] } }),
      apiResponses: (state = { responses: [] as { message: string; type: string }[] }, action: { type: string; payload?: { message: string; type: string } }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload!] } : state),
    },
  });
  render(
    <Provider store={store}>
      <ShotPipelineRuns projectId="p1" shotId="s1" pipelineId={props.pipelineId === undefined ? 'pl1' : props.pipelineId} pipelines={PIPELINES} canRun={props.canRun ?? true} />
    </Provider>,
  );
  return store;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(teams, 'getTeams').mockResolvedValue([]);
});

describe('ShotPipelineRuns', () => {
  it("starts a card's run by hand, told, and reads its runs again", async () => {
    const list = vi.spyOn(pipelines, 'listShotPipelineRuns').mockResolvedValue([]);
    const start = vi.spyOn(pipelines, 'startPipelineRun').mockResolvedValue(RUN);
    const store = renderRuns();
    const user = userEvent.setup();
    expect(await screen.findByText('No run of Props going.')).toBeInTheDocument();
    list.mockResolvedValue([RUN]);
    await user.click(screen.getByRole('button', { name: 'Start run' }));
    expect(start).toHaveBeenCalledWith('p1', 'pl1', 's1');
    await waitFor(() => expect(store.getState().apiResponses.responses).toContainEqual({ message: 'Run started.', type: 'success' }));
    // Its run going: it's shown, by its pipeline, and there's nothing to start.
    expect(await screen.findByText('Props')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start run' })).not.toBeInTheDocument();
  });

  it("says why a run couldn't start", async () => {
    vi.spyOn(pipelines, 'listShotPipelineRuns').mockResolvedValue([]);
    vi.spyOn(pipelines, 'startPipelineRun').mockRejectedValue(new Error('The shot already has a run of this pipeline going'));
    const store = renderRuns();
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Start run' }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toContainEqual({ message: 'The shot already has a run of this pipeline going', type: 'error' }));
  });

  it("isn't started by whoever can't run jobs, and shows nothing for a card in no pipeline with no runs", async () => {
    const list = vi.spyOn(pipelines, 'listShotPipelineRuns').mockResolvedValue([]);
    renderRuns({ canRun: false });
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Start run' })).not.toBeInTheDocument();
  });

  it('shows the runs of a card no longer in a pipeline', async () => {
    vi.spyOn(pipelines, 'listShotPipelineRuns').mockResolvedValue([{ ...RUN, status: 'cancelled' }]);
    renderRuns({ pipelineId: null });
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
  });
});

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PipelineRunsView } from './PipelineRunsView';
import pipelineRunsReducer, { pipelineRunEventReceived } from '../../../store/pipelineRunsSlice';
import * as pipelines from '../../../services/pipelines';
import * as teams from '../../../services/teams';
import { Pipeline, PipelineRun } from '../../../interfaces';

const PIPELINE: Pipeline = { id: 'pl1', projectId: 'p1', name: 'Props', order: 0, triggers: ['card_linked'], createdBy: 'u1', createdAt: '', updatedAt: '' };
const run = (id: string, card: string): PipelineRun => ({
  id, projectId: 'p1', pipelineId: 'pl1', shotId: id, trigger: 'manual', status: 'running', startedBy: 'u1',
  card: { id, name: card, key: `WOG-${id}` }, current: [], steps: [], createdAt: '', updatedAt: '',
});

const renderView = (canEdit = true) => {
  const store = configureStore({
    reducer: {
      pipelineRuns: pipelineRunsReducer,
      currentProject: () => ({ data: { members: [] } }),
      currentPipeline: (state = null as unknown, action: { type: string; payload?: unknown }) => (action.type === 'currentPipeline/setCurrentPipeline' ? action.payload : state),
      apiResponses: (state = { responses: [] as { message: string; type: string }[] }, action: { type: string; payload?: { message: string; type: string } }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload!] } : state),
    },
  });
  render(<Provider store={store}><PipelineRunsView projectId="p1" pipeline={PIPELINE} canEdit={canEdit} /></Provider>);
  return store;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(teams, 'getTeams').mockResolvedValue([]);
});

describe('PipelineRunsView', () => {
  it('lists its runs by card, and reads them again on each change the websocket tells', async () => {
    const list = vi.spyOn(pipelines, 'listPipelineRuns').mockResolvedValue([run('1', 'Rock')]);
    const store = renderView();
    expect(await screen.findByText('WOG-1 · Rock')).toBeInTheDocument();
    list.mockResolvedValue([run('2', 'Tree'), run('1', 'Rock')]);
    act(() => { store.dispatch(pipelineRunEventReceived()); });
    expect(await screen.findByText('WOG-2 · Tree')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('shows the empty background with no runs', async () => {
    vi.spyOn(pipelines, 'listPipelineRuns').mockResolvedValue([]);
    renderView();
    expect(await screen.findByText('Emptiness is filling me')).toBeInTheDocument();
  });

  it('saves each change to its triggers by itself, told; and puts it back when it fails', async () => {
    vi.spyOn(pipelines, 'listPipelineRuns').mockResolvedValue([]);
    const update = vi.spyOn(pipelines, 'updatePipeline').mockResolvedValue({ ...PIPELINE, triggers: ['card_linked', 'card_done'] });
    const store = renderView();
    const user = userEvent.setup();
    expect(screen.getByLabelText('A card is linked to it')).toBeChecked();
    await user.click(screen.getByLabelText('A card is done'));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 'pl1', { triggers: ['card_linked', 'card_done'] }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toContainEqual({ message: 'Triggers saved.', type: 'success' }));
    expect(store.getState().currentPipeline).toMatchObject({ triggers: ['card_linked', 'card_done'] });

    update.mockRejectedValue(new Error('Nope'));
    await user.click(screen.getByLabelText('A card is linked to it'));
    await waitFor(() => expect(store.getState().apiResponses.responses).toContainEqual({ message: 'Nope', type: 'error' }));
    expect(screen.getByLabelText('A card is linked to it')).toBeChecked();
    expect(screen.getByLabelText('A card is done')).toBeChecked();
  });

  it("doesn't let its triggers change for whoever can't change the workflow", async () => {
    vi.spyOn(pipelines, 'listPipelineRuns').mockResolvedValue([]);
    renderView(false);
    const triggers = screen.getByRole('group', { name: "Start a card's run when" });
    for (const box of within(triggers).getAllByRole('checkbox')) expect(box).toBeDisabled();
  });
});

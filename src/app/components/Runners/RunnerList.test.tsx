import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RunnerList } from './RunnerList';
import * as runnersService from '../../../services/workerRunners';
import * as teamsService from '../../../services/teams';
import { renderAt } from '../../../test/apiTokens';
import { WorkerRunner } from '../../../interfaces';

const runner = (over: Partial<WorkerRunner> = {}): WorkerRunner => ({
  id: 'a1', name: 'Studio workstation', prefix: 'sbr_abcd1234', kinds: ['gltf-optimize', 'lod'], categories: ['3d-models'],
  online: true, lastSeenAt: '2026-11-09T10:00:00Z', createdAt: '2026-11-01T00:00:00Z', shares: [], ...over,
});
const Where = () => <p data-testid="location">{useLocation().pathname}</p>;
const page = <Routes><Route path="*" element={<><RunnerList /><Where /></>} /></Routes>;

beforeEach(() => vi.restoreAllMocks());

describe('RunnerList', () => {
  it("lists the user's runners: online or not, what each said it does, where it's shared, never more than its prefix", async () => {
    vi.spyOn(runnersService, 'getWorkerRunners').mockResolvedValue([
      runner({ shares: [{ id: 's1', projectId: 'p1', projectName: 'Alpha', teamId: 't1', teamName: 'Lighting' }] }),
      runner({ id: 'a2', name: 'Cloud box', online: false, lastSeenAt: null, kinds: [], categories: [] }),
    ]);
    renderAt('/user/runners', page);
    const studio = await screen.findByTestId('runner-a1');
    expect(studio).toHaveTextContent('sbr_abcd1234…');
    expect(screen.getByTestId('runner-state-a1')).toHaveTextContent('Online');
    expect(studio).toHaveTextContent('gltf-optimize, lod');
    expect(studio).toHaveTextContent('Alpha · Lighting');
    expect(screen.getByTestId('runner-state-a2')).toHaveTextContent('Never connected');
    expect(screen.getByTestId('runner-a2')).toHaveTextContent('Not said yet');
  });

  it('shares one with a project, or only with one of its teams', async () => {
    vi.spyOn(runnersService, 'getWorkerRunners').mockResolvedValue([runner()]);
    vi.spyOn(teamsService, 'getTeams').mockResolvedValue([{ id: 't1', name: 'Lighting', members: [], createdAt: '', updatedAt: '' }]);
    const share = vi.spyOn(runnersService, 'shareWorkerRunner').mockResolvedValue({ id: 's1', projectId: 'p1', projectName: 'Alpha', teamId: 't1', teamName: 'Lighting' });
    const store = renderAt('/user/runners', page);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Share with a project' }));
    const modal = screen.getByText('Share Studio workstation').closest('div')!.parentElement!;
    expect(within(modal).getByRole('button', { name: 'Share' })).toBeDisabled();
    await user.click(within(modal).getByRole('button', { name: 'Choose a project' }));
    fireEvent.mouseDown(screen.getByText('Alpha'));
    await user.click(await within(modal).findByRole('button', { name: 'The whole project' }));
    fireEvent.mouseDown(await screen.findByText('Team Lighting'));
    await user.click(within(modal).getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith('a1', 'p1', 't1'));
    expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'Studio workstation shared.', type: 'success' })]);
  });

  it('stops sharing one, and revokes one once confirmed', async () => {
    const list = vi.spyOn(runnersService, 'getWorkerRunners').mockResolvedValue([
      runner({ shares: [{ id: 's1', projectId: 'p1', projectName: 'Alpha', teamId: null, teamName: null }] }),
    ]);
    const unshare = vi.spyOn(runnersService, 'unshareWorkerRunner').mockResolvedValue();
    const revoke = vi.spyOn(runnersService, 'revokeWorkerRunner').mockResolvedValue();
    renderAt('/user/runners', page);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Stop sharing with Alpha' }));
    await waitFor(() => expect(unshare).toHaveBeenCalledWith('a1', 's1'));

    await user.click(screen.getByRole('button', { name: 'Revoke Studio workstation' }));
    expect(screen.getByText(/its jobs, queued or running, fail/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Revoke$/ }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('a1'));
    expect(list.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('opens the form to register one', async () => {
    vi.spyOn(runnersService, 'getWorkerRunners').mockResolvedValue([]);
    renderAt('/user/runners', page);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Register a runner/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/user/runners/create');
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkerList } from './WorkerList';
import * as workers from '../../../services/workers';
import { renderAt, worker } from '../../../test/workers';

const ROUTE = '/project/:id/workers';
beforeEach(() => vi.restoreAllMocks());

describe('WorkerList', () => {
  // The menu and the page ask for the workers at once: the second is skipped, which isn't a failure.
  it('tells nothing when a load already under way skips its own, and tells a real failure', async () => {
    vi.spyOn(workers, 'getWorkers').mockResolvedValue([worker()]);
    const store = renderAt('/project/p1/workers', ROUTE, <><WorkerList /><WorkerList /></>);
    await screen.findAllByTestId('worker-gltf');
    expect(store.getState().apiResponses.responses).toEqual([]);

    vi.spyOn(workers, 'getWorkers').mockRejectedValue(new Error('StreamBy is down'));
    const failing = renderAt('/project/p2/workers', ROUTE, <WorkerList />);
    await waitFor(() => expect(failing.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'StreamBy is down', type: 'error' })]));
  });

  it("lists the host's workers and the project's, with what they do", async () => {
    vi.spyOn(workers, 'getWorkers').mockResolvedValue([
      worker(), worker({ source: 'project', id: 'w2', name: 'Own LOD', kinds: ['lod'], autoKind: 'lod' }),
    ]);
    renderAt('/project/p1/workers', ROUTE, <WorkerList />);
    const host = await screen.findByTestId('worker-gltf');
    expect(host).toHaveTextContent('Host');
    expect(host).toHaveTextContent('gltf-optimize, lod · 3d-models');
    expect(screen.getByTestId('worker-w2')).toHaveTextContent('runs lod on deliverables');
    // Only the project's own can be removed here.
    expect(screen.queryByRole('button', { name: 'Remove glTF optimizer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Own LOD' })).toBeInTheDocument();
  });

  it("removes one of the project's once confirmed", async () => {
    const list = vi.spyOn(workers, 'getWorkers').mockResolvedValue([worker({ source: 'project', id: 'w2', name: 'Own LOD' })]);
    const remove = vi.spyOn(workers, 'deleteWorker').mockResolvedValue({});
    renderAt('/project/p1/workers', ROUTE, <WorkerList />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Remove Own LOD' }));
    list.mockResolvedValue([]);
    await user.click(screen.getByRole('button', { name: /^Remove$/ }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('p1', 'w2'));
    await waitFor(() => expect(screen.queryByTestId('worker-w2')).not.toBeInTheDocument());
  });

  it('connects a new one on its own page', async () => {
    vi.spyOn(workers, 'getWorkers').mockResolvedValue([]);
    renderAt('/project/p1/workers', ROUTE, <WorkerList />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Connect a worker/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/workers/create');
  });
});

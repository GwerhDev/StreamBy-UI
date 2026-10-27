import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateWorkerForm } from './CreateWorkerForm';
import * as workers from '../../../services/workers';
import { renderAt, worker } from '../../../test/workers';
import { fetchWorkers } from '../../../store/workersSlice';

beforeEach(() => vi.restoreAllMocks());

describe('CreateWorkerForm', () => {
  it('connects a worker with what it does and takes, and goes back to the list', async () => {
    const create = vi.spyOn(workers, 'createWorker').mockResolvedValue(worker({ source: 'project', id: 'w9' }));
    vi.spyOn(workers, 'getWorkers').mockResolvedValue([worker()]);
    const store = renderAt('/project/p1/workers/create', '/project/:id/workers/create', <CreateWorkerForm />);
    // The list the menu shows, loaded already.
    await store.dispatch(fetchWorkers('p1'));
    const user = userEvent.setup();
    const submit = screen.getByRole('button', { name: /Connect$/ });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'Optimizer');
    await user.type(screen.getByLabelText('Endpoint (https)'), 'https://worker.example.com/jobs');
    await user.type(screen.getByLabelText(/Credential/), 'secret');
    await user.type(screen.getByLabelText(/What it does/), 'gltf-optimize, lod');
    await user.click(screen.getByLabelText('3D models'));
    await user.click(screen.getByRole('button', { name: 'Do nothing by itself' }));
    fireEvent.mouseDown(screen.getByText('Run lod'));
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', {
      name: 'Optimizer', endpoint: 'https://worker.example.com/jobs', kinds: ['gltf-optimize', 'lod'],
      categories: ['3d-models'], autoKind: 'lod', credential: 'secret',
    }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/workers');
    expect(store.getState().workers.list?.map(w => w.id)).toEqual(['gltf', 'w9']);
  });
});

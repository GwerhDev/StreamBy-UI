import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetJobs } from './AssetJobs';
import currentJob from '../../../store/currentJobSlice';
import * as workers from '../../../services/workers';
import { job, worker } from '../../../test/workers';

const renderJobs = (category: 'images' | '3d-models' = '3d-models') => {
  const store = configureStore({ reducer: { currentJob, apiResponses: (state = { responses: [] as unknown[] }) => state } });
  render(<Provider store={store}><AssetJobs projectId="p1" assetId="a1" category={category} /></Provider>);
  return store;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(workers, 'getWorkers').mockResolvedValue([worker(), worker({ id: 'img', name: 'Images', categories: ['images'] })]);
});

describe('AssetJobs', () => {
  it("shows the asset's jobs, kept by StreamBy: in progress, failed and done with their report", async () => {
    const list = vi.spyOn(workers, 'getJobs').mockResolvedValue([
      job({ jobId: 'running' }),
      job({ jobId: 'broken', status: 'failed', error: 'Draco decoder crashed', createdAt: '2026-10-26T09:00:00Z' }),
      job({ jobId: 'ok', status: 'completed', progress: 100, report: { sizeAfter: 400, ratio: 0.4 }, result: { assetId: 'a2', versionId: 'v1', mode: 'derived' }, createdAt: '2026-10-26T08:00:00Z' }),
    ]);
    renderJobs();
    expect(await screen.findByTestId('job-running')).toHaveTextContent('accepted · 40%');
    expect(list).toHaveBeenCalledWith('p1', 'a1');
    expect(screen.getByTestId('job-broken')).toHaveTextContent('Draco decoder crashed');
    const ok = screen.getByTestId('job-ok');
    expect(ok).toHaveTextContent('Saved as a new asset');
    expect(ok).toHaveTextContent('sizeAfter');
    expect(ok).toHaveTextContent('400');
  });

  it('asks a worker that takes the asset to process it', async () => {
    vi.spyOn(workers, 'getJobs').mockResolvedValue([]);
    const process = vi.spyOn(workers, 'processAsset').mockResolvedValue(job({ jobId: 'new', status: 'pending', stage: 'queued', progress: 0 }));
    renderJobs();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Process with a worker/ }));
    // Only the workers that take 3D models.
    expect(screen.getByRole('button', { name: 'glTF optimizer (host)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'gltf-optimize' }));
    fireEvent.mouseDown(screen.getByText('lod'));
    await user.click(screen.getByRole('button', { name: /^As a new asset/ }));
    fireEvent.mouseDown(screen.getByText(/new version/));
    await user.click(screen.getByRole('button', { name: /^Process$/ }));
    await waitFor(() => expect(process).toHaveBeenCalledWith('p1', {
      assetId: 'a1', worker: { source: 'builtin', id: 'gltf' }, kind: 'lod', resultMode: 'version',
    }));
    expect(await screen.findByTestId('job-new')).toHaveTextContent('Queued');
  });

  it('retries a failed job', async () => {
    vi.spyOn(workers, 'getJobs').mockResolvedValue([job({ status: 'failed', error: 'Timed out' })]);
    const retry = vi.spyOn(workers, 'retryJob').mockResolvedValue(job({ status: 'pending', stage: 'queued', error: null }));
    renderJobs();
    await userEvent.setup().click(await screen.findByRole('button', { name: /Retry/ }));
    await waitFor(() => expect(retry).toHaveBeenCalledWith('p1', 'j1'));
    expect(await screen.findByText('Queued')).toBeInTheDocument();
  });

  it('says how to get a worker when none takes the asset', async () => {
    vi.spyOn(workers, 'getWorkers').mockResolvedValue([worker()]);
    vi.spyOn(workers, 'getJobs').mockResolvedValue([]);
    renderJobs('images');
    expect(await screen.findByText(/No worker takes this kind of asset/)).toBeInTheDocument();
  });
});

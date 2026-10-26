import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobMonitor } from './JobMonitor';
import * as workers from '../../../services/workers';
import { job, renderAt } from '../../../test/workers';

beforeEach(() => vi.restoreAllMocks());

describe('JobMonitor', () => {
  it("lists the project's kept jobs, and only its own", async () => {
    const list = vi.spyOn(workers, 'getJobs').mockResolvedValue([job(), job({ jobId: 'j2', projectId: 'other', kind: 'elsewhere' })]);
    renderAt('/project/p1/workflow/jobs', '/project/:id/workflow/jobs', <JobMonitor />);
    expect(await screen.findByText('gltf-optimize · glTF optimizer')).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith('p1');
    expect(screen.queryByText(/elsewhere/)).not.toBeInTheDocument();
  });

  it('retries a failed worker job', async () => {
    vi.spyOn(workers, 'getJobs').mockResolvedValue([job({ status: 'failed', error: 'The worker answered 503' })]);
    const retry = vi.spyOn(workers, 'retryJob').mockResolvedValue(job({ status: 'pending', error: null }));
    renderAt('/project/p1/workflow/jobs', '/project/:id/workflow/jobs', <JobMonitor />);
    expect(await screen.findByText(/answered 503/)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Retry/ }));
    await waitFor(() => expect(retry).toHaveBeenCalledWith('p1', 'j1'));
  });

  it('says when there are none', async () => {
    vi.spyOn(workers, 'getJobs').mockResolvedValue([]);
    renderAt('/project/p1/workflow/jobs', '/project/:id/workflow/jobs', <JobMonitor />);
    expect(await screen.findByText(/No jobs yet/)).toBeInTheDocument();
  });
});

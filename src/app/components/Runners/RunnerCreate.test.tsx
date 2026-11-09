import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RunnerCreate } from './RunnerCreate';
import * as runnersService from '../../../services/workerRunners';
import { renderAt } from '../../../test/apiTokens';

const Where = () => <p data-testid="location">{useLocation().pathname}</p>;

beforeEach(() => vi.restoreAllMocks());

describe('registering a runner', () => {
  it('registers it by its name, shows its token once with what to do next, and goes back to the list', async () => {
    const register = vi.spyOn(runnersService, 'registerWorkerRunner').mockResolvedValue({
      token: 'sbr_the-secret',
      runner: { id: 'a1', name: 'Studio', prefix: 'sbr_the-sec', kinds: [], categories: [], online: false, lastSeenAt: null, createdAt: '', shares: [] },
    });
    renderAt('/user/runners/create', <><RunnerCreate /><Where /></>);
    const user = userEvent.setup();
    const submit = within(screen.getByTestId('runner-form')).getByRole('button', { name: /Register/ });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), 'Studio');
    await user.click(submit);

    await waitFor(() => expect(register).toHaveBeenCalledWith('Studio'));
    expect(await screen.findByTestId('runner-token-value')).toHaveTextContent('sbr_the-secret');
    expect(screen.getByTestId('runner-token-created')).toHaveTextContent('/streamby/runner/jobs/next');
    expect(screen.getByTestId('runner-token-created')).toHaveTextContent('until then, it gets no jobs');
    await user.click(screen.getByRole('button', { name: /Done/ }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/user\/runners$/);
  });

  it('tells why it could not register it', async () => {
    vi.spyOn(runnersService, 'registerWorkerRunner').mockRejectedValue(new Error('A runner needs a name'));
    const store = renderAt('/user/runners/create', <RunnerCreate />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'x');
    await user.click(screen.getByRole('button', { name: /Register/ }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'A runner needs a name', type: 'error' })]));
    expect(screen.queryByTestId('runner-token-created')).not.toBeInTheDocument();
  });
});

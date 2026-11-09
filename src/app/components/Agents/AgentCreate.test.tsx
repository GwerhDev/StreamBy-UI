import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentCreate } from './AgentCreate';
import * as agentsService from '../../../services/workerAgents';
import { renderAt } from '../../../test/apiTokens';

const Where = () => <p data-testid="location">{useLocation().pathname}</p>;

beforeEach(() => vi.restoreAllMocks());

describe('registering an agent', () => {
  it('registers it by its name, shows its token once with what to do next, and goes back to the list', async () => {
    const register = vi.spyOn(agentsService, 'registerWorkerAgent').mockResolvedValue({
      token: 'sba_the-secret',
      agent: { id: 'a1', name: 'Studio', prefix: 'sba_the-sec', kinds: [], categories: [], online: false, lastSeenAt: null, createdAt: '', shares: [] },
    });
    renderAt('/user/agents/create', <><AgentCreate /><Where /></>);
    const user = userEvent.setup();
    const submit = within(screen.getByTestId('agent-form')).getByRole('button', { name: /Register/ });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), 'Studio');
    await user.click(submit);

    await waitFor(() => expect(register).toHaveBeenCalledWith('Studio'));
    expect(await screen.findByTestId('agent-token-value')).toHaveTextContent('sba_the-secret');
    expect(screen.getByTestId('agent-token-created')).toHaveTextContent('/streamby/worker-agent/jobs/next');
    expect(screen.getByTestId('agent-token-created')).toHaveTextContent('until then, it gets no jobs');
    await user.click(screen.getByRole('button', { name: /Done/ }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/user\/agents$/);
  });

  it('tells why it could not register it', async () => {
    vi.spyOn(agentsService, 'registerWorkerAgent').mockRejectedValue(new Error('An agent needs a name'));
    const store = renderAt('/user/agents/create', <AgentCreate />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Name'), 'x');
    await user.click(screen.getByRole('button', { name: /Register/ }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ message: 'An agent needs a name', type: 'error' })]));
    expect(screen.queryByTestId('agent-token-created')).not.toBeInTheDocument();
  });
});

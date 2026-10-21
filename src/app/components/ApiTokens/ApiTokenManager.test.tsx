import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiTokenManager } from './ApiTokenManager';
import * as apiTokensService from '../../../services/apiTokens';
import { ApiToken } from '../../../interfaces';

const PROJECTS = [
  { id: 'p1', name: 'Alpha', archived: false },
  { id: 'p2', name: 'Beta', archived: false },
];
const token = (over: Partial<ApiToken>): ApiToken => ({
  id: 't1', name: 'Laptop', prefix: 'sbt_abcd1234', access: 'read', projectIds: ['p1'],
  createdAt: '2026-10-01T00:00:00Z', expiresAt: '2026-10-31T00:00:00Z', lastUsedAt: null, ...over,
});

const makeStore = () => configureStore({
  reducer: {
    session: () => ({ logged: true, loader: false, username: 'eli' }),
    projects: () => ({ list: PROJECTS, loading: false, error: null }),
    apiResponses: (state = { responses: [] as unknown[], nextId: 0 }, action: { type: string; payload?: unknown }) =>
      (action.type === 'apiResponses/addApiResponse' ? { ...state, responses: [...state.responses, action.payload] } : state),
  },
});

const renderManager = (projectId?: string) => {
  const store = makeStore();
  render(<Provider store={store}><ApiTokenManager projectId={projectId} /></Provider>);
  return store;
};

beforeEach(() => vi.restoreAllMocks());

describe('ApiTokenManager', () => {
  it("lists the user's tokens, never more than their prefix", async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([
      token({}), token({ id: 't2', name: 'CI', access: 'write', projectIds: '*', expiresAt: null }),
    ]);
    renderManager();
    const laptop = await screen.findByTestId('api-token-t1');
    expect(laptop).toHaveTextContent('Laptop');
    expect(laptop).toHaveTextContent('sbt_abcd1234…');
    expect(laptop).toHaveTextContent('Read only');
    expect(laptop).toHaveTextContent('Alpha');
    expect(laptop).toHaveTextContent('Never used');
    const ci = screen.getByTestId('api-token-t2');
    expect(ci).toHaveTextContent('Read and write');
    expect(ci).toHaveTextContent('All my projects');
    expect(ci).toHaveTextContent('No expiration');
  });

  it("within a project, shows only the tokens that reach it", async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([
      token({ id: 'a', projectIds: ['p1'] }), token({ id: 'b', projectIds: ['p2'] }), token({ id: 'c', projectIds: '*' }),
    ]);
    renderManager('p1');
    await screen.findByTestId('api-token-a');
    expect(screen.queryByTestId('api-token-b')).not.toBeInTheDocument();
    expect(screen.getByTestId('api-token-c')).toBeInTheDocument();
  });

  it('without tokens, offers making one in the header and says there are none', async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([]);
    renderManager();
    expect(await screen.findByTestId('api-token-empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New token/ })).toBeInTheDocument();
    expect(screen.queryByTestId('api-token-new')).not.toBeInTheDocument();
  });

  it('with tokens, offers making one at the end of the list instead', async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([token({})]);
    renderManager();
    expect(await screen.findByTestId('api-token-new')).toBeInTheDocument();
    expect(screen.queryByTestId('api-token-empty')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New token/ })).not.toBeInTheDocument();
  });

  it('makes a token with what was chosen, and shows it once', async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([]);
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_the-secret', apiToken: token({}) });
    renderManager();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /New token/ }));
    const form = screen.getByTestId('api-token-form');
    const submit = within(form).getByRole('button', { name: /Create token/ });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'Claude Code');
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText('Beta'));
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Claude Code', access: 'read', projectIds: ['p2'], expiresInDays: 30 }));
    expect(await screen.findByTestId('api-token-value')).toHaveTextContent('sbt_the-secret');
    await user.click(screen.getByRole('button', { name: /Done/ }));
    expect(screen.queryByText('sbt_the-secret')).not.toBeInTheDocument();
  });

  it('a token for all projects', async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([]);
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_x', apiToken: token({}) });
    renderManager();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /New token/ }));
    await user.type(screen.getByLabelText('Name'), 'All');
    await user.click(screen.getByLabelText(/All my projects/));
    expect(screen.queryByLabelText('Alpha')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Create token/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ projectIds: '*' })));
  });

  it("within a project, a new token reaches that project", async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([]);
    const create = vi.spyOn(apiTokensService, 'createApiToken').mockResolvedValue({ token: 'sbt_x', apiToken: token({}) });
    renderManager('p1');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /New token/ }));
    await user.type(screen.getByLabelText('Name'), 'Here');
    await user.click(screen.getByRole('button', { name: /Create token/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ projectIds: ['p1'] })));
  });

  it('revokes a token only once it is confirmed', async () => {
    const list = vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([token({})]);
    const revoke = vi.spyOn(apiTokensService, 'revokeApiToken').mockResolvedValue();
    renderManager();
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('api-token-revoke-t1'));
    expect(revoke).not.toHaveBeenCalled();
    list.mockResolvedValue([]);
    await user.click(screen.getByRole('button', { name: /^Revoke$/ }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('t1'));
    await waitFor(() => expect(screen.queryByTestId('api-token-t1')).not.toBeInTheDocument());
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiTokenList } from './ApiTokenList';
import * as apiTokensService from '../../../services/apiTokens';
import { renderAt, token } from '../../../test/apiTokens';

const Where = () => <p data-testid="location">{useLocation().pathname}</p>;
const page = (projectId?: string) => (
  <Routes>
    <Route path="*" element={<><ApiTokenList projectId={projectId} /><Where /></>} />
  </Routes>
);

beforeEach(() => vi.restoreAllMocks());

describe('ApiTokenList', () => {
  it("lists the user's tokens, never more than their prefix", async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([
      token({}),
      token({ id: 't2', name: 'CI', permissions: ['assets:read', 'assets:delete'], projectIds: '*', expiresAt: null }),
    ]);
    renderAt('/user/settings/api-tokens', page());
    const laptop = await screen.findByTestId('api-token-t1');
    expect(laptop).toHaveTextContent('Laptop');
    expect(laptop).toHaveTextContent('sbt_abcd1234…');
    expect(laptop).toHaveTextContent('Alpha');
    expect(laptop).toHaveTextContent('Project · read');
    const ci = screen.getByTestId('api-token-t2');
    expect(ci).toHaveTextContent('All my projects');
    expect(ci).toHaveTextContent('Assets · read, delete');
    expect(ci).toHaveTextContent(/Expires\s*Never/);
    expect(ci).toHaveTextContent('Custom');
  });

  it("a project's: who made each one, and when they've left the project", async () => {
    const list = vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([
      token({ id: 'a', kind: 'project', createdBy: { userId: 'u9', username: 'ada', isMember: false } }),
      token({ id: 'b', kind: 'project', createdBy: { userId: 'u1', username: 'eli', isMember: true } }),
    ]);
    renderAt('/project/p1/settings/api-tokens', page('p1'));
    expect(await screen.findByTestId('api-token-a')).toHaveTextContent(/Created by\s*ada/);
    expect(list).toHaveBeenCalledWith('p1');
    expect(screen.getByTestId('api-token-creator-left-a')).toBeInTheDocument();
    expect(screen.queryByTestId('api-token-creator-left-b')).not.toBeInTheDocument();
  });

  it("a project's are for its admins only", async () => {
    const list = vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([]);
    renderAt('/project/p1/settings/api-tokens', page('p1'), { admin: 'someone-else' });
    expect(await screen.findByTestId('api-token-admins-only')).toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /New token/ })).not.toBeInTheDocument();
  });

  it('without tokens, offers making one in the header and says there are none', async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([]);
    renderAt('/user/settings/api-tokens', page());
    expect(await screen.findByTestId('api-token-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('api-token-new')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /New token/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/user/settings/api-tokens/create');
  });

  it("with tokens, offers making one at the end of the list, on its own page", async () => {
    vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([token({})]);
    renderAt('/project/p1/settings/api-tokens', page('p1'));
    await userEvent.setup().click(await screen.findByTestId('api-token-new'));
    expect(screen.queryByRole('button', { name: /New token/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/settings/api-tokens/create');
  });

  it('revokes a token only once it is confirmed', async () => {
    const list = vi.spyOn(apiTokensService, 'getApiTokens').mockResolvedValue([token({})]);
    const revoke = vi.spyOn(apiTokensService, 'revokeApiToken').mockResolvedValue();
    renderAt('/project/p1/settings/api-tokens', page('p1'));
    const user = userEvent.setup();
    await user.click(await screen.findByTestId('api-token-revoke-t1'));
    expect(revoke).not.toHaveBeenCalled();
    list.mockResolvedValue([]);
    await user.click(screen.getByRole('button', { name: /^Revoke$/ }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('t1', 'p1'));
    await waitFor(() => expect(screen.queryByTestId('api-token-t1')).not.toBeInTheDocument());
  });
});

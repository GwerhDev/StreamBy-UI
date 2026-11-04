import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectPermissions } from './ProjectPermissions';
import * as service from '../../../services/permissions';
import * as teamsService from '../../../services/teams';

const ACTIONS = ['project:update', 'teams:manage', 'docs:write', 'docs:delete'];
const APPS = ['docs:publish', 'docs:delete', 'members:manage'];
const DEFAULTS = {
  roles: { 'project:update': 'editor', 'teams:manage': 'admin', 'docs:write': 'editor', 'docs:delete': 'editor' } as const,
  teams: {} as Record<string, string[]>,
  apps: [] as string[],
};
const TEAMS = [{ id: 't1', name: 'Docs', members: [], createdAt: '', updatedAt: '' }];

const renderSection = (userId = 'u1') => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'ada', userId }),
      currentProject: () => ({ data: { id: 'p1', members: [{ userId: 'u1', role: 'admin' }, { userId: 'u2', role: 'editor' }] }, loading: false, error: null }),
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/project/p1/settings/permissions']}>
        <Routes><Route path="/project/:id/settings/permissions" element={<ProjectPermissions />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

afterEach(() => vi.restoreAllMocks());
beforeEach(() => { vi.spyOn(teamsService, 'getTeams').mockResolvedValue(TEAMS); });
const loaded = () => vi.spyOn(service, 'getProjectPermissions').mockResolvedValue({ permissions: { roles: { ...DEFAULTS.roles }, teams: {}, apps: [] }, actions: ACTIONS, appPermissions: APPS });
const choose = (action: string, label: string) => {
  fireEvent.click(within(screen.getByLabelText(`Who can: ${action}`)).getByRole('button'));
  fireEvent.mouseDown(screen.getByText(label, { selector: 'li' }));
};

// The sections start closed: open them to see what's in them.
const openAll = () => {
  for (const title of ['Roles', 'Teams', 'Connected apps']) fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${title}`) }));
};

describe('ProjectPermissions', () => {
  it("shows a skeleton while it loads, then its three sections closed, with what each role can do and what apps can", async () => {
    let answer!: (v: Awaited<ReturnType<typeof service.getProjectPermissions>>) => void;
    vi.spyOn(service, 'getProjectPermissions').mockImplementation(() => new Promise(resolve => { answer = resolve; }));
    renderSection();
    expect(screen.getByTestId('permissions-skeleton')).toBeInTheDocument();
    answer({ permissions: { roles: { ...DEFAULTS.roles }, teams: { t1: ['teams:manage'] }, apps: ['docs:publish'] }, actions: ACTIONS, appPermissions: APPS });
    const roles = await screen.findByRole('button', { name: /^Roles/ });
    for (const title of ['Roles', 'Teams', 'Connected apps']) expect(screen.getByRole('button', { name: new RegExp(`^${title}`) })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Roles' })).not.toBeInTheDocument();
    expect(roles).toBeInTheDocument();
    openAll();
    expect(within(screen.getByLabelText('Who can: Make, change and delete teams')).getByRole('button')).toHaveTextContent('Admins only');
    expect(within(screen.getByLabelText('Who can: Delete documents')).getByRole('button')).toHaveTextContent('Editors and admins');
    expect(within(screen.getByRole('list', { name: 'Connected apps' })).getByRole('checkbox', { name: 'Publish documents' })).toBeChecked();
    expect(within(screen.getByRole('list', { name: 'Connected apps' })).getByRole('checkbox', { name: 'Manage teams' })).not.toBeChecked();
    expect(within(screen.getByRole('list', { name: 'What Docs adds' })).getByRole('checkbox', { name: /Make, change and delete teams/ })).toBeChecked();
    // Nothing to save nor discard: each change saves itself.
    expect(screen.queryByRole('button', { name: /Save|Discard/ })).not.toBeInTheDocument();
  });

  it('saves each change an admin makes as it is made, and says so', async () => {
    loaded();
    const save = vi.spyOn(service, 'saveProjectPermissions').mockImplementation(async (_p, payload) => payload as never);
    const store = renderSection();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /^Roles/ });
    openAll();
    choose('Make, change and delete teams', 'Editors and admins');
    await waitFor(() => expect(save).toHaveBeenLastCalledWith('p1', { roles: { ...DEFAULTS.roles, 'teams:manage': 'editor' }, teams: {}, apps: [] }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ type: 'success', message: 'Permissions saved.' })]));
    await user.click(within(screen.getByRole('list', { name: 'Connected apps' })).getByRole('checkbox', { name: 'Delete documents' }));
    await waitFor(() => expect(save).toHaveBeenLastCalledWith('p1', { roles: { ...DEFAULTS.roles, 'teams:manage': 'editor' }, teams: {}, apps: ['docs:delete'] }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toHaveLength(2));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('a change made while one saves goes in the next save, with all made meanwhile', async () => {
    loaded();
    const answers: ((v: never) => void)[] = [];
    const save = vi.spyOn(service, 'saveProjectPermissions').mockImplementation((_p, payload) => new Promise(resolve => { answers.push(() => resolve(payload as never)); }));
    const store = renderSection();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /^Roles/ });
    openAll();
    choose('Delete documents', 'Admins only');
    // What a team adds: a change to a team, made while the first saves.
    await user.click(within(screen.getByRole('list', { name: 'What Docs adds' })).getByRole('checkbox', { name: /Delete documents/ }));
    const apps = within(screen.getByRole('list', { name: 'Connected apps' }));
    await user.click(apps.getByRole('checkbox', { name: 'Delete documents' }));
    await user.click(apps.getByRole('checkbox', { name: 'Publish documents' }));
    expect(save).toHaveBeenCalledTimes(1);
    answers[0](undefined as never);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save).toHaveBeenLastCalledWith('p1', { roles: { ...DEFAULTS.roles, 'docs:delete': 'admin' }, teams: { t1: ['docs:delete'] }, apps: ['docs:delete', 'docs:publish'] });
    answers[1](undefined as never);
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([expect.objectContaining({ type: 'success' })]));
    expect(apps.getByRole('checkbox', { name: 'Publish documents' })).toBeChecked();
  });

  it('when a save fails it says so, and shows what the project has', async () => {
    loaded();
    vi.spyOn(service, 'saveProjectPermissions').mockRejectedValue(new Error('Only a project admin can change its permissions'));
    const store = renderSection();
    await screen.findByRole('button', { name: /^Roles/ });
    openAll();
    choose('Delete documents', 'Admins only');
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ type: 'error', message: 'Only a project admin can change its permissions' }),
    ]));
    expect(within(screen.getByLabelText('Who can: Delete documents')).getByRole('button')).toHaveTextContent('Editors and admins');
  });

  it("someone who isn't an admin only sees them", async () => {
    loaded();
    const save = vi.spyOn(service, 'saveProjectPermissions');
    renderSection('u2');
    await screen.findByRole('button', { name: /^Roles/ });
    openAll();
    expect(screen.queryByLabelText('Who can: Make, change and delete teams')).not.toBeInTheDocument();
    expect(screen.getAllByText('Admins only')).toHaveLength(1);
    expect(within(screen.getByRole('list', { name: 'Connected apps' })).getByRole('checkbox', { name: 'Delete documents' })).toBeDisabled();
    expect(screen.getByText("Only the project's admins change them.")).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it("says so when they can't be loaded", async () => {
    vi.spyOn(service, 'getProjectPermissions').mockRejectedValue(new Error('nope'));
    renderSection();
    expect(await screen.findByText("The permissions couldn't be loaded.")).toBeInTheDocument();
  });
});

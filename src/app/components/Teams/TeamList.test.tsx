import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamList } from './TeamList';
import * as teamsService from '../../../services/teams';
import { Member, Team } from '../../../interfaces';

const MEMBERS: Member[] = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' },
  { userId: 'u2', username: 'eli', role: 'editor', status: 'active' },
  { userId: 'u3', username: 'vic', role: 'viewer', status: 'active' },
];
const team = (over: Partial<Team>): Team => ({
  id: 't1', name: 'Animation', members: [{ userId: 'u2', username: 'eli' }], createdAt: '', updatedAt: '', ...over,
});

const renderList = (canManage = true, isAdmin = canManage) => {
  const store = configureStore({
    reducer: {
      apiResponses: (state = { responses: [] as unknown[] }, action: { type: string; payload?: unknown }) =>
        (action.type === 'apiResponses/addApiResponse' ? { responses: [...state.responses, action.payload] } : state),
    },
  });
  render(<Provider store={store}><TeamList projectId="p1" members={MEMBERS} canManage={canManage} isAdmin={isAdmin} /></Provider>);
  return store;
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(teamsService, 'getTeams').mockResolvedValue([team({})]);
});

describe('TeamList', () => {
  it('shows each team with its members', async () => {
    renderList();
    const row = await screen.findByRole('listitem', { name: 'Animation' });
    expect(within(row).getByText('1 member')).toBeInTheDocument();
    expect(within(row).getByLabelText('eli')).toBeInTheDocument();
  });

  it('an admin makes one, of members of the project', async () => {
    const create = vi.spyOn(teamsService, 'createTeam').mockResolvedValue([team({}), team({ id: 't2', name: 'Sound', members: [{ userId: 'u1', username: 'ada' }, { userId: 'u3', username: 'vic' }] })]);
    renderList();
    const user = userEvent.setup();
    await screen.findByText('Animation');
    await user.click(screen.getByRole('button', { name: /New team/ }));
    expect(screen.getByRole('button', { name: /Create team/ })).toBeDisabled();
    await user.type(screen.getByLabelText('Name'), '  Sound ');
    await user.click(screen.getByLabelText('ada', { selector: 'input' }));
    await user.click(screen.getByLabelText('vic', { selector: 'input' }));
    await user.click(screen.getByRole('button', { name: /Create team/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith('p1', { name: 'Sound', memberIds: ['u1', 'u3'] }));
    const row = await screen.findByRole('listitem', { name: 'Sound' });
    expect(within(row).getByText('2 members')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create team/ })).not.toBeInTheDocument();
  });

  it('an admin renames one and changes its members', async () => {
    const update = vi.spyOn(teamsService, 'updateTeam').mockResolvedValue([team({ name: 'Layout', members: [] })]);
    renderList();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Edit Animation' }));
    const name = screen.getByLabelText('Name');
    expect(name).toHaveValue('Animation');
    expect(screen.getByLabelText('eli', { selector: 'input' })).toBeChecked();
    await user.clear(name);
    await user.type(name, 'Layout');
    await user.click(screen.getByLabelText('eli', { selector: 'input' }));
    await user.click(screen.getByRole('button', { name: /Save/ }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 't1', { name: 'Layout', memberIds: [] }));
    expect(await screen.findByRole('listitem', { name: 'Layout' })).toBeInTheDocument();
  });

  it('an admin deletes one, once confirmed', async () => {
    const del = vi.spyOn(teamsService, 'deleteTeam').mockResolvedValue([]);
    renderList();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Delete Animation' }));
    expect(screen.getByText(/Its members stay in the project/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Delete team/ }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('p1', 't1'));
    await waitFor(() => expect(screen.queryByRole('listitem', { name: 'Animation' })).not.toBeInTheDocument());
  });

  it('says why when saving fails, and keeps the dialog open', async () => {
    vi.spyOn(teamsService, 'createTeam').mockRejectedValue(new Error('There\'s already a team called "Animation"'));
    const store = renderList();
    const user = userEvent.setup();
    await screen.findByText('Animation');
    await user.click(screen.getByRole('button', { name: /New team/ }));
    await user.type(screen.getByLabelText('Name'), 'Animation');
    await user.click(screen.getByRole('button', { name: /Create team/ }));
    await waitFor(() => expect(store.getState().apiResponses.responses).toEqual([
      expect.objectContaining({ type: 'error', message: 'There\'s already a team called "Animation"' }),
    ]));
    expect(screen.getByRole('button', { name: /Create team/ })).toBeInTheDocument();
  });

  it("someone who isn't an admin only sees them", async () => {
    renderList(false);
    await screen.findByText('Animation');
    expect(screen.queryByRole('button', { name: /New team/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Animation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Animation' })).not.toBeInTheDocument();
  });

  describe('a team that grants permissions', () => {
    const REASON = "Its members are managed by the project's admins because it grants permissions";
    beforeEach(() => {
      vi.spyOn(teamsService, 'getTeams').mockResolvedValue([
        team({ grantsPermissions: true }),
        team({ id: 't2', name: 'Layout', members: [] }),
      ]);
    });

    it("to an editor who manages teams, says why its members aren't theirs; it can't be deleted", async () => {
      renderList(true, false);
      const granting = await screen.findByRole('listitem', { name: 'Animation' });
      expect(within(granting).getByRole('img', { name: REASON })).toBeInTheDocument();
      expect(within(granting).queryByRole('button', { name: 'Delete Animation' })).not.toBeInTheDocument();
      // One that grants nothing is theirs to delete.
      const plain = screen.getByRole('listitem', { name: 'Layout' });
      expect(within(plain).queryByRole('img', { name: REASON })).not.toBeInTheDocument();
      expect(within(plain).getByRole('button', { name: 'Delete Layout' })).toBeInTheDocument();
    });

    it('they rename it: its members show, but can only be seen, and only its name is sent', async () => {
      const update = vi.spyOn(teamsService, 'updateTeam').mockResolvedValue([team({ name: 'Animators', grantsPermissions: true })]);
      renderList(true, false);
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'Edit Animation' }));
      expect(screen.getByText(new RegExp(REASON))).toBeInTheDocument();
      expect(screen.getByLabelText('eli', { selector: 'input' })).toBeDisabled();
      const name = screen.getByLabelText('Name');
      await user.clear(name);
      await user.type(name, 'Animators');
      await user.click(screen.getByRole('button', { name: /Save/ }));
      await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 't1', { name: 'Animators' }));
    });

    it('an admin changes and deletes it as any other', async () => {
      const update = vi.spyOn(teamsService, 'updateTeam').mockResolvedValue([team({ grantsPermissions: true })]);
      renderList(true, true);
      const user = userEvent.setup();
      const granting = await screen.findByRole('listitem', { name: 'Animation' });
      expect(within(granting).queryByRole('img', { name: REASON })).not.toBeInTheDocument();
      expect(within(granting).getByRole('button', { name: 'Delete Animation' })).toBeInTheDocument();
      await user.click(within(granting).getByRole('button', { name: 'Edit Animation' }));
      await user.click(screen.getByLabelText('vic', { selector: 'input' }));
      await user.click(screen.getByRole('button', { name: /Save/ }));
      await waitFor(() => expect(update).toHaveBeenCalledWith('p1', 't1', { name: 'Animation', memberIds: ['u2', 'u3'] }));
    });
  });
});


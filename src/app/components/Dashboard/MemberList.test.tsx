import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberList } from './MemberList';
import * as projects from '../../../services/projects';
import * as teamsService from '../../../services/teams';

const MEMBERS = [
  { userId: 'u1', username: 'ada', role: 'admin', status: 'active' },
  { userId: 'u2', username: 'eli', role: 'editor', status: 'active' },
  { userId: 'u3', username: 'pat', role: 'editor', status: 'pending' },
];
const Where = () => { const l = useLocation(); return <p data-testid="location">{l.pathname + l.search}</p>; };

const renderMembers = (path = '/project/p1/dashboard/members') => {
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1' }),
      currentProject: () => ({ data: { id: 'p1', name: 'Demo', public: false, members: MEMBERS }, loading: false, error: null, membership: null }),
      apiResponses: (state = { responses: [] as unknown[] }) => state,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/project/:id/dashboard/members" element={<><MemberList /><Where /></>} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(projects, 'fetchProjectMembers').mockResolvedValue(MEMBERS);
  vi.spyOn(teamsService, 'getTeams').mockResolvedValue([]);
});

describe('MemberList', () => {
  it('shows the members, with a Teams tab', async () => {
    renderMembers();
    expect(await screen.findByText('eli')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Members' })).toBeInTheDocument();
    expect(teamsService.getTeams).not.toHaveBeenCalled();
  });

  it('shows the teams in their tab, at its own URL, offering only active members', async () => {
    renderMembers();
    const user = userEvent.setup();
    await screen.findByText('eli');
    await user.click(screen.getByRole('button', { name: 'Teams' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/dashboard/members?tab=teams');
    await user.click(await screen.findByRole('button', { name: /New team/ }));
    expect(screen.getByLabelText('eli')).toBeInTheDocument();
    expect(screen.queryByLabelText('pat')).not.toBeInTheDocument();
  });

  it('opens on the Teams tab from its URL', async () => {
    renderMembers('/project/p1/dashboard/members?tab=teams');
    expect(await screen.findByRole('button', { name: /New team/ })).toBeInTheDocument();
    expect(teamsService.getTeams).toHaveBeenCalledWith('p1');
  });
});

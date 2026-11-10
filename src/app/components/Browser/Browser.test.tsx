import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sessionReducer from '../../../store/sessionSlice';
import currentProject from '../../../store/currentProjectSlice';
import projects from '../../../store/projectsSlice';
import * as members from '../../../services/members';
import * as projectsService from '../../../services/projects';
import { MembershipInfo, ProjectList } from '../../../interfaces';
import { Browser } from './Browser';

const renderBrowser = (props: { preview?: boolean; env?: string } = {}, path = '/project/p1/dashboard/production', membership: MembershipInfo | null = null) => {
  const empty = () => ({ data: null });
  const store = configureStore({
    reducer: {
      session: sessionReducer,
      currentProject,
      projects,
      currentExport: empty, currentWorkflow: empty, currentPipeline: empty, currentStorageFolder: empty,
      documents: () => ({ list: [] }),
      management: () => ({ databases: [], storages: [] }),
      apiResponses: () => ({ responses: [] }),
    },
  });
  store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Demo' } });
  store.dispatch({ type: 'currentProject/setMembership', payload: membership });
  store.dispatch({ type: 'session/setSession', payload: { logged: true, userId: 'u1', username: 'ada' } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/project/:id/*" element={<Browser {...props}><p>Its page</p></Browser>} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

afterEach(() => vi.restoreAllMocks());

describe('Browser', () => {
  it('shows where the user is, as crumbs, and its page', () => {
    renderBrowser();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
    expect(screen.getByText('Its page')).toBeInTheDocument();
  });

  it("has the workspace's mode switch at the end of the crumbs, and it switches it", async () => {
    const store = renderBrowser();
    const toggle = screen.getByRole('switch');
    expect(toggle.closest('section')).toContainElement(screen.getByText('production'));
    const before = store.getState().session.mode;
    await userEvent.setup().click(toggle);
    expect(store.getState().session.mode).not.toBe(before);
  });

  it('a preview has no crumbs, nor the switch', () => {
    renderBrowser({ preview: true });
    expect(screen.queryByText('production')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it("accepting the project's invitation makes the user a member, and the project joins their list", async () => {
    const accept = vi.spyOn(members, 'acceptInvitation').mockResolvedValue({});
    const joined = [{ id: 'p1', name: 'Demo', image: '', archived: false }] as unknown as ProjectList[];
    vi.spyOn(projectsService, 'fetchProjects').mockResolvedValue(joined);
    const store = renderBrowser({ preview: true }, '/project/p1/preview', { isMember: true, status: 'pending' });
    expect(screen.getByText('Project invitation')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Accept/ }));
    expect(accept).toHaveBeenCalledWith('p1', 'u1');
    await waitFor(() => expect(store.getState().projects.list).toEqual(joined));
    expect(store.getState().currentProject.membership).toEqual({ isMember: true, status: 'active' });
    expect(screen.queryByText('Project invitation')).not.toBeInTheDocument();
  });
});

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import sessionReducer from '../../../store/sessionSlice';
import currentProject from '../../../store/currentProjectSlice';
import projects from '../../../store/projectsSlice';
import crumbNames, { nameCrumb } from '../../../store/crumbNamesSlice';
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
      crumbNames,
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

  describe('its crumbs, for the ids in the route', () => {
    const ASSET = '5d1efdae-ce1e-4aec-9d0b-2f1c3e4a5b6c';
    // The crumbs' own (the project's integrations, by the mode, have theirs while it loads).
    const spinners = () => [...document.querySelectorAll('.fa-spinner')].filter(el => !el.closest('[data-testid="project-integrations-button"]'));

    it("never wait forever: an id nothing names is shown as a short id", () => {
      renderBrowser({}, `/project/p1/storage/c-builtin/3d-models/${ASSET}`);
      expect(screen.getByText('3d models')).toBeInTheDocument();
      expect(screen.getByText('5d1efdae')).toBeInTheDocument();
      expect(spinners()).toHaveLength(0);
      // A Mongo id too.
      document.body.innerHTML = '';
      renderBrowser({}, '/project/p1/workflow/exports/0123456789abcdef01234567');
      expect(screen.getByText('01234567')).toBeInTheDocument();
      expect(spinners()).toHaveLength(0);
    });

    it('show the name a page gives an id', () => {
      const store = renderBrowser({}, `/project/p1/storage/c-builtin/3d-models/${ASSET}`);
      act(() => { store.dispatch(nameCrumb({ id: ASSET, name: 'nhexa-icon.glb' })); });
      expect(screen.getByText('nhexa-icon.glb')).toBeInTheDocument();
      expect(screen.queryByText('5d1efdae')).not.toBeInTheDocument();
    });

    it('wait, with a spinner, only while something that names them is loading', () => {
      const store = renderBrowser({}, `/project/p1/storage/c-builtin/3d-models/${ASSET}`);
      act(() => { store.dispatch({ type: 'currentProject/setProjectLoading' }); });
      expect(spinners()).toHaveLength(1);
      act(() => { store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Demo' } }); });
      expect(spinners()).toHaveLength(0);
      expect(screen.getByText('5d1efdae')).toBeInTheDocument();
    });

    it("show a project's storage connection by its name", () => {
      const store = renderBrowser({}, '/project/p1/storage/c-builtin');
      act(() => { store.dispatch({ type: 'currentProject/setCurrentProject', payload: { id: 'p1', name: 'Demo', storageConnections: [{ id: 'c-builtin', name: 'StreamBy' }] } }); });
      expect(screen.getByText('streamby')).toBeInTheDocument();
    });
  });
});

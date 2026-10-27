import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { LateralMenu } from './LateralMenu';
import session, { setMode } from '../../../store/sessionSlice';
import currentProject, { setCurrentProject } from '../../../store/currentProjectSlice';
import projects from '../../../store/projectsSlice';
import apiResponses from '../../../store/apiResponsesSlice';
import workers from '../../../store/workersSlice';
import * as workersService from '../../../services/workers';
import { Project, WorkspaceMode } from '../../../interfaces';
import { worker } from '../../../test/workers';
import { Where } from '../../../test/Where';

const renderMenu = (mode: WorkspaceMode, path = '/project/p1/storage') => {
  const store = configureStore({ reducer: { session, currentProject, projects, apiResponses, workers } });
  store.dispatch(setMode(mode));
  store.dispatch(setCurrentProject({ id: 'p1', name: 'Demo', public: false } as Project));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/project/:id/storage" element={<LateralMenu />} />
          <Route path="*" element={<><LateralMenu /><Where /></>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

beforeEach(() => vi.restoreAllMocks());

describe('LateralMenu — Workers', () => {
  it.each<WorkspaceMode>(['developer', 'designer'])("is a section of its own, listing the project's workers (%s mode)", async mode => {
    vi.spyOn(workersService, 'getWorkers').mockResolvedValue([worker(), worker({ source: 'project', id: 'w2', name: 'Own LOD' })]);
    renderMenu(mode);
    const section = screen.getByTestId('workers-section');
    expect(await within(section).findAllByTestId('workers-section-item')).toHaveLength(2);
    expect(section).toHaveTextContent('glTF optimizer');
    expect(section).toHaveTextContent('Own LOD');
  });

  it('says so when the project has none', async () => {
    vi.spyOn(workersService, 'getWorkers').mockResolvedValue([]);
    renderMenu('designer');
    expect(await within(screen.getByTestId('workers-section')).findByText('No workers yet')).toBeInTheDocument();
  });

  it('goes to the Workers page from its title', async () => {
    vi.spyOn(workersService, 'getWorkers').mockResolvedValue([]);
    renderMenu('designer');
    await userEvent.setup().click(within(screen.getByTestId('workers-section')).getByText('Workers'));
    expect(screen.getByTestId('location')).toHaveTextContent('/project/p1/workers');
  });

  it("isn't in Settings anymore", () => {
    vi.spyOn(workersService, 'getWorkers').mockResolvedValue([]);
    renderMenu('developer', '/project/p1/settings');
    const links = screen.getAllByRole('link').map(a => a.getAttribute('href'));
    expect(links).not.toContain('/project/p1/settings/workers');
  });
});

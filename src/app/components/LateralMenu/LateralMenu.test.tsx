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
import documents from '../../../store/documentsSlice';
import * as workersService from '../../../services/workers';
import { Project, WorkspaceMode } from '../../../interfaces';
import { worker } from '../../../test/workers';
import { Where } from '../../../test/Where';

const renderMenu = (mode: WorkspaceMode, path = '/project/p1/storage', project: Partial<Project> | null = {}) => {
  const store = configureStore({ reducer: { session, currentProject, projects, apiResponses, workers, documents } });
  store.dispatch(setMode(mode));
  if (project) store.dispatch(setCurrentProject({ id: 'p1', name: 'Demo', public: false, ...project } as Project));
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

describe('LateralMenu — Documents', () => {
  it("are in the Dashboard, after Members, not a section of their own", () => {
    vi.spyOn(workersService, 'getWorkers').mockResolvedValue([]);
    renderMenu('designer');
    const links = screen.getAllByRole('link').map(a => a.getAttribute('href'));
    expect(links.slice(links.indexOf('/project/p1/dashboard/overview'), links.indexOf('/project/p1/dashboard/overview') + 3))
      .toEqual(['/project/p1/dashboard/overview', '/project/p1/dashboard/members', '/project/p1/dashboard/documents']);
    expect(screen.queryByTestId('documents-section')).not.toBeInTheDocument();
  });
});

describe('LateralMenu — Production', () => {
  const productionLinks = () => screen.getAllByRole('link', { name: 'Production' }).map(a => a.getAttribute('href'));

  beforeEach(() => { vi.spyOn(workersService, 'getWorkers').mockResolvedValue([]); });

  it.each<WorkspaceMode>(['developer', 'designer'])('is in the Dashboard, after Documents, with no nodes and no data (%s mode)', mode => {
    renderMenu(mode);
    const links = screen.getAllByRole('link').map(a => a.getAttribute('href'));
    expect(links[links.indexOf('/project/p1/dashboard/documents') + 1]).toBe('/project/p1/dashboard/production');
    expect(productionLinks()).toEqual(['/project/p1/dashboard/production']);
  });

  it('is never under Workflow, even with a Shot node saved on the canvas', () => {
    renderMenu('developer', '/project/p1/storage', {
      workflow: { id: 'w1', name: 'Workflow', nodeSchema: { nodes: [{ id: 's', type: 'shotNode' }, { id: 'a', type: 'assemblyNode' }, { id: 'm', type: 'masterNode' }], edges: [] } },
    } as Partial<Project>);
    expect(productionLinks()).toEqual(['/project/p1/dashboard/production']);
    expect(screen.getAllByRole('link').map(a => a.getAttribute('href'))).not.toContain('/project/p1/workflow/production');
  });

  it('shows as active, with the Dashboard, on its page', () => {
    renderMenu('developer', '/project/p1/dashboard/production?shot=s1');
    expect(screen.getByRole('link', { name: 'Production' }).className).toMatch(/activeLink/);
  });
});

describe('LateralMenu — its links are the URL\'s project', () => {
  const hrefs = () => screen.getAllByRole('link').map(a => a.getAttribute('href') ?? '').filter(h => h.startsWith('/project/'));

  beforeEach(() => { vi.spyOn(workersService, 'getWorkers').mockResolvedValue([]); });

  it('before its data loads, every link has its id', () => {
    renderMenu('developer', '/project/p1/storage', null);
    expect(hrefs().length).toBeGreaterThan(3);
    for (const href of hrefs()) expect(href).toMatch(/^\/project\/p1\//);
  });

  it('asks for its workers only once it has loaded', () => {
    renderMenu('developer', '/project/p1/storage', null);
    expect(workersService.getWorkers).not.toHaveBeenCalled();
  });

  it("while another project's data is still there, shows none of it, and links to this one", () => {
    renderMenu('developer', '/project/p2/storage', {
      id: 'p1', name: 'Other', pipelines: [{ id: 'old-pipeline', name: 'Old pipeline' }],
      storageConnections: [{ id: 'old-storage', name: 'Old storage' }],
    } as unknown as Partial<Project>);
    expect(hrefs().length).toBeGreaterThan(3);
    for (const href of hrefs()) expect(href).toMatch(/^\/project\/p2\//);
    expect(screen.queryByText('Other')).not.toBeInTheDocument();
    expect(screen.queryByText('Old storage')).not.toBeInTheDocument();
  });

  it('once loaded, shows its data', () => {
    renderMenu('developer', '/project/p1/storage', { name: 'Mine', storageConnections: [{ id: 's', name: 'My storage' }] } as unknown as Partial<Project>);
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.getByText('My storage')).toBeInTheDocument();
  });
});

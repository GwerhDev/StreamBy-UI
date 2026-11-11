import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntegrationsInfoButton } from './IntegrationsInfoButton';
import { DbConnection, IntegrationConnection, Project, StorageConnection } from '../../../interfaces';
import * as projects from '../../../services/projects';

const db: DbConnection = { id: 'db1', name: 'Postgres', dbType: 'postgresql', projectId: 'p1', source: 'builtin' };
const storage: StorageConnection = { id: 'st1', name: 'Assets', type: 's3' as StorageConnection['type'], projectId: 'p1', source: 'integration' };
const service: IntegrationConnection = { id: 'svc1', name: 'Claude', provider: 'claude', projectId: 'p1', integrationId: 'i1', source: 'integration' };

const project = (connections: Partial<Project> = {}): Project => ({ id: 'p1', name: 'World of Gwerh', public: false, ...connections });

const renderButton = (data: Project | null = project(), loading = false) => {
  const store = configureStore({
    reducer: {
      currentProject: (state = { data, loading, error: null, membership: null }, action: { type: string; payload?: Project }) =>
        action.type === 'currentProject/setCurrentProject' ? { ...state, data: action.payload ?? null } : state,
      // The account's own pool: never what this button shows.
      management: () => ({ integrations: [{ id: 'pool', kind: 'database', name: 'Pool DB', provider: 'mongodb', source: 'integration', available: true }], loading: false, error: null }),
    },
  });
  render(<Provider store={store}><IntegrationsInfoButton /></Provider>);
  return store;
};

describe('IntegrationsInfoButton', () => {
  it("is all connected once the project has a database and a storage (services are optional)", () => {
    renderButton(project({ dbConnections: [db], storageConnections: [storage] }));
    expect(screen.getByTestId('project-integrations-button')).toHaveAttribute('title', 'All integrations connected');
  });

  it('is only "partial" when the project lacks a database or a storage', () => {
    renderButton(project({ dbConnections: [db], integrationConnections: [service] }));
    expect(screen.getByTestId('project-integrations-button')).toHaveAttribute('title', 'Some integrations connected');
  });

  it("lists the project's connections, not the account's integrations", async () => {
    renderButton(project({ dbConnections: [db], storageConnections: [storage], integrationConnections: [service] }));
    await userEvent.setup().click(screen.getByTestId('project-integrations-button'));
    expect(screen.getByText('Postgres')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.queryByText('Pool DB')).not.toBeInTheDocument();
  });

  it('refreshes the project, to show its connections as they are now', async () => {
    const fetched = project({ dbConnections: [db, { ...db, id: 'db2', name: 'Analytics' }] });
    const fetchProject = vi.spyOn(projects, 'fetchProject').mockResolvedValue(fetched);
    const store = renderButton(project({ dbConnections: [db] }));
    const user = userEvent.setup();
    await user.click(screen.getByTestId('project-integrations-button'));
    await user.click(screen.getByTitle('Refresh'));
    expect(fetchProject).toHaveBeenCalledWith('p1');
    expect(await screen.findByText('Analytics')).toBeInTheDocument();
    expect(store.getState().currentProject.data?.dbConnections).toHaveLength(2);
  });

  it('shows loading state', () => {
    renderButton(null, true);
    expect(screen.getByTestId('project-integrations-button')).toHaveAttribute('title', 'Loading integrations…');
  });

  it('shows empty state', () => {
    renderButton();
    expect(screen.getByTestId('project-integrations-button')).toHaveAttribute('title', 'No integrations connected');
  });
});

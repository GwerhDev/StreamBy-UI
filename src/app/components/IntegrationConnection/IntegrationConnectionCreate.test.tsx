import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationConnectionCreate } from './IntegrationConnectionCreate';
import * as integrationConnectionsService from '../../../services/integrationConnections';

const POOL = [
  { id: 'db-int', kind: 'database' as const, name: 'My Postgres', provider: 'postgresql', source: 'integration' as const, available: true },
  { id: 'svc1', kind: 'service' as const, name: 'My Claude', provider: 'claude', source: 'integration' as const, available: true },
  { id: 'svc2', kind: 'service' as const, name: 'My Jira', provider: 'jira', source: 'integration' as const, available: true },
];

const makeStore = () =>
  configureStore({
    reducer: {
      currentProject: () => ({
        data: { id: 'p1', name: 'Demo', public: false, dbConnections: [], storageConnections: [], integrationConnections: [] },
        loading: false, error: null, membership: null,
      }),
      management: () => ({ integrations: POOL, loading: false, error: null }),
      apiResponses: () => ({ responses: [], nextId: 0 }),
    },
  });

const renderForm = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/project/p1/services/create']}>
      <Routes>
        <Route path="/project/:id/services/create" element={<IntegrationConnectionCreate />} />
        <Route path="/project/:id/services" element={<div>List Page</div>} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('IntegrationConnectionCreate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByText('New Service Connection')).toBeInTheDocument();
  });

  it('only lists service-kind integrations in the picker', () => {
    renderForm();
    expect(screen.getByText('My Claude (claude)')).toBeInTheDocument();
    expect(screen.getByText('My Jira (jira)')).toBeInTheDocument();
    expect(screen.queryByText('My Postgres (postgresql)')).not.toBeInTheDocument();
  });

  it('disables Create until an integration is selected', async () => {
    renderForm();
    const user = userEvent.setup();
    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();

    await user.click(screen.getByLabelText('My Claude (claude)'));
    expect(createButton).toBeEnabled();
  });

  it('submits by calling createIntegrationConnection and navigates to the list on success', async () => {
    vi.spyOn(integrationConnectionsService, 'createIntegrationConnection').mockResolvedValue({
      id: 'ic1', name: 'My Claude', provider: 'claude', projectId: 'p1', integrationId: 'svc1', source: 'integration',
    });
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('My Claude (claude)'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(integrationConnectionsService.createIntegrationConnection).toHaveBeenCalledWith('p1', 'svc1');
    expect(await screen.findByText('List Page')).toBeInTheDocument();
  });

  it('shows an error toast path without navigating when creation fails', async () => {
    vi.spyOn(integrationConnectionsService, 'createIntegrationConnection').mockRejectedValue(new Error('boom'));
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('My Claude (claude)'));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(integrationConnectionsService.createIntegrationConnection).toHaveBeenCalled();
    expect(screen.getByText('New Service Connection')).toBeInTheDocument();
  });
});

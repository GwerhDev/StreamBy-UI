import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationConnectionList } from './IntegrationConnectionList';
import * as resources from '../../../services/projectResources';

const BASE_PROJECT = {
  id: 'p1', name: 'Demo', public: false,
  integrationConnections: [
    { id: 'ic1', name: 'My Claude', provider: 'claude', projectId: 'p1', integrationId: 'int1', source: 'integration' as const },
  ],
};

const makeStore = (overrides: Partial<typeof BASE_PROJECT> = {}, loading = false) =>
  configureStore({
    reducer: {
      currentProject: () => ({
        data: { ...BASE_PROJECT, ...overrides },
        loading, error: null, membership: null,
      }),
      apiResponses: () => ({ responses: [], nextId: 0 }),
    },
  });

const renderList = (store = makeStore()) => render(
  <Provider store={store}>
    <MemoryRouter initialEntries={['/project/p1/services']}>
      <Routes>
        <Route path="/project/:id/services" element={<IntegrationConnectionList />} />
        <Route path="/project/:id/services/create" element={<div>Create Page</div>} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('IntegrationConnectionList', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders the project integrationConnections', () => {
    renderList();
    expect(screen.getByText('My Claude')).toBeInTheDocument();
  });

  it('shows a loading skeleton while project is loading', () => {
    renderList(makeStore({}, true));
    expect(screen.queryByText('My Claude')).not.toBeInTheDocument();
  });

  it('shows the "Add connection" header action when there are no connections', () => {
    renderList(makeStore({ integrationConnections: [] }));
    expect(screen.getByRole('button', { name: 'Add connection' })).toBeInTheDocument();
  });

  it('disconnects a connection by its integration, once confirmed', async () => {
    const remove = vi.spyOn(resources, 'removeResource').mockResolvedValue({ key: 'integrationConnections', value: [] });
    vi.spyOn(resources, 'getDependents').mockResolvedValue([]);
    renderList();
    const user = userEvent.setup();
    await user.click(screen.getByTitle('Disconnect'));
    expect(remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^Disconnect$/ }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('p1', 'service', expect.objectContaining({ id: 'ic1', integrationId: 'int1' })));
  });

  it('navigates to the create route via the dashed "New connection" card', async () => {
    renderList();
    const user = userEvent.setup();
    await user.click(screen.getByText('New connection'));
    expect(screen.getByText('Create Page')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DbConnectionCreate } from './DbConnectionCreate';
import * as databaseService from '../../../services/database';

const makeStore = () =>
  configureStore({
    reducer: {
      currentProject: () => ({
        data: { id: 'p1', name: 'Demo', public: false, storageConnections: [], dbConnections: [] },
        loading: false, error: null, membership: null,
      }),
      management: () => ({ integrations: [], loading: false, error: null }),
    },
  });

const renderForm = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/project/p1/database/create']}>
      <Routes>
        <Route path="/project/:id/database/create" element={<DbConnectionCreate />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('DbConnectionCreate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByText('New DB Connection')).toBeInTheDocument();
  });

  it('hides the manual-only fields (including the credential input) while in integration mode', () => {
    renderForm();
    expect(screen.queryByLabelText('Credential (connection string)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('sends credential in manual mode, never credentialId or integrationId', async () => {
    vi.spyOn(databaseService, 'createDbConnection').mockResolvedValue({
      id: 'd1', name: 'My DB', dbType: 'postgresql', projectId: 'p1', hasCredential: true, source: 'manual',
    });
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Use an integration' }));
    await user.click(screen.getByText('Configure manually'));

    await user.type(screen.getByLabelText('Name'), 'My DB');
    await user.type(screen.getByLabelText('Credential (connection string)'), 'postgresql://user:pass@host/db');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(databaseService.createDbConnection).toHaveBeenCalledWith(
      'p1', expect.objectContaining({ credential: 'postgresql://user:pass@host/db' }),
    );
    const payload = vi.mocked(databaseService.createDbConnection).mock.calls[0][1];
    expect(payload).not.toHaveProperty('credentialId');
    expect(payload).not.toHaveProperty('integrationId');
  });
});

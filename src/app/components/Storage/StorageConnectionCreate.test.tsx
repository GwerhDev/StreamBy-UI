import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageConnectionCreate } from './StorageConnectionCreate';
import * as storageConnectionsService from '../../../services/storageConnections';

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
    <MemoryRouter initialEntries={['/project/p1/storage/create']}>
      <Routes>
        <Route path="/project/:id/storage/create" element={<StorageConnectionCreate />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('StorageConnectionCreate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByText('New Storage Connection')).toBeInTheDocument();
  });

  it('hides the manual-only fields (including the credential input) while in integration mode', () => {
    renderForm();
    expect(screen.queryByLabelText('Credential (JSON config)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('sends credential in manual mode, never credentialId or integrationId', async () => {
    vi.spyOn(storageConnectionsService, 'createStorageConnection').mockResolvedValue({
      id: 's1', name: 'My Bucket', type: 's3', projectId: 'p1', hasCredential: true, source: 'manual',
    });
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Use an integration' }));
    await user.click(screen.getByText('Configure manually'));

    await user.type(screen.getByLabelText('Name'), 'My Bucket');
    await user.type(screen.getByLabelText('Credential (JSON config)'), '{{"bucket":"x"}');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(storageConnectionsService.createStorageConnection).toHaveBeenCalledWith(
      'p1', expect.objectContaining({ credential: '{"bucket":"x"}' }),
    );
    const payload = vi.mocked(storageConnectionsService.createStorageConnection).mock.calls[0][1];
    expect(payload).not.toHaveProperty('credentialId');
    expect(payload).not.toHaveProperty('integrationId');
  });
});

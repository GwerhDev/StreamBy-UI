import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateConnectionForm } from './UpdateConnectionForm';
import * as connectionsService from '../../../services/connections';

const CONNECTION = {
  id: 'c1', name: 'My API', apiUrl: 'https://api.example.com', method: 'GET' as const,
  projectId: 'p1', prefix: 'Bearer', hasCredential: true,
};

const makeStore = (connections = [CONNECTION]) =>
  configureStore({
    reducer: {
      currentProject: () => ({
        data: { id: 'p1', name: 'Demo', public: false, connections },
        loading: false, error: null, membership: null,
      }),
    },
  });

const renderForm = (connections = [CONNECTION]) => render(
  <Provider store={makeStore(connections)}>
    <MemoryRouter initialEntries={['/project/p1/connections/c1/edit']}>
      <Routes>
        <Route path="/project/:id/connections/:connectionId/edit" element={<UpdateConnectionForm />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('UpdateConnectionForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByText('Edit API Connection')).toBeInTheDocument();
  });

  it('never prefills the secret input, even when hasCredential is true', () => {
    renderForm();
    const secretInput = screen.getByLabelText('Secret (token / API key)') as HTMLInputElement;
    expect(secretInput.value).toBe('');
  });

  it('does not send token when the secret field is left blank (preserves existing credential)', async () => {
    vi.spyOn(connectionsService, 'updateConnection').mockResolvedValue({ ...CONNECTION });
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    const payload = vi.mocked(connectionsService.updateConnection).mock.calls[0][2];
    expect(payload).not.toHaveProperty('token');
  });

  it('sends token, and never credentialId, when the secret field is filled in to replace it', async () => {
    vi.spyOn(connectionsService, 'updateConnection').mockResolvedValue({ ...CONNECTION });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Secret (token / API key)'), 'sk-new-secret');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(connectionsService.updateConnection).toHaveBeenCalledWith(
      'p1', 'c1', expect.objectContaining({ token: 'sk-new-secret' }),
    );
    const payload = vi.mocked(connectionsService.updateConnection).mock.calls[0][2];
    expect(payload).not.toHaveProperty('credentialId');
  });
});

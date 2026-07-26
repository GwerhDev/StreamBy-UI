import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateConnectionForm } from './CreateConnectionForm';
import * as connectionsService from '../../../services/connections';

const makeStore = () =>
  configureStore({
    reducer: {
      currentProject: () => ({
        data: { id: 'p1', name: 'Demo', public: false, connections: [] },
        loading: false, error: null, membership: null,
      }),
    },
  });

const renderForm = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/project/p1/connections/create']}>
      <Routes>
        <Route path="/project/:id/connections/create" element={<CreateConnectionForm />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('CreateConnectionForm', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders without crashing', () => {
    renderForm();
    expect(screen.getByText('New API Connection')).toBeInTheDocument();
  });

  it('disables Create until name and API URL are filled', async () => {
    renderForm();
    const user = userEvent.setup();
    const createButton = screen.getByRole('button', { name: /create/i });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'My API');
    await user.type(screen.getByLabelText('API URL'), 'https://api.example.com');
    expect(createButton).not.toBeDisabled();
  });

  it('sends token and prefix, never credentialId, when "uses a credential" is checked', async () => {
    vi.spyOn(connectionsService, 'createConnection').mockResolvedValue({
      id: 'c1', name: 'My API', apiUrl: 'https://api.example.com', method: 'POST', hasCredential: true, projectId: 'p1',
    });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), 'My API');
    await user.type(screen.getByLabelText('API URL'), 'https://api.example.com');
    await user.click(screen.getByText('This connection uses a credential'));
    await user.type(screen.getByLabelText('Secret (token / API key)'), 'sk-secret');
    await user.type(screen.getByLabelText('Auth Prefix (optional)'), 'Bearer');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(connectionsService.createConnection).toHaveBeenCalledWith(
      'p1', expect.objectContaining({ token: 'sk-secret', prefix: 'Bearer' }),
    );
    const payload = vi.mocked(connectionsService.createConnection).mock.calls[0][1];
    expect(payload).not.toHaveProperty('credentialId');
  });

  it('does not send token/prefix when "uses a credential" is left unchecked', async () => {
    vi.spyOn(connectionsService, 'createConnection').mockResolvedValue({
      id: 'c1', name: 'My API', apiUrl: 'https://api.example.com', method: 'POST', hasCredential: false, projectId: 'p1',
    });
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Name'), 'My API');
    await user.type(screen.getByLabelText('API URL'), 'https://api.example.com');
    await user.click(screen.getByRole('button', { name: /create/i }));

    const payload = vi.mocked(connectionsService.createConnection).mock.calls[0][1];
    expect(payload).not.toHaveProperty('token');
    expect(payload).not.toHaveProperty('prefix');
  });
});

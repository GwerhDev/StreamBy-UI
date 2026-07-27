import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserIntegrationCreate } from './UserIntegrationCreate';
import * as userIntegrationsService from '../../../services/userIntegrations';

const makeStore = () =>
  configureStore({
    reducer: {
      management: () => ({ integrations: [], loading: false, error: null }),
      apiResponses: () => ({ responses: [], nextId: 0 }),
    },
  });

const renderForm = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/user/integrations/create']}>
      <Routes>
        <Route path="/user/integrations/create" element={<UserIntegrationCreate />} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

// Kind/Provider use the custom DropdownInput component (a button + portal list), not a
// native <select> — open it by clicking the currently-selected label, then click the option.
const selectDropdown = async (user: ReturnType<typeof userEvent.setup>, currentLabel: string, optionLabel: string) => {
  await user.click(screen.getByText(currentLabel));
  await user.click(screen.getByText(optionLabel));
};

describe('UserIntegrationCreate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders with kind=database by default', () => {
    renderForm();
    expect(screen.getByText('New Integration')).toBeInTheDocument();
    expect(screen.getByLabelText('Connection string')).toBeInTheDocument();
  });

  it('shows the 3 service providers when kind=service is selected', async () => {
    renderForm();
    const user = userEvent.setup();
    await selectDropdown(user, 'Database', 'Service');
    // Provider dropdown defaults to Claude (first SERVICE_PROVIDERS option) on kind change.
    expect(screen.getByLabelText('API key')).toBeInTheDocument();
    await user.click(screen.getByText('Claude'));
    expect(screen.getByText('Jira')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('shows the API key field for provider=claude and enables Create once filled', async () => {
    renderForm();
    const user = userEvent.setup();
    await selectDropdown(user, 'Database', 'Service');
    expect(screen.getByLabelText('API key')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'My Claude Key');
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await user.type(screen.getByLabelText('API key'), 'sk-ant-test');
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('hides credential fields and shows a Connect button for provider=jira, never calling createUserIntegration', async () => {
    vi.spyOn(userIntegrationsService, 'createUserIntegration').mockResolvedValue({
      id: 'i1', kind: 'service', name: 'Jira', provider: 'jira', source: 'integration', available: true,
    } as any);
    renderForm();
    const user = userEvent.setup();
    await selectDropdown(user, 'Database', 'Service');
    await selectDropdown(user, 'Claude', 'Jira');

    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create' })).not.toBeInTheDocument();

    const connectButton = screen.getByRole('button', { name: 'Conectar con Jira' });
    expect(connectButton).toBeInTheDocument();

    await user.click(connectButton);
    expect(userIntegrationsService.createUserIntegration).not.toHaveBeenCalled();
  });

  it('shows a Connect button for provider=google too', async () => {
    renderForm();
    const user = userEvent.setup();
    await selectDropdown(user, 'Database', 'Service');
    await selectDropdown(user, 'Claude', 'Google');
    expect(screen.getByRole('button', { name: 'Conectar con Google' })).toBeInTheDocument();
  });
});

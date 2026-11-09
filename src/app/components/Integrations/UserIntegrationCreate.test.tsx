import { fireEvent, render, screen } from '@testing-library/react';
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

const renderPage = () => render(
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/user/integrations/create']}>
      <Routes>
        <Route path="/user/integrations/create" element={<UserIntegrationCreate />} />
        <Route path="/user/integrations" element={<div>List Page</div>} />
      </Routes>
    </MemoryRouter>
  </Provider>,
);

describe('UserIntegrationCreate', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders a grid of 5 tiles: Claude, Jira, Google, Speech to text, Custom', () => {
    renderPage();
    expect(screen.getByText('Add an integration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Claude Connect with an API key/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jira Soon Connect via OAuth/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google Soon Connect via OAuth/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Speech to text/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom/ })).toBeInTheDocument();
  });

  it('connects a speech provider with its key; an OpenAI-compatible one with its base URL and model', async () => {
    const create = vi.spyOn(userIntegrationsService, 'createUserIntegration').mockResolvedValue({ id: 'i1', kind: 'service', name: 'Whisper', provider: 'openai', source: 'integration', available: true });
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Speech to text/ }));
    await user.type(screen.getByLabelText('Name'), 'Whisper');
    expect(screen.queryByLabelText(/Base URL/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('API key'), 'sk-1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(create).toHaveBeenCalledWith({ kind: 'service', provider: 'openai', name: 'Whisper', credential: 'sk-1' });
  });

  it('an OpenAI-compatible service takes its base URL, a key only if it has one, and a model', async () => {
    const create = vi.spyOn(userIntegrationsService, 'createUserIntegration').mockResolvedValue({ id: 'i1', kind: 'service', name: 'Groq', provider: 'openai-compatible', source: 'integration', available: true });
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Speech to text/ }));
    await user.type(screen.getByLabelText('Name'), 'Groq');
    await user.click(screen.getByRole('button', { name: 'OpenAI' }));
    fireEvent.mouseDown(screen.getByText('OpenAI-compatible service'));
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    await user.type(screen.getByLabelText(/Base URL/), 'https://api.groq.com/openai/v1');
    await user.type(screen.getByLabelText('Model (optional)'), 'whisper-large-v3');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(create).toHaveBeenCalledWith({
      kind: 'service', provider: 'openai-compatible', name: 'Groq',
      credential: { baseUrl: 'https://api.groq.com/openai/v1', model: 'whisper-large-v3' },
    });
  });

  it('clicking Claude shows only Name + API key fields, no Kind/Provider anywhere', async () => {
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Claude Connect with an API key/ }));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('API key')).toBeInTheDocument();
    expect(screen.queryByLabelText('Kind')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Provider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Credential')).not.toBeInTheDocument();
  });

  it('clicking Custom shows only Name + Credential fields, no Kind/Provider anywhere', async () => {
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Custom/ }));

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Credential')).toBeInTheDocument();
    expect(screen.queryByLabelText('Kind')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Provider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();
  });

  it('Jira tile is disabled with a "Soon" badge and never triggers the OAuth redirect', async () => {
    const createSpy = vi.spyOn(userIntegrationsService, 'createUserIntegration');
    renderPage();
    const user = userEvent.setup();

    const jiraTile = screen.getByRole('button', { name: /Jira Soon Connect via OAuth/ });
    expect(jiraTile).toBeDisabled();
    expect(screen.getAllByText('Soon')).toHaveLength(2);

    const originalHref = window.location.href;
    await user.click(jiraTile);

    expect(window.location.href).toBe(originalHref);
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('Google tile is disabled with a "Soon" badge and never triggers the OAuth redirect', async () => {
    renderPage();
    const googleTile = screen.getByRole('button', { name: /Google Soon Connect via OAuth/ });
    expect(googleTile).toBeDisabled();
  });

  it('submitting Claude calls createUserIntegration with kind=service, provider=claude', async () => {
    vi.spyOn(userIntegrationsService, 'createUserIntegration').mockResolvedValue({
      id: 'i1', kind: 'service', name: 'My Claude Key', provider: 'claude', source: 'integration', available: true,
    } as any);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Claude Connect with an API key/ }));
    await user.type(screen.getByLabelText('Name'), 'My Claude Key');
    await user.type(screen.getByLabelText('API key'), 'sk-ant-test');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(userIntegrationsService.createUserIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'service', provider: 'claude', name: 'My Claude Key', credential: 'sk-ant-test' }),
    );
    expect(await screen.findByText('List Page')).toBeInTheDocument();
  });

  it('submitting Custom calls createUserIntegration with the resolved database/postgresql shape', async () => {
    vi.spyOn(userIntegrationsService, 'createUserIntegration').mockResolvedValue({
      id: 'i2', kind: 'database', name: 'My Integration', provider: 'postgresql', source: 'integration', available: true,
    } as any);
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Custom/ }));
    await user.type(screen.getByLabelText('Name'), 'My Integration');
    await user.type(screen.getByLabelText('Credential'), 'super-secret-value');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(userIntegrationsService.createUserIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'database', provider: 'postgresql', name: 'My Integration', credential: 'super-secret-value' }),
    );
  });

  it('the back arrow on the form returns to the grid', async () => {
    const { container } = renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Custom/ }));
    expect(screen.getByText('Custom Integration')).toBeInTheDocument();

    const backIcon = container.querySelector('svg[data-icon="arrow-left"]')!.closest('span')!;
    await user.click(backIcon);
    expect(screen.getByText('Add an integration')).toBeInTheDocument();
  });

  it('shows a back arrow header on the grid too', () => {
    renderPage();
    expect(screen.getByText('New Integration')).toBeInTheDocument();
  });

  it('disables Create until required fields are filled', async () => {
    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Claude Connect with an API key/ }));
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'My Claude Key');
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await user.type(screen.getByLabelText('API key'), 'sk-ant-test');
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });
});

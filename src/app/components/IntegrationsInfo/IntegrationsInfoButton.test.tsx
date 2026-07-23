import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntegrationsInfoButton } from './IntegrationsInfoButton';
import { IntegrationPoolEntry } from '../../../interfaces';

const makeStore = (integrations: IntegrationPoolEntry[], loading = false) =>
  configureStore({
    reducer: {
      management: () => ({ integrations, loading, error: null }),
    },
  });

const renderButton = (integrations: IntegrationPoolEntry[] = [], loading = false) =>
  render(
    <Provider store={makeStore(integrations, loading)}>
      <IntegrationsInfoButton />
    </Provider>
  );

const db: IntegrationPoolEntry = { id: 'db1', kind: 'database', name: 'Postgres', provider: 'postgresql', source: 'builtin', available: true };
const storage: IntegrationPoolEntry = { id: 'st1', kind: 'storage', name: 'S3', provider: 's3', source: 'builtin', available: true };

describe('IntegrationsInfoButton', () => {
  it('renders without crashing', () => {
    renderButton();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with required props', () => {
    renderButton([db, storage]);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'All integrations connected');
  });

  it('handles user interaction', async () => {
    renderButton([db]);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderButton([], true);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Loading integrations…');
  });

  it('shows empty/disabled state', () => {
    renderButton([]);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'No integrations connected');
  });
});

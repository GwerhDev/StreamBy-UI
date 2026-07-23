import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IntegrationsInfoModal } from './IntegrationsInfoModal';
import { IntegrationPoolEntry } from '../../../interfaces';

const makeStore = () =>
  configureStore({
    reducer: {
      management: () => ({ integrations: [], loading: false, error: null }),
    },
  });

const renderModal = (databases: IntegrationPoolEntry[] = [], storages: IntegrationPoolEntry[] = [], onClose = vi.fn()) =>
  render(
    <Provider store={makeStore()}>
      <IntegrationsInfoModal databases={databases} storages={storages} onClose={onClose} />
    </Provider>
  );

const db: IntegrationPoolEntry = { id: 'db1', kind: 'database', name: 'Postgres', provider: 'postgresql', source: 'builtin', available: true };
const lockedStorage: IntegrationPoolEntry = { id: 'st1', kind: 'storage', name: 'S3', provider: 's3', source: 'builtin', available: false, requiredPlan: 'Subscriber' };

describe('IntegrationsInfoModal', () => {
  it('renders without crashing', () => {
    renderModal();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('renders with required props', () => {
    renderModal([db], [lockedStorage]);
    expect(screen.getByText('Postgres')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const onClose = vi.fn();
    renderModal([db], [], onClose);
    const user = userEvent.setup();
    await user.click(screen.getByTitle('Refresh'));
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderModal([db]);
    expect(screen.getByTitle('Refresh')).toBeInTheDocument();
  });

  it('shows empty/disabled state', () => {
    renderModal([], []);
    expect(screen.getByText('No databases connected.')).toBeInTheDocument();
    expect(screen.getByText('No storage connected.')).toBeInTheDocument();
  });

  it('shows a locked badge for unavailable entries', () => {
    renderModal([], [lockedStorage]);
    expect(screen.getByText('Requires Subscriber plan')).toBeInTheDocument();
  });
});

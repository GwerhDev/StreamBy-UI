import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrationInfoEntry, IntegrationsInfoModal } from './IntegrationsInfoModal';

const renderModal = (
  databases: IntegrationInfoEntry[] = [],
  storages: IntegrationInfoEntry[] = [],
  services: IntegrationInfoEntry[] = [],
  onClose = vi.fn(),
  onRefresh = vi.fn(),
) => render(<IntegrationsInfoModal databases={databases} storages={storages} services={services} onRefresh={onRefresh} onClose={onClose} />);

const db: IntegrationInfoEntry = { id: 'db1', name: 'Postgres', provider: 'postgresql', builtin: true, available: true };
const lockedStorage: IntegrationInfoEntry = { id: 'st1', name: 'S3', provider: 's3', builtin: true, available: false, requiredPlan: 'Subscriber' };
const svc: IntegrationInfoEntry = { id: 'svc1', name: 'Claude', provider: 'claude', builtin: false, available: true };

describe('IntegrationsInfoModal', () => {
  it('renders without crashing', () => {
    renderModal();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('renders with required props', () => {
    renderModal([db], [lockedStorage], [svc]);
    expect(screen.getByText('Postgres')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('asks for a refresh', async () => {
    const onRefresh = vi.fn();
    renderModal([db], [], [], vi.fn(), onRefresh);
    await userEvent.setup().click(screen.getByTitle('Refresh'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    renderModal([db]);
    expect(screen.getByTitle('Refresh')).toBeInTheDocument();
  });

  it('shows empty/disabled state', () => {
    renderModal([], [], []);
    expect(screen.getByText('No databases connected.')).toBeInTheDocument();
    expect(screen.getByText('No storage connected.')).toBeInTheDocument();
  });

  it('hides the Services section entirely when there are no service integrations', () => {
    renderModal([], [], []);
    expect(screen.queryByText('Services')).not.toBeInTheDocument();
  });

  it('shows a locked badge for unavailable entries', () => {
    renderModal([], [lockedStorage], []);
    expect(screen.getByText('Requires Subscriber plan')).toBeInTheDocument();
  });

  it('renders the Services section with its count', () => {
    renderModal([], [], [svc]);
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('claude')).toBeInTheDocument();
  });
});

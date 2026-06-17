import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProjectQuickAccess } from './ProjectQuickAccess';

const renderComponent = (readonly = false) =>
  render(
    <MemoryRouter>
      <ProjectQuickAccess projectId="p1" readonly={readonly} />
    </MemoryRouter>
  );

describe('ProjectQuickAccess', () => {
  it('renders quick access title', () => {
    renderComponent();
    expect(screen.getByText('Quick access')).toBeInTheDocument();
  });

  it('renders all links when not readonly', () => {
    renderComponent();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
  });

  it('hides admin-only links when readonly', () => {
    renderComponent(true);
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Permissions')).not.toBeInTheDocument();
  });

  it('renders link descriptions', () => {
    renderComponent();
    expect(screen.getByText('Browse tables and collections')).toBeInTheDocument();
  });

  it('navigates on card click', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByText('Database'));
  });
});

import { render, screen } from '@testing-library/react';
import { ExploreProjectCard } from './ExploreProjectCard';
import { ExploreProject } from '../../../interfaces';

const base: ExploreProject = { id: '1', name: 'Explore', memberCount: 5, isMember: false, hasPendingRequest: false };

describe('ExploreProjectCard', () => {
  it('renders project name', () => {
    render(<ExploreProjectCard project={base} />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(<ExploreProjectCard project={base} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows Member badge when isMember', () => {
    render(<ExploreProjectCard project={{ ...base, isMember: true }} />);
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('shows Pending badge when hasPendingRequest', () => {
    render(<ExploreProjectCard project={{ ...base, hasPendingRequest: true }} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('does not show Member or Pending badges by default', () => {
    render(<ExploreProjectCard project={base} />);
    expect(screen.queryByText('Member')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });
});

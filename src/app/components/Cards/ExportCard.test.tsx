import { render, screen } from '@testing-library/react';
import { ExportCard } from './ExportCard';
import { Export } from '../../../interfaces';

const baseExport: Export = {
  id: '1', name: 'users', description: 'User list', method: 'GET',
  status: 'completed', createdAt: '2024-01-01', updatedAt: '2024-01-01',
  projectId: 'p1', exportedBy: 'user1',
};

describe('ExportCard', () => {
  it('renders export name with slash prefix', () => {
    render(<ExportCard exports={baseExport} />);
    expect(screen.getByText('/users')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ExportCard exports={baseExport} />);
    expect(screen.getByText('User list')).toBeInTheDocument();
  });

  it('renders method badge', () => {
    render(<ExportCard exports={baseExport} />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('shows fingerprint icon when credentialId is set', () => {
    render(<ExportCard exports={{ ...baseExport, credentialId: 'cred-1' }} />);
    expect(screen.getByTitle('Uses credentials')).toBeInTheDocument();
  });

  it('shows lock icon when private', () => {
    render(<ExportCard exports={{ ...baseExport, private: true }} />);
    expect(screen.getByTitle('Private export')).toBeInTheDocument();
  });

  it('does not show credential/lock icons by default', () => {
    render(<ExportCard exports={baseExport} />);
    expect(screen.queryByTitle('Uses credentials')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Private export')).not.toBeInTheDocument();
  });
});

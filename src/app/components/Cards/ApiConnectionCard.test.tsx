import { render, screen } from '@testing-library/react';
import { ApiConnectionCard } from './ApiConnectionCard';
import { ApiConnection } from '../../../interfaces';

const connection: ApiConnection = {
  id: '1', name: 'Weather API', apiUrl: 'https://api.weather.com',
  method: 'GET', projectId: 'p1',
};

describe('ApiConnectionCard', () => {
  it('renders connection name', () => {
    render(<ApiConnectionCard connection={connection} />);
    expect(screen.getByText('Weather API')).toBeInTheDocument();
  });

  it('renders apiUrl as subtitle', () => {
    render(<ApiConnectionCard connection={connection} />);
    expect(screen.getByText('https://api.weather.com')).toBeInTheDocument();
  });

  it('renders method badge', () => {
    render(<ApiConnectionCard connection={connection} />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('shows fingerprint icon when credentialId is set', () => {
    render(<ApiConnectionCard connection={{ ...connection, credentialId: 'cred-1' }} />);
    expect(screen.getByTitle('Uses credentials')).toBeInTheDocument();
  });

  it('does not show fingerprint icon when no credentialId', () => {
    render(<ApiConnectionCard connection={connection} />);
    expect(screen.queryByTitle('Uses credentials')).not.toBeInTheDocument();
  });
});

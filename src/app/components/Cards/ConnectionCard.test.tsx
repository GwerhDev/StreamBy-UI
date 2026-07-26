import { render, screen } from '@testing-library/react';
import { ConnectionCard } from './ConnectionCard';
import { Connection } from '../../../interfaces';

const connection: Connection = {
  id: '1', name: 'Weather API', apiUrl: 'https://api.weather.com',
  method: 'GET', projectId: 'p1',
};

describe('ConnectionCard', () => {
  it('renders connection name', () => {
    render(<ConnectionCard connection={connection} />);
    expect(screen.getByText('Weather API')).toBeInTheDocument();
  });

  it('renders apiUrl as subtitle', () => {
    render(<ConnectionCard connection={connection} />);
    expect(screen.getByText('https://api.weather.com')).toBeInTheDocument();
  });

  it('renders method badge', () => {
    render(<ConnectionCard connection={connection} />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('shows fingerprint icon when hasCredential is true', () => {
    render(<ConnectionCard connection={{ ...connection, hasCredential: true }} />);
    expect(screen.getByTitle('Uses credentials')).toBeInTheDocument();
  });

  it('does not show fingerprint icon when hasCredential is false', () => {
    render(<ConnectionCard connection={connection} />);
    expect(screen.queryByTitle('Uses credentials')).not.toBeInTheDocument();
  });
});

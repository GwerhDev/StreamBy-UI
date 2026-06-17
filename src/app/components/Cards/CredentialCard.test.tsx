import { render, screen } from '@testing-library/react';
import { CredentialCard } from './CredentialCard';

const credential = { id: '1', key: 'API_KEY', value: 'secret' };

describe('CredentialCard', () => {
  it('renders credential key', () => {
    render(<CredentialCard credential={credential} />);
    expect(screen.getByText('API_KEY')).toBeInTheDocument();
  });

  it('renders key icon', () => {
    render(<CredentialCard credential={credential} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

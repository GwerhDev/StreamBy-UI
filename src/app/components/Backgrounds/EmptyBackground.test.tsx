import { render, screen } from '@testing-library/react';
import { EmptyBackground } from './EmptyBackground';

describe('EmptyBackground', () => {
  it('renders empty state message', () => {
    render(<EmptyBackground />);
    expect(screen.getByText(/emptiness/i)).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<EmptyBackground />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

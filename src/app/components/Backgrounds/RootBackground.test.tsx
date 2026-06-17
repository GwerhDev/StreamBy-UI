import { render, screen } from '@testing-library/react';
import { RootBackground } from './RootBackground';

describe('RootBackground', () => {
  it('renders heading', () => {
    render(<RootBackground />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<RootBackground />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
